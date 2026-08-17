"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createPaper } from "@/app/(app)/question-papers/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function PaperCreateForm({ courses, semesters }: {
  courses: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    courseId: "",
    totalMarks: "100",
    durationMinutes: "180",
    academicSemesterId: semesters[0]?.id ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await createPaper({
      ...form,
      totalMarks: Number(form.totalMarks),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    router.push(`/question-papers/${res.id}`);
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Create Paper
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Question Paper</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Data Structures — SEE Model Paper" />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                  <option value="">Select</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total marks</Label>
                  <Input required type="number" min={1} max={500} value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" min={1} max={600} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={form.academicSemesterId} onChange={(e) => setForm({ ...form, academicSemesterId: e.target.value })}>
                    {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.courseId}>{saving ? "Creating…" : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}