"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const courseSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(150),
  shortName: z.string().max(20).optional().or(z.literal("")),
  departmentId: z.string().min(1),
  schemeId: z.string().min(1),
  courseTypeId: z.string().min(1),
  semesterNumber: z.coerce.number().int().min(1).max(12),
  credits: z.coerce.number().int().min(0).max(30),
  ltp: z.string().max(8).optional().or(z.literal("")),
  contactHours: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  isElective: z.boolean().optional(),
  isOpenElective: z.boolean().optional(),
});

export async function saveCourse(input: z.infer<typeof courseSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, input.id ? "course.edit" : "course.create");
    const d = courseSchema.parse(input);
    const data = {
      code: d.code.toUpperCase(),
      name: d.name,
      shortName: d.shortName || null,
      departmentId: d.departmentId,
      schemeId: d.schemeId,
      courseTypeId: d.courseTypeId,
      semesterNumber: d.semesterNumber,
      credits: d.credits,
      l_t_p: d.ltp || null,
      contactHours: d.contactHours ?? null,
      isElective: d.isElective ?? false,
      isOpenElective: d.isOpenElective ?? false,
      isMandatory: !(d.isElective ?? false),
    };
    if (d.id) {
      await prisma.course.update({ where: { id: d.id }, data });
      await logAudit({ userId: access.userId, action: "course.update", module: "course", entityType: "Course", entityId: d.id, newValues: { code: data.code, name: data.name } });
      revalidatePath("/courses");
      return { ok: true as const, id: d.id };
    }
    const exists = await prisma.course.findUnique({ where: { code_schemeId: { code: data.code, schemeId: d.schemeId } } });
    if (exists) return { ok: false as const, error: `Course ${data.code} already exists in this scheme` };
    const c = await prisma.course.create({ data });
    await logAudit({ userId: access.userId, action: "course.create", module: "course", entityType: "Course", entityId: c.id, newValues: { code: c.code, name: c.name } });
    revalidatePath("/courses");
    return { ok: true as const, id: c.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleCourse(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "course.edit");
    await prisma.course.update({ where: { id }, data: { isActive } });
    revalidatePath("/courses");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setFacultyForCourse(courseId: string, facultyIds: string[]) {
  try {
    const access = await requireAccess();
    requirePermission(access, "course.assign");
    const dept = await prisma.course.findUnique({ where: { id: courseId }, select: { departmentId: true } });
    if (!dept) return { ok: false as const, error: "Course not found" };
    if (access.departmentIds.length && !access.departmentIds.includes(dept.departmentId) && !access.isInstitutionAdmin) {
      return { ok: false as const, error: "Not authorized for this department" };
    }
    await prisma.$transaction([
      prisma.facultyCourse.deleteMany({ where: { courseId } }),
      prisma.facultyCourse.createMany({ data: facultyIds.map((facultyId) => ({ facultyId, courseId })) }),
    ]);
    await logAudit({ userId: access.userId, action: "course.assign_faculty", module: "course", entityType: "Course", entityId: courseId, newValues: { facultyIds } });
    revalidatePath("/courses");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const offeringSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  departmentId: z.string().min(1),
  academicSemesterId: z.string().min(1),
  facultyId: z.string().optional().or(z.literal("")),
});

export async function saveOffering(input: z.infer<typeof offeringSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "course.register");
    const d = offeringSchema.parse(input);

    const exists = await prisma.courseOffering.findUnique({
      where: { departmentId_courseId_academicSemesterId: { departmentId: d.departmentId, courseId: d.courseId, academicSemesterId: d.academicSemesterId } },
    });

    let offering = exists;
    if (!offering) {
      offering = await prisma.courseOffering.create({
        data: { courseId: d.courseId, departmentId: d.departmentId, academicSemesterId: d.academicSemesterId, isActive: true },
      });
    } else if (!offering.isActive) {
      // Re-create = ensure the offering is active again (it may have been deactivated earlier).
      offering = await prisma.courseOffering.update({
        where: { id: offering.id },
        data: { isActive: true },
      });
    }

    if (d.facultyId) {
      await prisma.facultyAssignment.upsert({
        where: { courseOfferingId_facultyId_role: { courseOfferingId: offering.id, facultyId: d.facultyId, role: "COURSE_INSTRUCTOR" } },
        update: { isPrimary: true, isActive: true },
        create: { courseOfferingId: offering.id, facultyId: d.facultyId, role: "COURSE_INSTRUCTOR", isPrimary: true, academicSemesterId: d.academicSemesterId },
      });
    }

    const enrolled = await prisma.studentSemesterEnrollment.findMany({
      where: {
        academicSemesterId: d.academicSemesterId,
        isActive: true,
      },
      select: { studentId: true },
    });
    if (enrolled.length) {
      await prisma.courseRegistration.createMany({
        data: enrolled.map((e) => ({ studentId: e.studentId, courseOfferingId: offering.id })),
        skipDuplicates: true,
      });
    }

    await logAudit({ userId: access.userId, action: "course.offering", module: "course", entityType: "CourseOffering", entityId: offering.id, newValues: { courseId: d.courseId, departmentId: d.departmentId, semesterId: d.academicSemesterId, facultyId: d.facultyId || null } });
    revalidatePath("/courses");
    revalidatePath("/attendance");
    return { ok: true as const, id: offering.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleOffering(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "course.register");
    await prisma.courseOffering.update({ where: { id }, data: { isActive } });
    revalidatePath("/courses");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}
