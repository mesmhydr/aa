import { AccessError, requireAccess } from "@/lib/access";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function requirePermission(code: string, userId?: string) {
  const access = await requireAccess();
  if (!access.permissions.has(code)) {
    throw new AccessError(`Permission denied: ${code}`, 403);
  }
  return access;
}

export function toActionError(e: unknown): ActionResult {
  if (e instanceof AccessError) {
    return { ok: false, error: e.message };
  }
  const msg = e instanceof Error ? e.message : "An unexpected error occurred";
  return { ok: false, error: msg };
}
