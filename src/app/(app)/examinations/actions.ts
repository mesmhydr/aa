"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const sessionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  examTypeId: z.string().min(1),
  academicSemesterId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function saveSession(input: z.infer<typeof sessionSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.create");
    const d = sessionSchema.parse(input);
    const data = {
      name: d.name,
      examTypeId: d.examTypeId,
      academicSemesterId: d.academicSemesterId,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
    };
    if (d.id) {
      await prisma.examSession.update({ where: { id: d.id }, data });
      revalidatePath("/examinations");
      return { ok: true as const, id: d.id };
    }
    const s = await prisma.examSession.create({ data });
    await logAudit({ userId: access.userId, action: "exam.session_create", module: "exam", entityType: "ExamSession", entityId: s.id, newValues: { name: s.name } });
    revalidatePath("/examinations");
    return { ok: true as const, id: s.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleSession(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.edit");
    await prisma.examSession.update({ where: { id }, data: { isActive } });
    revalidatePath("/examinations");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const examSchema = z.object({
  sessionId: z.string().min(1),
  courseId: z.string().min(1),
  examDate: z.string().min(1),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  maxMarks: z.coerce.number().int().min(1).max(500),
  isPractical: z.boolean().optional(),
});

export async function addExam(input: z.infer<typeof examSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.create");
    const d = examSchema.parse(input);
    const exists = await prisma.exam.findUnique({
      where: { examSessionId_courseId: { examSessionId: d.sessionId, courseId: d.courseId } },
    });
    if (exists) return { ok: false as const, error: "Exam already scheduled for this course in this session" };
    const exam = await prisma.exam.create({
      data: {
        examSessionId: d.sessionId,
        courseId: d.courseId,
        examDate: new Date(d.examDate),
        startTime: d.startTime || null,
        endTime: d.endTime || null,
        durationMinutes: d.durationMinutes ?? null,
        maxMarks: d.maxMarks,
        isPractical: d.isPractical ?? false,
      },
    });
    await logAudit({ userId: access.userId, action: "exam.create", module: "exam", entityType: "Exam", entityId: exam.id, newValues: { courseId: d.courseId } });
    revalidatePath(`/examinations/${d.sessionId}`);
    return { ok: true as const, id: exam.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function removeExam(id: string, sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.edit");
    await prisma.exam.delete({ where: { id } });
    revalidatePath(`/examinations/${sessionId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function registerSessionStudents(sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.edit");
    const session = await prisma.examSession.findUnique({ where: { id: sessionId } });
    if (!session) return { ok: false as const, error: "Session not found" };

    const enrolled = await prisma.studentSemesterEnrollment.findMany({
      where: { academicSemesterId: session.academicSemesterId, isActive: true },
      select: { studentId: true },
    });
    const students = await prisma.student.findMany({
      where: { id: { in: enrolled.map((e) => e.studentId) }, isActive: true },
      select: { id: true },
    });
    await prisma.examRegistration.createMany({
      data: students.map((s) => ({ examSessionId: sessionId, studentId: s.id })),
      skipDuplicates: true,
    });
    await logAudit({ userId: access.userId, action: "exam.register", module: "exam", entityType: "ExamSession", entityId: sessionId, newValues: { count: students.length } });
    revalidatePath(`/examinations/${sessionId}`);
    return { ok: true as const, count: students.length };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function computeEligibility(sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.eligibility");
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { academicSemester: { include: { academicYear: true } } },
    });
    if (!session) return { ok: false as const, error: "Session not found" };

    const rule = await prisma.attendanceRule.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } });
    const threshold = rule?.thresholdPercent ?? 75;

    const semester = await prisma.academicSemester.findUnique({ where: { id: session.academicSemesterId } });
    if (!semester) return { ok: false as const, error: "No academic semester found for this session" };

    const registrations = await prisma.examRegistration.findMany({
      where: { examSessionId: sessionId },
      include: { student: true },
    });

    const courses = await prisma.exam.findMany({ where: { examSessionId: sessionId }, select: { courseId: true } });
    const courseIds = courses.map((c) => c.courseId);

    await prisma.$transaction(async (tx) => {
      for (const reg of registrations) {
        for (const courseId of courseIds) {
          const offerings = await tx.courseOffering.findMany({
            where: { courseId, academicSemesterId: semester.id, registrations: { some: { studentId: reg.studentId } } },
            select: { id: true },
          });
          let percentage = 0;
          if (offerings.length) {
            const recs = await tx.attendanceRecord.groupBy({
              by: ["status"],
              where: { studentId: reg.studentId, courseOfferingId: { in: offerings.map((o) => o.id) } },
              _count: true,
            });
            const total = recs.reduce((a, r) => a + r._count, 0);
            const present = recs.filter((r) => r.status === "PRESENT").reduce((a, r) => a + r._count, 0);
            percentage = total > 0 ? (present / total) * 100 : 0;
          }
          const eligible = percentage >= threshold;
          await tx.examEligibility.upsert({
            where: { examSessionId_studentId_courseId: { examSessionId: sessionId, studentId: reg.studentId, courseId } },
            update: { isEligible: eligible, reasons: { attendancePercent: Math.round(percentage * 100) / 100, threshold }, computedByUserId: access.userId },
            create: { examSessionId: sessionId, studentId: reg.studentId, courseId, isEligible: eligible, reasons: { attendancePercent: Math.round(percentage * 100) / 100, threshold }, computedByUserId: access.userId },
          });
        }
      }
    });

    await logAudit({ userId: access.userId, action: "exam.eligibility", module: "exam", entityType: "ExamSession", entityId: sessionId });
    revalidatePath(`/examinations/${sessionId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function allocateHalls(sessionId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.hallallocation");
    const exams = await prisma.exam.findMany({ where: { examSessionId: sessionId } });
    const rooms = await prisma.room.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
    if (rooms.length === 0) return { ok: false as const, error: "No active rooms configured" };

    await prisma.$transaction(async (tx) => {
      for (const exam of exams) {
        await tx.examHallAllocation.deleteMany({ where: { examId: exam.id } });
        const elig = await tx.examEligibility.findMany({
          where: { examSessionId: sessionId, courseId: exam.courseId, isEligible: true },
        });
        const students = elig.map((e) => e.studentId);
        let seat = 0;
        for (const room of rooms) {
          const bucket = students.slice(seat, seat + room.capacity);
          for (let i = 0; i < bucket.length; i++) {
            await tx.examHallAllocation.create({
              data: { examId: exam.id, roomId: room.id, studentId: bucket[i], seatNumber: String(i + 1) },
            });
          }
          seat += room.capacity;
          if (seat >= students.length) break;
        }
      }
    });

    await logAudit({ userId: access.userId, action: "exam.hallallocation", module: "exam", entityType: "ExamSession", entityId: sessionId, newValues: { exams: exams.length } });
    revalidatePath(`/examinations/${sessionId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

const examAttendanceSchema = z.object({
  examId: z.string().min(1),
  sessionId: z.string().min(1),
  entries: z.array(z.object({ studentId: z.string(), status: z.string() })).min(1),
});

export async function saveExamAttendance(input: z.infer<typeof examAttendanceSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "exam.edit");
    const d = examAttendanceSchema.parse(input);
    await prisma.$transaction(async (tx) => {
      for (const e of d.entries) {
        await tx.examAttendance.upsert({
          where: { examId_studentId: { examId: d.examId, studentId: e.studentId } },
          update: { status: e.status as never, markedByUserId: access.userId, markedAt: new Date() },
          create: { examId: d.examId, studentId: e.studentId, status: e.status as never, markedByUserId: access.userId },
        });
      }
    });
    revalidatePath(`/examinations/${d.sessionId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}