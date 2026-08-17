"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const yearSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(30),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  institutionId: z.string().min(1),
});

const programSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  degreeType: z.string().min(1).max(20),
  departmentId: z.string().min(1),
  durationSemesters: z.coerce.number().int().min(1).max(12),
  institutionId: z.string().min(1),
});

const schemeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  regulation: z.string().optional().or(z.literal("")),
  institutionId: z.string().min(1),
  programIds: z.array(z.string()),
});

const semesterSchema = z.object({
  id: z.string().optional(),
  academicYearId: z.string().min(1),
  semesterNumber: z.coerce.number().int().min(1).max(12),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const batchSchema = z.object({
  id: z.string().optional(),
  institutionId: z.string().min(1),
  programId: z.string().min(1),
  schemeId: z.string().optional().or(z.literal("")),
  admissionYear: z.coerce.number().int().min(1990).max(2100),
  name: z.string().max(30).optional().or(z.literal("")),
});

export async function saveAcademicYear(input: z.infer<typeof yearSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const d = yearSchema.parse(input);
    const data = {
      name: d.name,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      institutionId: d.institutionId,
    };
    if (d.id) {
      const prev = await prisma.academicYear.findUnique({ where: { id: d.id } });
      await prisma.academicYear.update({ where: { id: d.id }, data });
      await logAudit({
        userId: access.userId, action: "academicYear.update", module: "academic",
        entityType: "AcademicYear", entityId: d.id, oldValues: { name: prev?.name }, newValues: { name: d.name },
      });
      revalidatePath("/academics");
      return { ok: true as const, id: d.id };
    }
    const y = await prisma.academicYear.create({ data });
    await logAudit({
      userId: access.userId, action: "academicYear.create", module: "academic",
      entityType: "AcademicYear", entityId: y.id, newValues: { name: y.name },
    });
    revalidatePath("/academics");
    return { ok: true as const, id: y.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveProgram(input: z.infer<typeof programSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const d = programSchema.parse(input);
    const data = {
      code: d.code.toUpperCase(),
      name: d.name,
      degreeType: d.degreeType,
      departmentId: d.departmentId,
      durationSemesters: d.durationSemesters,
      institutionId: d.institutionId,
    };
    if (d.id) {
      await prisma.program.update({ where: { id: d.id }, data });
      await logAudit({ userId: access.userId, action: "program.update", module: "academic", entityType: "Program", entityId: d.id });
      revalidatePath("/academics");
      return { ok: true as const, id: d.id };
    }
    const exists = await prisma.program.findUnique({ where: { code: data.code } });
    if (exists) return { ok: false as const, error: `Program code "${data.code}" already exists` };
    const p = await prisma.program.create({ data });
    await logAudit({ userId: access.userId, action: "program.create", module: "academic", entityType: "Program", entityId: p.id, newValues: { code: p.code, name: p.name } });
    revalidatePath("/academics");
    return { ok: true as const, id: p.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleProgram(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    await prisma.program.update({ where: { id }, data: { isActive } });
    revalidatePath("/academics");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveScheme(input: z.infer<typeof schemeSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const d = schemeSchema.parse(input);
    const data = { code: d.code.toUpperCase(), name: d.name, regulation: d.regulation || null, institutionId: d.institutionId };
    if (d.id) {
      await prisma.$transaction([
        prisma.scheme.update({ where: { id: d.id }, data }),
        prisma.schemeProgram.deleteMany({ where: { schemeId: d.id } }),
        prisma.schemeProgram.createMany({ data: d.programIds.map((programId) => ({ schemeId: d.id!, programId })) }),
      ]);
      await logAudit({ userId: access.userId, action: "scheme.update", module: "academic", entityType: "Scheme", entityId: d.id });
      revalidatePath("/academics");
      return { ok: true as const, id: d.id };
    }
    const exists = await prisma.scheme.findUnique({ where: { code: data.code } });
    if (exists) return { ok: false as const, error: `Scheme code "${data.code}" already exists` };
    const s = await prisma.scheme.create({
      data: { ...data, programs: { create: d.programIds.map((programId) => ({ programId })) } },
    });
    await logAudit({ userId: access.userId, action: "scheme.create", module: "academic", entityType: "Scheme", entityId: s.id, newValues: { code: s.code, name: s.name } });
    revalidatePath("/academics");
    return { ok: true as const, id: s.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveSemester(input: z.infer<typeof semesterSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const d = semesterSchema.parse(input);
    const data = {
      academicYearId: d.academicYearId,
      semesterNumber: d.semesterNumber,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
    };
    if (d.id) {
      await prisma.academicSemester.update({ where: { id: d.id }, data });
      revalidatePath("/academics");
      return { ok: true as const, id: d.id };
    }
    const exists = await prisma.academicSemester.findUnique({
      where: { academicYearId_semesterNumber: { academicYearId: d.academicYearId, semesterNumber: d.semesterNumber } },
    });
    if (exists) return { ok: false as const, error: `Semester ${d.semesterNumber} already exists for this year` };
    const s = await prisma.academicSemester.create({ data });
    await logAudit({ userId: access.userId, action: "semester.create", module: "academic", entityType: "AcademicSemester", entityId: s.id, newValues: { semesterNumber: s.semesterNumber } });
    revalidatePath("/academics");
    return { ok: true as const, id: s.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setSemesterStatus(id: string, status: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    await prisma.academicSemester.update({ where: { id }, data: { status: status as never } });
    revalidatePath("/academics");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setActiveSeason(season: "ODD" | "EVEN") {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    await prisma.institution.updateMany({ data: { activeSeason: season } });
    // Sync lifecycle status so semesters matching the active season read ACTIVE,
    // while the other season's semesters (that aren't finished) read PLANNED.
    const parity = season === "ODD" ? 1 : 0;
    const sems = await prisma.academicSemester.findMany({
      select: { id: true, semesterNumber: true, status: true },
    });
    await prisma.$transaction(
      sems
        .filter((s) => s.status !== "COMPLETED" && s.status !== "CANCELLED")
        .map((s) =>
          prisma.academicSemester.update({
            where: { id: s.id },
            data: { status: (s.semesterNumber % 2 === parity ? "ACTIVE" : "PLANNED") as never },
          })
        )
    );
    await logAudit({
      userId: access.userId, action: "academic.setActiveSeason", module: "academic",
      entityType: "Institution", newValues: { activeSeason: season },
    });
    revalidatePath("/academics");
    revalidatePath("/courses");
    revalidatePath("/attendance");
    revalidatePath("/timetable");
    revalidatePath("/assessments");
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveBatch(input: z.infer<typeof batchSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const d = batchSchema.parse(input);
    const data = {
      institutionId: d.institutionId,
      programId: d.programId,
      schemeId: d.schemeId || null,
      admissionYear: d.admissionYear,
      name: d.name || null,
    };
    if (d.id) {
      await prisma.batch.update({ where: { id: d.id }, data });
      revalidatePath("/academics");
      return { ok: true as const, id: d.id };
    }
    const exists = await prisma.batch.findUnique({
      where: { programId_admissionYear: { programId: d.programId, admissionYear: d.admissionYear } },
    });
    if (exists) return { ok: false as const, error: `Batch for ${d.admissionYear} already exists for this program` };
    const b = await prisma.batch.create({ data });
    await logAudit({ userId: access.userId, action: "batch.create", module: "academic", entityType: "Batch", entityId: b.id, newValues: { admissionYear: b.admissionYear, programId: b.programId } });
    revalidatePath("/academics");
    return { ok: true as const, id: b.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}
