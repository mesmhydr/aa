"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ListPlus, Plus, Sparkles } from "lucide-react";
import { createDefaultSections, createSection, deleteSection } from "@/app/(app)/sections/actions";
import { Button, Input } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";

export function SectionManager({
  departmentId,
  semesterId,
  departmentLabel,
  semesterLabel,
  sections,
  canManage,
}: {
  departmentId: string;
  semesterId: string;
  departmentLabel: string;
  semesterLabel: string;
  sections: Array<{ id: string; name: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await createSection({ departmentId, academicSemesterId: semesterId, name: name.trim() });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setName("");
    router.refresh();
  }

  async function onDefaults() {
    setBusy(true);
    setError(null);
    const res = await createDefaultSections(departmentId, semesterId);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{departmentLabel} · {semesterLabel}</h3>
          <p className="text-sm text-muted-foreground">{sections.length} section{sections.length === 1 ? "" : "s"}</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDefaults} disabled={busy}>
              <Sparkles className="h-3.5 w-3.5" /> Add A, B, C
            </Button>
          </div>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No sections yet{canManage ? " — add one below or use “Add A, B, C”" : ""}.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm">
              <span className="text-sm font-semibold">Section {s.name}</span>
              {canManage && (
                <DeleteButton
                  action={deleteSection}
                  id={s.id}
                  label=""
                  confirmText={`Delete Section ${s.name}?`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form onSubmit={onAdd} className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <div className="relative">
            <ListPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Section name (e.g. D)"
              maxLength={4}
              className="w-48 pl-9"
            />
          </div>
          <Button type="submit" size="sm" disabled={busy || !name.trim()}>
            <Plus className="h-3.5 w-3.5" /> Add Section
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
}
