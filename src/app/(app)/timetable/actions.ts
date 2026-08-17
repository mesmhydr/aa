"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { PERIOD_TIMES } from "@/lib/timetable";

const entrySchema = z.object({
  id: z.string().optional(),
  academicSemesterId: z.string().min(1),
  dayOfWeek: z.string().min(1),
  periodNumber: z.coerce.number().int().min(1).max(12),
  courseOfferingId: z.string().min(1),
  facultyId: z.string().optional().or(z.literal("")),
  roomId: z.string().optional().or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  isLab: z.boolean().optional(),
});

export async function saveTimetableEntry(input: z.infer<typeof entrySchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, input.id ? "timetable.edit" : "timetable.create");
    const d = entrySchema.parse(input);

    const conflicts = await prisma.timetableEntry.findMany({
      where: {
        isActive: true,
        academicSemesterId: d.academicSemesterId,
        dayOfWeek: d.dayOfWeek as never,
        periodNumber: d.periodNumber,
        id: { not: d.id ?? "none" },
        OR: [
          { roomId: d.roomId || "none" },
          { facultyId: d.facultyId || "none" },
        ],
      },
      include: { courseOffering: { include: { course: true, department: true } }, room: true, academicSemester: true },
    });
    if (conflicts.length > 0) {
      const c = conflicts[0];
      return { ok: false as const, error: `Conflict: ${c.courseOffering.course.code} already scheduled for ${c.courseOffering.department.name} on this slot${c.room ? ` (room ${c.room.code})` : ""}` };
    }

    const data = {
      academicSemesterId: d.academicSemesterId,
      dayOfWeek: d.dayOfWeek as never,
      periodNumber: d.periodNumber,
      courseOfferingId: d.courseOfferingId,
      facultyId: d.facultyId || null,
      roomId: d.roomId || null,
      startTime: d.startTime || null,
      endTime: d.endTime || null,
      isLab: d.isLab ?? false,
    };

    if (d.id) {
      await prisma.timetableEntry.update({ where: { id: d.id }, data });
    } else {
      await prisma.timetableEntry.create({ data });
    }
    await logAudit({ userId: access.userId, action: "timetable.upsert", module: "timetable", entityType: "TimetableEntry", entityId: d.id ?? undefined, newValues: data });
    revalidatePath("/timetable");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteTimetableEntry(id: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "timetable.edit");
    await prisma.timetableEntry.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/timetable");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const cellSchema = z.object({
  academicSemesterId: z.string().min(1),
  sectionId: z.string().optional().or(z.literal("")),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  periodNumber: z.coerce.number().int().min(1).max(12),
  courseId: z.string().min(1),
  facultyId: z.string().optional().or(z.literal("")),
  roomId: z.string().optional().or(z.literal("")),
});

/**
 * Grid-editor save: assigns a course (picked from the catalog) to a
 * day + period cell of the department's timetable for a semester. If the
 * course doesn't have an offering for that department & semester yet, one is
 * created on the fly (with auto-registration of the enrolled students).
 */
export async function saveTimetableCell(input: z.infer<typeof cellSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "timetable.create");
    const d = cellSchema.parse(input);

    const times = PERIOD_TIMES[d.periodNumber];
    if (!times) return { ok: false as const, error: "Invalid period" };

    const course = await prisma.course.findUnique({
      where: { id: d.courseId },
      select: { id: true, code: true, name: true, departmentId: true },
    });
    if (!course) return { ok: false as const, error: "Course not found" };
    if (access.departmentIds.length && !access.departmentIds.includes(course.departmentId) && !access.isInstitutionAdmin) {
      return { ok: false as const, error: "Not authorized for this department" };
    }

    const existingSlot = await prisma.timetableEntry.findFirst({
      where: {
        academicSemesterId: d.academicSemesterId,
        dayOfWeek: d.dayOfWeek,
        periodNumber: d.periodNumber,
        ...(d.sectionId ? { sectionId: d.sectionId } : {}),
        isActive: true,
      },
      include: { courseOffering: { include: { course: true } } },
    });

    // Find or create the course offering for this department + semester.
    const offering = await getOrCreateOffering(course.id, course.departmentId, d.academicSemesterId);

    // Per-section conflict rules:
    // - the same course can't be scheduled twice in the same section+slot
    // - a room can't host two classes in the same slot (across sections too)
    // - a faculty member can't teach two courses to the SAME section in one slot,
    //   but CAN take different subjects for different sections at the same time.
    const conflicts = await prisma.timetableEntry.findMany({
      where: {
        isActive: true,
        academicSemesterId: d.academicSemesterId,
        dayOfWeek: d.dayOfWeek,
        periodNumber: d.periodNumber,
        id: existingSlot ? { not: existingSlot.id } : undefined,
        OR: [
          { sectionId: d.sectionId || "none", courseOfferingId: offering.id },
          { roomId: d.roomId || "none" },
          { sectionId: d.sectionId || "none", facultyId: d.facultyId || "none" },
        ],
      },
      include: { courseOffering: { include: { course: true, department: true } }, room: true },
    });
    if (conflicts.length > 0) {
      const c = conflicts[0];
      return {
        ok: false as const,
        error: `Conflict: ${c.courseOffering.course.code} (${c.courseOffering.department.name}) already occupies this slot${c.room ? ` in room ${c.room.code}` : ""}${c.facultyId ? " with the same instructor" : ""}`,
      };
    }

    const data = {
      academicSemesterId: d.academicSemesterId,
      sectionId: d.sectionId || null,
      dayOfWeek: d.dayOfWeek,
      periodNumber: d.periodNumber,
      courseOfferingId: offering.id,
      facultyId: d.facultyId || null,
      roomId: d.roomId || null,
      startTime: times.startTime,
      endTime: times.endTime,
      isLab: false,
    };

    if (existingSlot) {
      await prisma.timetableEntry.update({ where: { id: existingSlot.id }, data });
    } else {
      await prisma.timetableEntry.create({ data });
    }

    await logAudit({
      userId: access.userId,
      action: existingSlot ? "timetable.update" : "timetable.create",
      module: "timetable",
      entityType: "TimetableEntry",
      entityId: existingSlot?.id ?? undefined,
      newValues: { dayOfWeek: d.dayOfWeek, periodNumber: d.periodNumber, sectionId: d.sectionId || null, courseId: course.id, courseCode: course.code, facultyId: d.facultyId || null, roomId: d.roomId || null },
    });
    revalidatePath("/timetable");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function clearTimetableCell(entryId: string) {
  return deleteTimetableEntry(entryId);
}

async function getOrCreateOffering(courseId: string, departmentId: string, academicSemesterId: string) {
  const existing = await prisma.courseOffering.findUnique({
    where: { departmentId_courseId_academicSemesterId: { departmentId, courseId, academicSemesterId } },
  });
  if (existing) {
    if (!existing.isActive) {
      return prisma.courseOffering.update({ where: { id: existing.id }, data: { isActive: true } });
    }
    return existing;
  }

  const created = await prisma.courseOffering.create({
    data: { courseId, departmentId, academicSemesterId, isActive: true },
  });
  const enrolled = await prisma.studentSemesterEnrollment.findMany({
    where: { academicSemesterId, departmentId, isActive: true },
    select: { studentId: true },
  });
  if (enrolled.length > 0) {
    await prisma.courseRegistration.createMany({
      data: enrolled.map((e) => ({ studentId: e.studentId, courseOfferingId: created.id })),
      skipDuplicates: true,
    });
  }
  return created;
}
