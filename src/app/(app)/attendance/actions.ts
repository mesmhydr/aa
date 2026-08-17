"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const attendanceSchema = z.object({
  courseOfferingId: z.string().min(1),
  date: z.string().min(1),
  periodNumber: z.coerce.number().int().min(1).max(12).optional(),
  entries: z.array(z.object({ studentId: z.string(), status: z.string() })).min(1),
});

export async function markAttendance(input: z.infer<typeof attendanceSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "attendance.create");
    const d = attendanceSchema.parse(input);
    const date = new Date(d.date);

    const offering = await prisma.courseOffering.findUnique({
      where: { id: d.courseOfferingId },
      select: { id: true, course: { select: { departmentId: true } } },
    });
    if (!offering) return { ok: false as const, error: "Offering not found" };
    if (access.departmentIds.length && !access.departmentIds.includes(offering.course.departmentId) && !access.isInstitutionAdmin) {
      return { ok: false as const, error: "Not authorized for this department" };
    }

    await prisma.$transaction(async (tx) => {
      for (const e of d.entries) {
        const existing = await tx.attendanceRecord.findFirst({
          where: {
            courseOfferingId: d.courseOfferingId,
            studentId: e.studentId,
            attendanceDate: date,
            periodNumber: d.periodNumber ?? null,
          },
        });
        if (existing) {
          await tx.attendanceRecord.update({
            where: { id: existing.id },
            data: { status: e.status as never, markedByUserId: access.userId, markedAt: new Date() },
          });
        } else {
          await tx.attendanceRecord.create({
            data: {
              courseOfferingId: d.courseOfferingId,
              studentId: e.studentId,
              attendanceDate: date,
              periodNumber: d.periodNumber ?? null,
              status: e.status as never,
              markedByUserId: access.userId,
            },
          });
        }
      }
    });

    await logAudit({
      userId: access.userId, action: "attendance.create", module: "attendance",
      entityType: "CourseOffering", entityId: d.courseOfferingId,
      newValues: { date: d.date, periodNumber: d.periodNumber ?? null, count: d.entries.length },
    });
    revalidatePath("/attendance");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}