"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const leaveSchema = z.object({
  id: z.string().optional(),
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.coerce.number().positive(),
  reason: z.string().min(1),
});

export async function applyLeave(input: z.infer<typeof leaveSchema>) {
  try {
    const access = await requireAccess();
    const d = leaveSchema.parse(input);
    const leaveType = await prisma.leaveType.findUnique({ where: { id: d.leaveTypeId } });
    if (!leaveType) return { ok: false as const, error: "Leave type not found" };

    if (d.id) {
      const existing = await prisma.leaveRequest.findUnique({ where: { id: d.id } });
      if (!existing || existing.userId !== access.userId) return { ok: false as const, error: "Not your leave request" };
      if (existing.status !== "PENDING") return { ok: false as const, error: "Only pending requests can be edited" };
      await prisma.leaveRequest.update({
        where: { id: d.id },
        data: { leaveTypeId: d.leaveTypeId, startDate: new Date(d.startDate), endDate: new Date(d.endDate), days: d.days, reason: d.reason },
      });
      revalidatePath("/leave");
      return { ok: true as const };
    }

    const req = await prisma.leaveRequest.create({
      data: {
        userId: access.userId,
        departmentId: access.departmentIds[0] ?? null,
        leaveTypeId: d.leaveTypeId,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
        days: d.days,
        reason: d.reason,
      },
    });
    await logAudit({ userId: access.userId, action: "leave.apply", module: "leave", entityType: "LeaveRequest", entityId: req.id, newValues: { days: d.days } });
    revalidatePath("/leave");
    return { ok: true as const, id: req.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function cancelLeave(id: string) {
  try {
    const access = await requireAccess();
    const req = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!req || req.userId !== access.userId) return { ok: false as const, error: "Not your leave request" };
    if (req.status !== "PENDING") return { ok: false as const, error: "Only pending requests can be cancelled" };
    await prisma.leaveRequest.update({ where: { id }, data: { status: "CANCELLED" } });
    revalidatePath("/leave");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function reviewLeave(id: string, status: "APPROVED" | "REJECTED", comment: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "leave.approve");
    await prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedById: access.userId, approvedAt: new Date(), reviewerComment: comment || null },
    });
    await logAudit({ userId: access.userId, action: `leave.${status.toLowerCase()}`, module: "leave", entityType: "LeaveRequest", entityId: id, newValues: { comment } });
    revalidatePath("/leave");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveLeaveType(input: { id?: string; code: string; name: string; daysPerYear: number; isPaid: boolean }) {
  try {
    const access = await requireAccess();
    requirePermission(access, "leave.configure");
    if (input.id) {
      await prisma.leaveType.update({ where: { id: input.id }, data: { code: input.code.toUpperCase(), name: input.name, daysPerYear: input.daysPerYear, isPaid: input.isPaid } });
    } else {
      await prisma.leaveType.create({ data: { code: input.code.toUpperCase(), name: input.name, daysPerYear: input.daysPerYear, isPaid: input.isPaid } });
    }
    revalidatePath("/leave");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}