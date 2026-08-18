"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
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

    // Fetch existing records for this offering/date/period once, then batch all
    // writes into a single non-interactive transaction. The old per-student
    // find+write loop did 2 round trips per student and exceeded the 5s
    // interactive transaction timeout on a full class.
    const existing = await prisma.attendanceRecord.findMany({
      where: {
        courseOfferingId: d.courseOfferingId,
        attendanceDate: date,
        periodNumber: d.periodNumber ?? null,
      },
      select: { id: true, studentId: true },
    });
    const existingByStudent = new Map(existing.map((r) => [r.studentId, r.id]));

    const toCreate = d.entries.filter((e) => !existingByStudent.has(e.studentId));

    // Group updates by status so each status is a single bulk updateMany.
    const statusGroups = new Map<string, string[]>();
    for (const e of d.entries) {
      const id = existingByStudent.get(e.studentId);
      if (!id) continue;
      const group = statusGroups.get(e.status) ?? [];
      group.push(id);
      statusGroups.set(e.status, group);
    }

    const txOps: Prisma.PrismaPromise<unknown>[] = [];
    if (toCreate.length > 0) {
      txOps.push(
        prisma.attendanceRecord.createMany({
          data: toCreate.map((e) => ({
            courseOfferingId: d.courseOfferingId,
            studentId: e.studentId,
            attendanceDate: date,
            periodNumber: d.periodNumber ?? null,
            status: e.status as never,
            markedByUserId: access.userId,
          })),
          skipDuplicates: true,
        }),
      );
    }
    const markedAt = new Date();
    for (const [status, ids] of statusGroups) {
      txOps.push(
        prisma.attendanceRecord.updateMany({
          where: { id: { in: ids } },
          data: { status: status as never, markedByUserId: access.userId, markedAt },
        }),
      );
    }
    if (txOps.length > 0) await prisma.$transaction(txOps);

    const created = toCreate.length;
    const updated = d.entries.length - created;

    await logAudit({
      userId: access.userId, action: "attendance.create", module: "attendance",
      entityType: "CourseOffering", entityId: d.courseOfferingId,
      newValues: { date: d.date, periodNumber: d.periodNumber ?? null, count: d.entries.length },
    });
    revalidatePath("/attendance");
    return { ok: true as const, created, updated };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}