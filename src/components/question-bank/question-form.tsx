"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { saveQuestion } from "@/app/(app)/question-bank/actions";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

export function QuestionForm({ courses, questionTypes, existing }: {
  courses: Array<{ id: string; code: string; name: string }>;
  questionTypes: Array<{ id: string; code: string; name: string }>;
  existing?: { id: string; courseId: string; questionTypeId: string; questionText: string; marks: number; co: string | null; bloomLevel: string | null; unit: string | null; topic: string | null; difficulty: string };
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    courseId: existing?.courseId ?? "",
    questionTypeId: existing?.questionTypeId ?? questionTypes[0]?.id ?? "",
    questionText: existing?.questionText ?? "",
    marks: existing?.marks?.toString() ?? "5",
    co: existing?.co ?? "",
    bloomLevel: existing?.bloomLevel ?? "",
    unit: existing?.unit ?? "",
    topic: existing?.topic ?? "",
    difficulty: existing?.difficulty ?? "MEDIUM",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveQuestion({ ...form, id: existing?.id, marks: Number(form.marks) });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"} size={existing ? "icon" : "default"}>
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Question</>)}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{existing ? "Edit Question" : "Add Question"}</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                    <option value="">Select</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question type</Label>
                  <Select value={form.questionTypeId} onChange={(e) => setForm({ ...form, questionTypeId: e.target.value })}>
                    {questionTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Question text</Label>
                <Textarea required value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Marks</Label>
                  <Input required type="number" min={1} max={100} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CO</Label>
                  <Input value={form.co} onChange={(e) => setForm({ ...form, co: e.target.value })} placeholder="CO1" />
                </div>
                <div className="space-y-2">
                  <Label>Bloom</Label>
                  <Select value={form.bloomLevel} onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}>
                    <option value="">—</option>
                    <option>L1</option><option>L2</option><option>L3</option><option>L4</option><option>L5</option><option>L6</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option>EASY</option><option>MEDIUM</option><option>HARD</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit 3" />
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.courseId}>{saving ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}