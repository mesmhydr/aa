"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export function DeleteButton({
  action,
  id,
  label = "Delete",
  confirmText,
  onDone,
}: {
  action: (id: string) => Promise<{ ok: boolean; error?: string }>;
  id: string;
  label?: string;
  confirmText?: string;
  onDone?: (res: { ok: boolean; error?: string }) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    if (!window.confirm(confirmText ?? "Delete this record? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await action(id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Delete failed");
      onDone?.(res);
      return;
    }
    onDone?.(res);
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={busy} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
        {busy ? "Deleting…" : label}
      </Button>
    </span>
  );
}
