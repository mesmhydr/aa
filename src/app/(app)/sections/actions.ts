"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const sectionSchema = z.object({
  departmentId: z.string().min(1),
  academicSemesterId: z.string().min(1),
  name: z.string().trim().toUpperCase().min(1).max(4),
});

async function assertDepartmentAccess(access: Awaited<ReturnType<typeof requireAccess>>, departmentId: string) {
  if (access.departmentIds.length && !access.departmentIds.includes(departmentId) && !access.isInstitutionAdmin) {
    throw new Error("Not authorized for this department");
  }
}

export async function createSection(input: z.infer<typeof sectionSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const d = sectionSchema.parse(input);
    await assertDepartmentAccess(access, d.departmentId);

    const existing = await prisma.section.findUnique({
      where: { departmentId_academicSemesterId_name: { departmentId: d.departmentId, academicSemesterId: d.academicSemesterId, name: d.name } },
    });
    if (existing) return { ok: false as const, error: `Section ${d.name} already exists` };

    const section = await prisma.section.create({
      data: { departmentId: d.departmentId, academicSemesterId: d.academicSemesterId, name: d.name },
    });
    await logAudit({
      userId: access.userId, action: "section.create", module: "academic",
      entityType: "Section", entityId: section.id,
      newValues: { departmentId: d.departmentId, semesterId: d.academicSemesterId, name: d.name },
    });
    revalidatePath("/sections");
    return { ok: true as const, id: section.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createDefaultSections(departmentId: string, academicSemesterId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    await assertDepartmentAccess(access, departmentId);

    const names = ["A", "B", "C"];
    const existing = await prisma.section.findMany({
      where: { departmentId, academicSemesterId },
      select: { name: true },
    });
    const have = new Set(existing.map((s) => s.name));
    const missing = names.filter((n) => !have.has(n));
    if (missing.length > 0) {
      await prisma.section.createMany({
        data: missing.map((name) => ({ departmentId, academicSemesterId, name })),
        skipDuplicates: true,
      });
    }
    await logAudit({
      userId: access.userId, action: "section.create_default", module: "academic",
      entityType: "Section", entityId: undefined,
      newValues: { departmentId, semesterId: academicSemesterId, created: missing },
    });
    revalidatePath("/sections");
    return { ok: true as const, created: missing.length };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteSection(id: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "academic.configure");
    const section = await prisma.section.findUnique({ where: { id }, select: { id: true, name: true, departmentId: true } });
    if (!section) return { ok: false as const, error: "Section not found" };
    await assertDepartmentAccess(access, section.departmentId);

    await prisma.section.delete({ where: { id } });
    await logAudit({
      userId: access.userId, action: "section.delete", module: "academic",
      entityType: "Section", entityId: id,
      newValues: { name: section.name },
    });
    revalidatePath("/sections");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}
