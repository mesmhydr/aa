"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveSession } from "@/app/(app)/examinations/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function SessionForm({ examTypes, academicSemesters }: {
  examTypes: Array<{ id: string; name: string }>;
  academicSemesters: Array<{ id: string; semesterNumber: number; academicYear: { name: string } }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    examTypeId: examTypes[0]?.id ?? "",
    academicSemesterId: academicSemesters[0]?.id ?? "",
    startDate: "",
    endDate: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveSession({ ...form });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    router.push(`/examinations/${res.id}`);
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> New Exam Session
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Exam Session</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Session name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Even Semester SEE 2026-27" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exam type</Label>
                  <Select value={form.examTypeId} onChange={(e) => setForm({ ...form, examTypeId: e.target.value })}>
                    {examTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Academic semester</Label>
                  <Select value={form.academicSemesterId} onChange={(e) => setForm({ ...form, academicSemesterId: e.target.value })}>
                    {academicSemesters.map((s) => <option key={s.id} value={s.id}>{s.academicYear.name} — Sem {s.semesterNumber}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}