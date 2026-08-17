"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { addExam } from "@/app/(app)/examinations/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function ExamForm({ sessionId, courses }: {
  sessionId: string;
  courses: Array<{ id: string; code: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    courseId: "",
    examDate: "",
    startTime: "",
    endTime: "",
    durationMinutes: "180",
    maxMarks: "100",
    isPractical: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await addExam({
      sessionId,
      ...form,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      maxMarks: Number(form.maxMarks),
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Schedule Exam
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Schedule Exam</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                  <option value="">Select</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exam date</Label>
                  <Input required type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max marks</Label>
                  <Input required type="number" min={1} max={500} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Start time</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" min={1} max={600} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPractical} onChange={(e) => setForm({ ...form, isPractical: e.target.checked })} className="h-4 w-4" />
                Practical exam
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.courseId}>{saving ? "Saving…" : "Schedule"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}