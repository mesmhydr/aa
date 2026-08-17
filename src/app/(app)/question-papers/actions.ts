"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const paperSchema = z.object({
  title: z.string().min(1).max(150),
  courseId: z.string().min(1),
  totalMarks: z.coerce.number().int().min(1).max(500),
  durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  academicSemesterId: z.string().optional().or(z.literal("")),
});

export async function createPaper(input: z.infer<typeof paperSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionpaper.create");
    const d = paperSchema.parse(input);
    const latest = await prisma.questionPaper.findFirst({
      where: { courseId: d.courseId },
      orderBy: { version: "desc" },
    });
    const paper = await prisma.questionPaper.create({
      data: {
        title: d.title,
        courseId: d.courseId,
        totalMarks: d.totalMarks,
        durationMinutes: d.durationMinutes ?? null,
        academicSemesterId: d.academicSemesterId || null,
        version: (latest?.version ?? 0) + 1,
        createdByUserId: access.userId,
      },
    });
    await logAudit({ userId: access.userId, action: "questionpaper.create", module: "questionpaper", entityType: "QuestionPaper", entityId: paper.id, newValues: { title: paper.title } });
    revalidatePath("/question-papers");
    return { ok: true as const, id: paper.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const paperQuestionSchema = z.object({
  paperId: z.string().min(1),
  questionId: z.string().optional().or(z.literal("")),
  questionText: z.string().min(1).max(2000),
  marks: z.coerce.number().int().min(1).max(100),
  co: z.string().max(20).optional().or(z.literal("")),
  bloomLevel: z.string().max(20).optional().or(z.literal("")),
  unit: z.string().max(20).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(1).max(99).optional(),
  isOptional: z.boolean().optional(),
});

export async function addPaperQuestion(input: z.infer<typeof paperQuestionSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionpaper.create");
    const d = paperQuestionSchema.parse(input);
    const paper = await prisma.questionPaper.findUnique({ where: { id: d.paperId } });
    if (!paper) return { ok: false as const, error: "Paper not found" };
    if (paper.status === "LOCKED" || paper.status === "APPROVED") {
      return { ok: false as const, error: "Paper is locked" };
    }

    await prisma.questionPaperQuestion.create({
      data: {
        questionPaperId: d.paperId,
        questionId: d.questionId || null,
        questionText: d.questionText,
        marks: d.marks,
        co: d.co || null,
        bloomLevel: d.bloomLevel || null,
        unit: d.unit || null,
        sortOrder: d.sortOrder ?? 0,
        isOptional: d.isOptional ?? false,
      },
    });
    if (d.questionId) {
      await prisma.questionBankItem.update({
        where: { id: d.questionId },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    }
    await logAudit({ userId: access.userId, action: "questionpaper.add_question", module: "questionpaper", entityType: "QuestionPaper", entityId: d.paperId });
    revalidatePath(`/question-papers/${d.paperId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function removePaperQuestion(id: string, paperId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionpaper.create");
    await prisma.questionPaperQuestion.delete({ where: { id } });
    revalidatePath(`/question-papers/${paperId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function submitPaper(paperId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionpaper.submit");
    await prisma.$transaction([
      prisma.questionPaper.update({ where: { id: paperId }, data: { status: "SUBMITTED", submittedAt: new Date() } }),
      prisma.questionPaperApproval.create({ data: { questionPaperId: paperId, action: "SUBMITTED", reviewedByUserId: access.userId } }),
    ]);
    revalidatePath(`/question-papers/${paperId}`);
    revalidatePath("/question-papers");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function reviewPaper(paperId: string, action: string, comment?: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionpaper.approve");
    const approved = action === "APPROVED";
    await prisma.$transaction([
      prisma.questionPaper.update({
        where: { id: paperId },
        data: {
          status: approved ? "APPROVED" : (action as never),
          approvedByUserId: approved ? access.userId : undefined,
          approvedAt: approved ? new Date() : undefined,
        },
      }),
      prisma.questionPaperApproval.create({
        data: { questionPaperId: paperId, action: action as never, comment: comment || null, reviewedByUserId: access.userId },
      }),
    ]);
    await logAudit({ userId: access.userId, action: `questionpaper.${action.toLowerCase()}`, module: "questionpaper", entityType: "QuestionPaper", entityId: paperId });
    revalidatePath(`/question-papers/${paperId}`);
    revalidatePath("/question-papers");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function lockPaper(paperId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "questionpaper.approve");
    await prisma.questionPaper.update({ where: { id: paperId }, data: { status: "LOCKED", isLocked: true } });
    revalidatePath(`/question-papers/${paperId}`);
    revalidatePath("/question-papers");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}