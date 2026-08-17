"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toggleRole, saveRolePermission } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui";

export function RolePermissionManager({ role, permissions, granted }: {
  role: { id: string; code: string; name: string };
  permissions: Array<{ code: string; module: string; description?: string }>;
  granted: Set<string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function onToggle(code: string) {
    setBusy(code);
    await saveRolePermission(role.id, code, !granted.has(code));
    setBusy(null);
    router.refresh();
  }

  const grouped = permissions.reduce((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {} as Record<string, Array<{ code: string; module: string; description?: string }>>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{role.name} <span className="font-mono text-xs text-muted-foreground">({role.code})</span></h2>
        <Button type="button" size="sm" variant="outline" onClick={() => toggleRole(role.id, role.code === "SUPER_ADMIN")}>Deactivate</Button>
      </div>
      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{module}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {perms.map((p) => {
              const on = granted.has(p.code);
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => onToggle(p.code)}
                  disabled={busy === p.code || role.code === "SUPER_ADMIN"}
                  className={`flex items-start gap-2 rounded-lg border p-2 text-left text-sm ${on ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-sm border ${on ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                  <span>
                    <span className="block font-medium">{p.code}</span>
                    {p.description && <span className="block text-xs text-muted-foreground">{p.description}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}