"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const assessmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  courseOfferingId: z.string().min(1),
  componentId: z.string().min(1),
  academicSemesterId: z.string().min(1),
  assessmentDate: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(1).max(600).optional().or(z.literal("").transform(() => undefined)),
  maxMarks: z.coerce.number().int().min(1).max(500),
  instructions: z.string().optional().or(z.literal("")),
});

export async function saveAssessment(input: z.infer<typeof assessmentSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, input.id ? "assessment.edit" : "assessment.create");
    const d = assessmentSchema.parse(input);
    const data = {
      name: d.name,
      courseOfferingId: d.courseOfferingId,
      componentId: d.componentId,
      academicSemesterId: d.academicSemesterId,
      assessmentDate: new Date(d.assessmentDate),
      durationMinutes: d.durationMinutes ?? null,
      maxMarks: d.maxMarks,
      instructions: d.instructions || null,
      createdByUserId: access.userId,
    };
    if (d.id) {
      await prisma.assessment.update({ where: { id: d.id }, data });
      revalidatePath("/assessments");
      return { ok: true as const, id: d.id };
    }
    const a = await prisma.assessment.create({ data: { ...data, status: "DRAFT" } });
    await logAudit({ userId: access.userId, action: "assessment.create", module: "assessment", entityType: "Assessment", entityId: a.id, newValues: { name: a.name } });
    revalidatePath("/assessments");
    return { ok: true as const, id: a.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setAssessmentStatus(id: string, status: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, status === "PUBLISHED" ? "assessment.publish" : "assessment.edit");
    await prisma.assessment.update({
      where: { id },
      data: { status: status as never, isPublished: status === "PUBLISHED", publishedAt: status === "PUBLISHED" ? new Date() : undefined },
    });
    await logAudit({ userId: access.userId, action: `assessment.${status.toLowerCase()}`, module: "assessment", entityType: "Assessment", entityId: id, newValues: { status } });
    revalidatePath("/assessments");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const marksSchema = z.object({
  assessmentId: z.string().min(1),
  entries: z.array(z.object({
    studentId: z.string(),
    marksObtained: z.coerce.number().min(0).max(500).optional(),
    isAbsent: z.boolean().optional(),
    status: z.string().optional(),
  })).min(1),
});

export async function saveCieMarks(input: z.infer<typeof marksSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "ciemarks.enter");
    const d = marksSchema.parse(input);

    const assessment = await prisma.assessment.findUnique({
      where: { id: d.assessmentId },
      include: { courseOffering: { include: { course: true } } },
    });
    if (!assessment) return { ok: false as const, error: "Assessment not found" };
    if (assessment.status === "LOCKED" || assessment.status === "APPROVED") {
      return { ok: false as const, error: "Marks are locked for this assessment" };
    }

    await prisma.$transaction(async (tx) => {
      for (const e of d.entries) {
        await tx.cieMark.upsert({
          where: { assessmentId_studentId: { assessmentId: d.assessmentId, studentId: e.studentId } },
          update: {
            marksObtained: e.marksObtained ?? null,
            isAbsent: e.isAbsent ?? false,
            status: (e.status as never) ?? "PENDING",
            enteredByUserId: access.userId,
            enteredAt: new Date(),
          },
          create: {
            assessmentId: d.assessmentId,
            studentId: e.studentId,
            marksObtained: e.marksObtained ?? null,
            maxMarks: assessment.maxMarks,
            isAbsent: e.isAbsent ?? false,
            status: (e.status as never) ?? "PENDING",
            enteredByUserId: access.userId,
            enteredAt: new Date(),
          },
        });
      }
    });

    await logAudit({ userId: access.userId, action: "ciemarks.enter", module: "cie", entityType: "Assessment", entityId: d.assessmentId, newValues: { count: d.entries.length } });
    revalidatePath("/assessments");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function computeConsolidation(courseOfferingId: string, academicSemesterId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "ciemarks.approve");

    const assessments = await prisma.assessment.findMany({
      where: { courseOfferingId, academicSemesterId, status: { in: ["COMPLETED", "APPROVED", "LOCKED", "PUBLISHED"] } },
      include: { cieMarks: true, component: true },
    });
    if (assessments.length === 0) return { ok: false as const, error: "No completed assessments found" };

    const students = await prisma.courseRegistration.findMany({
      where: { courseOfferingId, status: "REGISTERED" },
      select: { studentId: true },
    });

    const maxByAssessment = assessments.reduce((m, a) => m + a.maxMarks, 0);

    await prisma.$transaction(async (tx) => {
      for (const reg of students) {
        let total = 0;
        const components: Record<string, { marksObtained: number; maxMarks: number }> = {};
        for (const a of assessments) {
          const mark = a.cieMarks.find((m) => m.studentId === reg.studentId);
          const obtained = mark && !mark.isAbsent && mark.marksObtained != null ? mark.marksObtained : 0;
          total += obtained;
          components[a.component.code] = { marksObtained: obtained, maxMarks: a.maxMarks };
        }
        const percentage = maxByAssessment > 0 ? Math.round((total / maxByAssessment) * 10000) / 100 : null;
        await tx.cieConsolidation.upsert({
          where: { studentId_courseOfferingId_academicSemesterId: { studentId: reg.studentId, courseOfferingId, academicSemesterId } },
          update: { totalMarks: total, components, percentage },
          create: { studentId: reg.studentId, courseOfferingId, academicSemesterId, totalMarks: total, components, percentage },
        });
      }
    });

    await logAudit({ userId: access.userId, action: "cie.compute", module: "cie", entityType: "CourseOffering", entityId: courseOfferingId, newValues: { assessments: assessments.length, students: students.length } });
    revalidatePath("/assessments");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}