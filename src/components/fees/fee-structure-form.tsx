"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveFeeStructure } from "@/app/(app)/fees/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function FeeStructureForm({ feeTypes, years }: {
  feeTypes: Array<{ id: string; code: string; name: string }>;
  years: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    feeTypeId: feeTypes[0]?.id ?? "",
    academicYearId: years.find((y) => (y as { isCurrent?: boolean }).isCurrent)?.id ?? years[0]?.id ?? "",
    semesterNumber: "0",
    amount: "",
    isMandatory: true,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveFeeStructure({
      feeTypeId: form.feeTypeId,
      academicYearId: form.academicYearId,
      semesterNumber: Number(form.semesterNumber),
      amount: Number(form.amount),
      isMandatory: form.isMandatory,
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
        <Plus className="mr-1 h-4 w-4" /> New Fee Structure
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Fee Structure</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fee type</Label>
                  <Select value={form.feeTypeId} onChange={(e) => setForm({ ...form, feeTypeId: e.target.value })}>
                    {feeTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Academic year</Label>
                  <Select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
                    {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Semester (0 = all)</Label>
                  <Input required type="number" min={0} max={12} value={form.semesterNumber} onChange={(e) => setForm({ ...form, semesterNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input required type="number" step="0.01" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isMandatory} onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })} className="h-4 w-4" />
                Mandatory fee
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}