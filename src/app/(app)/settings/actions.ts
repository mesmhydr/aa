"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

export async function toggleRole(roleId: string, _isSystem: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "role.manage");
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return { ok: false as const, error: "Role not found" };
    if (role.isSystem) return { ok: false as const, error: "System roles cannot be deactivated" };
    await prisma.role.update({ where: { id: roleId }, data: { isActive: !role.isActive } });
    await logAudit({ userId: access.userId, action: "role.toggle", module: "admin", entityType: "Role", entityId: roleId, newValues: { isActive: !role.isActive } });
    revalidatePath("/settings");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveRolePermission(roleId: string, code: string, grant: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "role.manage");
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return { ok: false as const, error: "Role not found" };
    if (role.code === "SUPER_ADMIN") return { ok: false as const, error: "Super Admin permissions are fixed" };
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (!permission) return { ok: false as const, error: "Permission not found" };

    if (grant) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id },
      });
    } else {
      await prisma.rolePermission.deleteMany({ where: { roleId, permissionId: permission.id } });
    }
    await logAudit({ userId: access.userId, action: grant ? "role.permission_grant" : "role.permission_revoke", module: "admin", entityType: "Role", entityId: roleId, newValues: { code, grant } });
    revalidatePath("/settings");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createRole(input: { code: string; name: string; scope: string; description?: string }) {
  try {
    const access = await requireAccess();
    requirePermission(access, "role.manage");
    const d = z.object({ code: z.string().min(2).max(50), name: z.string().min(1), scope: z.enum(["INSTITUTION", "DEPARTMENT", "SELF"]), description: z.string().optional() }).parse(input);
    await prisma.role.create({ data: { code: d.code.toUpperCase(), name: d.name, scope: d.scope, description: d.description || null } });
    await logAudit({ userId: access.userId, action: "role.create", module: "admin", entityType: "Role", newValues: { code: d.code } });
    revalidatePath("/settings");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function assignRole(input: { userId: string; roleId: string; departmentId?: string }) {
  try {
    const access = await requireAccess();
    requirePermission(access, "user.manage");
    const d = z.object({ userId: z.string().min(1), roleId: z.string().min(1), departmentId: z.string().optional() }).parse(input);
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: d.userId, roleId: d.roleId } },
      update: { departmentId: d.departmentId || null },
      create: { userId: d.userId, roleId: d.roleId, departmentId: d.departmentId || null, assignedBy: access.userId },
    });
    await logAudit({ userId: access.userId, action: "user.role_assign", module: "admin", entityType: "User", entityId: d.userId, newValues: { roleId: d.roleId } });
    revalidatePath("/settings");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function removeUserRole(userId: string, roleId: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "user.manage");
    await prisma.userRole.deleteMany({ where: { userId, roleId } });
    await logAudit({ userId: access.userId, action: "user.role_remove", module: "admin", entityType: "User", entityId: userId, newValues: { roleId } });
    revalidatePath("/settings");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}