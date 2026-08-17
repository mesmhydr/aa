"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { getActiveSeason, seasonOfSemester } from "@/lib/season";

const feeStructureSchema = z.object({
  id: z.string().optional(),
  feeTypeId: z.string().min(1),
  amount: z.coerce.number().positive(),
  academicYearId: z.string().min(1),
  semesterNumber: z.coerce.number().int().min(1).max(12).optional().or(z.literal(0)),
  isMandatory: z.boolean().optional(),
});

export async function saveFeeStructure(input: z.infer<typeof feeStructureSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "fees.structure");
    const d = feeStructureSchema.parse(input);
    const institution = await prisma.institution.findFirst();
    if (!institution) return { ok: false as const, error: "No institution configured" };
    const data = {
      feeTypeId: d.feeTypeId,
      amount: d.amount,
      academicYearId: d.academicYearId,
      institutionId: institution.id,
      semesterNumber: d.semesterNumber || null,
      isMandatory: d.isMandatory ?? true,
    };
    if (d.id) {
      await prisma.feeStructure.update({ where: { id: d.id }, data });
      revalidatePath("/fees");
      return { ok: true as const };
    }
    const fs = await prisma.feeStructure.create({ data });
    await logAudit({ userId: access.userId, action: "fees.structure_create", module: "fees", entityType: "FeeStructure", entityId: fs.id, newValues: { amount: fs.amount } });
    revalidatePath("/fees");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleFeeStructure(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "fees.structure");
    await prisma.feeStructure.update({ where: { id }, data: { isActive } });
    revalidatePath("/fees");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function generateStudentFees(yearId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "fees.generate");
    const year = await prisma.academicYear.findUnique({ where: { id: yearId } });
    if (!year) return { ok: false as const, error: "Academic year not found" };
    const structures = await prisma.feeStructure.findMany({ where: { academicYearId: yearId, isActive: true } });
    if (!structures.length) return { ok: false as const, error: "No active fee structures for this year" };

    const semesters = await prisma.academicSemester.findMany({ where: { academicYearId: yearId } });
    const activeSeason = await getActiveSeason();
    const activeSemesterNumbers = semesters.filter((s) => seasonOfSemester(s.semesterNumber) === activeSeason).map((s) => s.semesterNumber);
    const students = await prisma.student.findMany({ where: { isActive: true } });

    await prisma.$transaction(async (tx) => {
      for (const s of students) {
        for (const st of structures) {
          if (st.semesterNumber && !activeSemesterNumbers.includes(st.semesterNumber)) continue;
          const semesterId = st.semesterNumber
            ? semesters.find((sem) => sem.semesterNumber === st.semesterNumber)?.id ?? null
            : null;
          const existing = await tx.studentFee.findFirst({
            where: { studentId: s.id, feeTypeId: st.feeTypeId, academicYearId: yearId },
          });
          if (!existing) {
            await tx.studentFee.create({
              data: {
                studentId: s.id,
                feeStructureId: st.id,
                academicYearId: yearId,
                academicSemesterId: semesterId,
                feeTypeId: st.feeTypeId,
                amount: st.amount,
                dueDate: year.endDate,
                description: st.description,
              },
            });
          }
        }
      }
    });

    await logAudit({ userId: access.userId, action: "fees.generate", module: "fees", entityType: "AcademicYear", entityId: yearId, newValues: { structures: structures.length, students: students.length } });
    revalidatePath("/fees");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const paymentSchema = z.object({
  studentFeeId: z.string().min(1),
  studentId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHECK"]),
  transactionId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function recordPayment(input: z.infer<typeof paymentSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "fees.receive");
    const d = paymentSchema.parse(input);
    const fee = await prisma.studentFee.findUnique({ where: { id: d.studentFeeId } });
    if (!fee) return { ok: false as const, error: "Fee record not found" };
    const outstanding = Number(fee.amount) - Number(fee.paidAmount) - Number(fee.discountAmount) - Number(fee.waivedAmount);
    if (d.amount > outstanding) return { ok: false as const, error: `Amount exceeds outstanding balance (${outstanding})` };

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          studentId: d.studentId,
          studentFeeId: d.studentFeeId,
          amount: d.amount,
          method: d.method,
          transactionId: d.transactionId || null,
          notes: d.notes || null,
          receivedByUserId: access.userId,
        },
      });
      await tx.paymentAllocation.create({
        data: { paymentId: p.id, studentFeeId: d.studentFeeId, amount: d.amount },
      });
      const paid = Number(fee.paidAmount) + d.amount;
      const status = paid >= Number(fee.amount) ? "PAID" : "PARTIAL";
      await tx.studentFee.update({ where: { id: d.studentFeeId }, data: { paidAmount: paid, status } });
      const r = await tx.receipt.create({
        data: { paymentId: p.id, receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`, generatedById: access.userId },
      });
      return { p, r };
    });

    await logAudit({ userId: access.userId, action: "fees.payment", module: "fees", entityType: "Payment", entityId: payment.p.id, newValues: { amount: d.amount, receipt: payment.r.receiptNumber } });
    revalidatePath("/fees");
    revalidatePath(`/students/${d.studentId}`);
    return { ok: true as const, receipt: payment.r.receiptNumber };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function adjustFee(input: { studentFeeId: string; type: string; amount: number; reason: string; studentId: string }) {
  try {
    const access = await requireAccess();
    requirePermission(access, "fees.adjust");
    const fee = await prisma.studentFee.findUnique({ where: { id: input.studentFeeId } });
    if (!fee) return { ok: false as const, error: "Fee record not found" };

    await prisma.$transaction(async (tx) => {
      await tx.feeAdjustment.create({
        data: {
          studentFeeId: input.studentFeeId,
          type: input.type as never,
          amount: input.amount,
          reason: input.reason,
          approvedById: access.userId,
        },
      });
      const data =
        input.type === "DISCOUNT"
          ? { discountAmount: Number(fee.discountAmount) + input.amount }
          : { waivedAmount: Number(fee.waivedAmount) + input.amount };
      await tx.studentFee.update({ where: { id: input.studentFeeId }, data });
    });
    await logAudit({ userId: access.userId, action: "fees.adjust", module: "fees", entityType: "StudentFee", entityId: input.studentFeeId, newValues: { type: input.type, amount: input.amount } });
    revalidatePath(`/fees/${input.studentId}`);
    revalidatePath(`/students/${input.studentId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}