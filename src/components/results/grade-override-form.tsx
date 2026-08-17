"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { editResultItem } from "@/app/(app)/results/actions";
import { Button, Input, Label } from "@/components/ui";

export function GradeOverrideForm({ resultItemId, sessionId, grades, current }: {
  resultItemId: string;
  sessionId: string;
  grades: Array<{ grade: string; gradePoint: number }>;
  current: { grade: string; remark: string | null };
}) {
  const router = useRouter();
  const [grade, setGrade] = React.useState(current.grade);
  const [remark, setRemark] = React.useState(current.remark ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await editResultItem({ resultItemId, sessionId, grade, remark });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="space-y-1">
        <Label>Override grade</Label>
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="h-9 rounded-md border border-border bg-card px-2 text-sm">
          {grades.map((g) => <option key={g.grade} value={g.grade}>{g.grade} ({g.gradePoint})</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Remark</Label>
        <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Reason" className="h-9 w-40" />
      </div>
      <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Apply"}</Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-success">Saved</p>}
    </form>
  );
}