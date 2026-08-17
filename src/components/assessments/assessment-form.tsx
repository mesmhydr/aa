"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveAssessment } from "@/app/(app)/assessments/actions";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

export function AssessmentForm({ offerings, components, semesters }: {
  offerings: Array<{ id: string; label: string }>;
  components: Array<{ id: string; code: string; name: string; maxMarks: number }>;
  semesters: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    courseOfferingId: "",
    componentId: components[0]?.id ?? "",
    academicSemesterId: semesters[0]?.id ?? "",
    assessmentDate: "",
    durationMinutes: "60",
    maxMarks: components[0]?.maxMarks?.toString() ?? "50",
    instructions: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveAssessment({
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
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Schedule Assessment
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Schedule Assessment</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Assessment name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="CIE-1 Test" />
              </div>
              <div className="space-y-2">
                <Label>Course offering</Label>
                <Select value={form.courseOfferingId} onChange={(e) => setForm({ ...form, courseOfferingId: e.target.value })}>
                  <option value="">Select</option>
                  {offerings.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Component</Label>
                  <Select value={form.componentId} onChange={(e) => setForm({ ...form, componentId: e.target.value })}>
                    {components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={form.academicSemesterId} onChange={(e) => setForm({ ...form, academicSemesterId: e.target.value })}>
                    {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input required type="date" value={form.assessmentDate} onChange={(e) => setForm({ ...form, assessmentDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" min={1} max={600} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max marks</Label>
                  <Input required type="number" min={1} max={500} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.courseOfferingId}>{saving ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}