"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

function percentToGrade(grades: Array<{ grade: string; gradePoint: number; minPercent: number; maxPercent: number; isPass: boolean }>, percent: number) {
  return grades.find((g) => percent >= g.minPercent && percent <= g.maxPercent) ?? grades.find((g) => g.grade === "F");
}

export async function computeResults(sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "results.compute");
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { academicSemester: { include: { academicYear: true } } },
    });
    if (!session) return { ok: false as const, error: "Session not found" };

    const semester = await prisma.academicSemester.findUnique({ where: { id: session.academicSemesterId } });
    if (!semester) return { ok: false as const, error: "No academic semester for this session" };

    const exams = await prisma.exam.findMany({ where: { examSessionId: sessionId } });
    const registrations = await prisma.examRegistration.findMany({ where: { examSessionId: sessionId } });

    await prisma.$transaction(async (tx) => {
      for (const reg of registrations) {
        const existing = await tx.result.findUnique({
          where: { studentId_academicSemesterId: { studentId: reg.studentId, academicSemesterId: semester.id } },
        });
        const result = existing
          ? await tx.result.update({
              where: { id: existing.id },
              data: { computedById: access.userId, computedAt: new Date(), status: "FAIL" },
            })
          : await tx.result.create({
              data: {
                studentId: reg.studentId,
                academicSemesterId: semester.id,
                status: "FAIL",
                computedById: access.userId,
                computedAt: new Date(),
              },
            });

        let totalCreditsRegistered = 0;
        let totalCreditsEarned = 0;
        let weightedPoints = 0;

        for (const exam of exams) {
          const course = await tx.course.findUnique({ where: { id: exam.courseId } });
          if (!course) continue;
          const offering = await tx.courseOffering.findFirst({
            where: { courseId: course.id, academicSemesterId: semester.id, isActive: true },
          });
          let cieMarks: number | null = null;
          let ciePercentage = 0;
          if (offering) {
            const cie = await tx.cieConsolidation.findUnique({
              where: { studentId_courseOfferingId_academicSemesterId: { studentId: reg.studentId, courseOfferingId: offering.id, academicSemesterId: semester.id } },
            });
            if (cie) {
              cieMarks = cie.totalMarks ?? null;
              ciePercentage = cie.percentage ?? 0;
            }
          }
          const mark = await tx.mark.findUnique({
            where: { examSessionId_studentId_courseId: { examSessionId: sessionId, studentId: reg.studentId, courseId: course.id } },
          });
          const seeMarks = mark?.seeMarks ?? null;
          const practicalMarks = mark?.practicalMarks ?? null;

          const gradeScheme = await tx.grade.findMany({ where: { schemeId: course.schemeId, isActive: true } });

          const total = [cieMarks, seeMarks, practicalMarks].filter((m): m is number => m !== null).reduce((a, m) => a + m, 0);
          const hasCie = cieMarks !== null;
          const hasSee = seeMarks !== null || (exam.isPractical && practicalMarks !== null);
          const passed = hasCie && hasSee && ciePercentage >= 40;
          const percent = exam.isPractical
            ? (total / (exam.maxMarks || 100)) * 100
            : ciePercentage && seeMarks !== null
              ? (ciePercentage * 0.4) + (seeMarks / (exam.maxMarks || 100)) * 100 * 0.6
              : 0;
          const g = percentToGrade(gradeScheme, percent) ?? gradeScheme.find((x) => !x.isPass);

          const creditsEarned = passed ? course.credits : 0;
          totalCreditsRegistered += course.credits;
          totalCreditsEarned += creditsEarned;
          weightedPoints += (g?.gradePoint ?? 0) * course.credits;

          const prevItem = await tx.resultItem.findUnique({
            where: { resultId_courseId: { resultId: result.id, courseId: course.id } },
          });
          const itemData = {
            cieMarks,
            seeMarks,
            practicalMarks,
            totalMarks: total || null,
            grade: g?.grade ?? "F",
            gradePoint: g?.gradePoint ?? 0,
            credits: course.credits,
            creditsEarned,
            status: (passed ? "PASS" : "FAIL") as never,
          };
          if (prevItem) {
            await tx.resultItem.update({ where: { id: prevItem.id }, data: itemData });
          } else {
            await tx.resultItem.create({ data: { ...itemData, resultId: result.id, courseId: course.id } });
          }
        }

        await tx.result.update({
          where: { id: result.id },
          data: {
            creditsRegistered: totalCreditsRegistered,
            creditsEarned: totalCreditsEarned,
            sgpa: totalCreditsRegistered > 0 ? weightedPoints / totalCreditsRegistered : null,
            status: totalCreditsRegistered > 0 && totalCreditsRegistered === totalCreditsEarned ? "PASS" : "FAIL",
          },
        });
      }
    });

    await logAudit({ userId: access.userId, action: "results.compute", module: "results", entityType: "ExamSession", entityId: sessionId });
    revalidatePath("/results");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function publishResults(sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "results.publish");
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { academicSemester: { include: { academicYear: true } } },
    });
    if (!session) return { ok: false as const, error: "Session not found" };
    const semester = await prisma.academicSemester.findUnique({ where: { id: session.academicSemesterId } });
    if (!semester) return { ok: false as const, error: "No academic semester for this session" };

    const results = await prisma.result.findMany({
      where: { academicSemesterId: semester.id, publicationStatus: { not: "PUBLISHED" } },
    });
    await prisma.$transaction([
      prisma.result.updateMany({
        where: { id: { in: results.map((r) => r.id) } },
        data: { publicationStatus: "PUBLISHED", publishedById: access.userId, publishedAt: new Date() },
      }),
      prisma.examSession.update({ where: { id: sessionId }, data: { resultsStatus: "PUBLISHED" } }),
    ]);
    await logAudit({ userId: access.userId, action: "results.publish", module: "results", entityType: "ExamSession", entityId: sessionId, newValues: { count: results.length } });
    revalidatePath("/results");
    return { ok: true as const, count: results.length };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function unpublishResults(sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "results.publish");
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { academicSemester: { include: { academicYear: true } } },
    });
    if (!session) return { ok: false as const, error: "Session not found" };
    const semester = await prisma.academicSemester.findUnique({ where: { id: session.academicSemesterId } });
    if (!semester) return { ok: false as const, error: "No academic semester for this session" };
    await prisma.result.updateMany({
      where: { academicSemesterId: semester.id },
      data: { publicationStatus: "DRAFT", publishedById: null, publishedAt: null },
    });
    await prisma.examSession.update({ where: { id: sessionId }, data: { resultsStatus: "DRAFT" } });
    await logAudit({ userId: access.userId, action: "results.unpublish", module: "results", entityType: "ExamSession", entityId: sessionId });
    revalidatePath("/results");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const resultEditSchema = z.object({
  resultItemId: z.string().min(1),
  sessionId: z.string().min(1),
  grade: z.string().min(1),
  remark: z.string().optional(),
});

export async function editResultItem(input: z.infer<typeof resultEditSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "results.edit");
    const d = resultEditSchema.parse(input);
    const item = await prisma.resultItem.findUnique({ where: { id: d.resultItemId }, include: { course: true } });
    if (!item) return { ok: false as const, error: "Result item not found" };
    const grade = await prisma.grade.findFirst({ where: { schemeId: item.course.schemeId, grade: d.grade } });
    if (!grade) return { ok: false as const, error: "Invalid grade for this scheme" };

    await prisma.resultHistory.create({
      data: {
        resultItemId: item.id,
        changedByUserId: access.userId,
        oldValues: { grade: item.grade, gradePoint: item.gradePoint, remark: item.remark },
        newValues: { grade: grade.grade, gradePoint: grade.gradePoint, remark: d.remark },
        reason: "Manual override",
      },
    });
    const updated = await prisma.resultItem.update({
      where: { id: item.id },
      data: { grade: grade.grade, gradePoint: grade.gradePoint, remark: d.remark, creditsEarned: grade.isPass ? item.credits : 0, status: grade.isPass ? "PASS" : "FAIL" },
    });

    const result = await prisma.result.findUnique({ where: { id: item.resultId }, include: { items: true } });
    if (result) {
      const w = result.items.map((it) => (it.id === updated.id ? updated : it));
      const creditsRegistered = w.reduce((a, it) => a + it.credits, 0);
      const creditsEarned = w.reduce((a, it) => a + it.creditsEarned, 0);
      const weighted = w.reduce((a, it) => a + (it.gradePoint ?? 0) * it.credits, 0);
      await prisma.result.update({
        where: { id: result.id },
        data: {
          creditsRegistered,
          creditsEarned,
          sgpa: creditsRegistered > 0 ? weighted / creditsRegistered : null,
          status: creditsRegistered > 0 && creditsRegistered === creditsEarned ? "PASS" : "FAIL",
          publicationStatus: "DRAFT",
          publishedById: null,
          publishedAt: null,
        },
      });
    }
    await logAudit({ userId: access.userId, action: "results.edit", module: "results", entityType: "ResultItem", entityId: item.id, newValues: { grade: grade.grade } });
    revalidatePath(`/results/${d.sessionId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}