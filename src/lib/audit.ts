import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  userId: string;
  action: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  departmentId?: string;
}) {
  const forwarded = await headersSafe();
  const ipAddress = forwarded.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const userAgent = forwarded.get("user-agent") || undefined;

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      module: params.module,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues === undefined ? undefined : (params.oldValues as object),
      newValues: params.newValues === undefined ? undefined : (params.newValues as object),
      ipAddress,
      userAgent,
      departmentId: params.departmentId,
    },
  });
}

async function headersSafe() {
  try {
    const { headers } = await import("next/headers");
    return await headers();
  } catch {
    return new Headers();
  }
}
