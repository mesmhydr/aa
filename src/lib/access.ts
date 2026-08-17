import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class AccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AccessError";
    this.status = status;
  }
}

export type Access = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  roleCodes: string[];
  permissions: Set<string>;
  departmentIds: string[];
  isInstitutionAdmin: boolean;
};

export type Scope =
  | { kind: "INSTITUTION" }
  | { kind: "DEPARTMENT"; ids: string[] }
  | { kind: "SELF" };

export async function getAccess(): Promise<Access | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const userId = session.user.id;
  const [userRoles, userPermissions] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId, role: { isActive: true } },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    }),
    prisma.userPermission.findMany({ where: { userId } }),
  ]);

  const roleCodes = userRoles.map((ur) => ur.role.code);
  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      if (rp.permission.isActive) permissions.add(rp.permission.code);
    }
  }
  for (const up of userPermissions) {
    if (up.isGranted) permissions.add(up.permissionId);
    else permissions.delete(up.permissionId);
  }

  const departmentIds = [
    ...new Set(userRoles.filter((ur) => ur.role.scope === "DEPARTMENT" && ur.departmentId).map((ur) => ur.departmentId!)),
  ];

  const isInstitutionAdmin = roleCodes.some((c) => c === "SUPER_ADMIN" || c === "ADMIN");

  return {
    userId,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role || "STUDENT",
      image: session.user.image ?? null,
    },
    roleCodes,
    permissions,
    departmentIds,
    isInstitutionAdmin,
  };
}

export const requireAccess = cache(async (): Promise<Access> => {
  const access = await getAccess();
  if (!access) throw new AccessError("Not authenticated", 401);
  return access;
});

export function requirePermission(access: Access, code: string): void {
  if (!access.permissions.has(code)) {
    throw new AccessError(`Permission denied: ${code}`, 403);
  }
}

export function hasPermission(access: Access, code: string): boolean {
  return access.permissions.has(code);
}

export function getScope(access: Access): Scope {
  if (access.isInstitutionAdmin) return { kind: "INSTITUTION" };
  if (access.departmentIds.length > 0) return { kind: "DEPARTMENT", ids: access.departmentIds };
  return { kind: "SELF" };
}
