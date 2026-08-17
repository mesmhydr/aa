"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { applyLeave, saveLeaveType } from "@/app/(app)/leave/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function LeaveForm({ leaveTypes }: { leaveTypes: Array<{ id: string; name: string; daysPerYear: number }> }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ leaveTypeId: leaveTypes[0]?.id ?? "", startDate: "", endDate: "", days: "1", reason: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await applyLeave({ ...form, days: Number(form.days) });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    setForm({ leaveTypeId: leaveTypes[0]?.id ?? "", startDate: "", endDate: "", days: "1", reason: "" });
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Apply for Leave
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Apply for Leave</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Leave type</Label>
                <Select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>
                  {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.daysPerYear}/yr)</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Days</Label>
                  <Input required type="number" step="0.5" min={0.5} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || leaveTypes.length === 0}>{saving ? "Submitting…" : "Submit"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function LeaveTypeForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ code: "", name: "", daysPerYear: "12", isPaid: true });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await saveLeaveType({ ...form, daysPerYear: Number(form.daysPerYear) });
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    setForm({ code: "", name: "", daysPerYear: "12", isPaid: true });
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Add Leave Type
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Leave Type</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CL" /></div>
                <div className="space-y-2"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Casual Leave" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Days / year</Label><Input required type="number" min={1} value={form.daysPerYear} onChange={(e) => setForm({ ...form, daysPerYear: e.target.value })} /></div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} className="h-4 w-4" /> Paid leave
                  </label>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}