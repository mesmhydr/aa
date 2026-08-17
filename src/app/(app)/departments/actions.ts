"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, AccessError } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const departmentSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  shortName: z.string().max(20).optional().or(z.literal("")),
  establishedYear: z.coerce.number().int().min(1900).max(2100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  institutionId: z.string().min(1),
  hodUserId: z.string().optional().or(z.literal("")),
  deptCoordinatorUserId: z.string().optional().or(z.literal("")),
});

export async function saveDepartment(input: z.infer<typeof departmentSchema>): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  try {
    const access = await requireAccess();
    const parsed = departmentSchema.parse(input);
    if (parsed.id) {
      if (!access.permissions.has("department.edit")) throw new AccessError("Permission denied: department.edit");
      const prev = await prisma.department.findUnique({ where: { id: parsed.id } });
      const dept = await prisma.department.update({
        where: { id: parsed.id },
        data: {
          code: parsed.code,
          name: parsed.name,
          shortName: parsed.shortName || null,
          establishedYear: parsed.establishedYear ?? null,
          description: parsed.description || null,
          hodUserId: parsed.hodUserId || null,
          deptCoordinatorUserId: parsed.deptCoordinatorUserId || null,
        },
      });
      await logAudit({
        userId: access.userId,
        action: "department.update",
        module: "department",
        entityType: "Department",
        entityId: dept.id,
        oldValues: prev ? { name: prev.name, hodUserId: prev.hodUserId } : undefined,
        newValues: { name: dept.name, hodUserId: dept.hodUserId },
      });
      revalidatePath("/departments");
      return { ok: true, id: dept.id };
    }

    if (!access.permissions.has("department.create")) throw new AccessError("Permission denied: department.create");
    const exists = await prisma.department.findUnique({ where: { code: parsed.code } });
    if (exists) return { ok: false, error: `Department code "${parsed.code}" already exists` };
    const dept = await prisma.department.create({
      data: {
        institutionId: parsed.institutionId,
        code: parsed.code,
        name: parsed.name,
        shortName: parsed.shortName || null,
        establishedYear: parsed.establishedYear ?? null,
        description: parsed.description || null,
        hodUserId: parsed.hodUserId || null,
        deptCoordinatorUserId: parsed.deptCoordinatorUserId || null,
      },
    });
    await logAudit({
      userId: access.userId,
      action: "department.create",
      module: "department",
      entityType: "Department",
      entityId: dept.id,
      newValues: { code: dept.code, name: dept.name },
    });
    revalidatePath("/departments");
    return { ok: true, id: dept.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save department" };
  }
}

export async function toggleDepartment(id: string, isActive: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const access = await requireAccess();
    if (!access.permissions.has("department.edit")) throw new AccessError("Permission denied: department.edit");
    await prisma.department.update({ where: { id }, data: { isActive } });
    await logAudit({
      userId: access.userId,
      action: isActive ? "department.activate" : "department.deactivate",
      module: "department",
      entityType: "Department",
      entityId: id,
      newValues: { isActive },
    });
    revalidatePath("/departments");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update department" };
  }
}
