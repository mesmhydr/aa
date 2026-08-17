"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const questionSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  questionTypeId: z.string().min(1),
  questionText: z.string().min(1).max(2000),
  marks: z.coerce.number().int().min(1).max(100),
  co: z.string().max(20).optional().or(z.literal("")),
  bloomLevel: z.string().max(20).optional().or(z.literal("")),
  unit: z.string().max(20).optional().or(z.literal("")),
  topic: z.string().max(100).optional().or(z.literal("")),
  difficulty: z.string().optional(),
});

export async function saveQuestion(input: z.infer<typeof questionSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, input.id ? "questionbank.edit" : "questionbank.create");
    const d = questionSchema.parse(input);
    const data = {
      courseId: d.courseId,
      questionTypeId: d.questionTypeId,
      questionText: d.questionText,
      marks: d.marks,
      co: d.co || null,
      bloomLevel: d.bloomLevel || null,
      unit: d.unit || null,
      topic: d.topic || null,
      difficulty: d.difficulty || "MEDIUM",
    };
    if (d.id) {
      await prisma.questionBankItem.update({ where: { id: d.id }, data });
      revalidatePath("/question-bank");
      return { ok: true as const, id: d.id };
    }
    const q = await prisma.questionBankItem.create({ data: { ...data, createdByUserId: access.userId } });
    await logAudit({ userId: access.userId, action: "questionbank.create", module: "questionbank", entityType: "QuestionBankItem", entityId: q.id });
    revalidatePath("/question-bank");
    return { ok: true as const, id: q.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function approveQuestion(id: string, approved: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionbank.approve");
    await prisma.questionBankItem.update({
      where: { id },
      data: { isApproved: approved, approvedById: access.userId, approvedAt: new Date() },
    });
    await logAudit({ userId: access.userId, action: approved ? "questionbank.approve" : "questionbank.reject", module: "questionbank", entityType: "QuestionBankItem", entityId: id });
    revalidatePath("/question-bank");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleQuestion(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionbank.edit");
    await prisma.questionBankItem.update({ where: { id }, data: { isActive } });
    revalidatePath("/question-bank");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}