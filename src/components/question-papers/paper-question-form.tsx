"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { addPaperQuestion } from "@/app/(app)/question-papers/actions";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

type BankQuestion = { id: string; questionText: string; marks: number; co: string | null; bloomLevel: string | null; unit: string | null };

export function PaperQuestionForm({ paperId, courseId, bankQuestions }: {
  paperId: string;
  courseId: string;
  bankQuestions: BankQuestion[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [fromBank, setFromBank] = React.useState(true);
  const [bankId, setBankId] = React.useState("");
  const [form, setForm] = React.useState({ questionText: "", marks: "5", co: "", bloomLevel: "", unit: "", sortOrder: "1", isOptional: false });

  function onSelectBank(id: string) {
    setBankId(id);
    const q = bankQuestions.find((b) => b.id === id);
    if (q) {
      setForm({ questionText: q.questionText, marks: String(q.marks), co: q.co ?? "", bloomLevel: q.bloomLevel ?? "", unit: q.unit ?? "", sortOrder: "1", isOptional: false });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await addPaperQuestion({
      paperId,
      questionId: fromBank ? bankId || undefined : undefined,
      questionText: form.questionText,
      marks: Number(form.marks),
      co: form.co,
      bloomLevel: form.bloomLevel,
      unit: form.unit,
      sortOrder: Number(form.sortOrder),
      isOptional: form.isOptional,
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
        <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Question to Paper</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mb-4 flex gap-2">
              <button type="button" onClick={() => setFromBank(true)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${fromBank ? "bg-primary text-primary-foreground" : "bg-muted"}`}>From Question Bank</button>
              <button type="button" onClick={() => setFromBank(false)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${!fromBank ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Custom Question</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              {fromBank && (
                <div className="space-y-2">
                  <Label>Approved bank question</Label>
                  <Select value={bankId} onChange={(e) => onSelectBank(e.target.value)}>
                    <option value="">Select</option>
                    {bankQuestions.map((b) => <option key={b.id} value={b.id}>[{b.marks}m] {b.questionText.slice(0, 80)}</option>)}
                  </Select>
                  {bankQuestions.length === 0 && <p className="text-xs text-muted-foreground">No approved questions in the bank for this course yet.</p>}
                </div>
              )}
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
                  <Label>Sort</Label>
                  <Input type="number" min={1} max={99} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CO</Label>
                  <Input value={form.co} onChange={(e) => setForm({ ...form, co: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Bloom</Label>
                  <Select value={form.bloomLevel} onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}>
                    <option value="">—</option>
                    <option>L1</option><option>L2</option><option>L3</option><option>L4</option><option>L5</option><option>L6</option>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2 w-24">
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm pt-5">
                  <input type="checkbox" checked={form.isOptional} onChange={(e) => setForm({ ...form, isOptional: e.target.checked })} className="h-4 w-4" />
                  Optional (OR)
                </label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || (fromBank && !bankId)}>{saving ? "Adding…" : "Add"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}