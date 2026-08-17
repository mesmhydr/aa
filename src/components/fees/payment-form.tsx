"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { recordPayment, adjustFee } from "@/app/(app)/fees/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function PaymentForm({ studentId, fee }: {
  studentId: string;
  fee: { id: string; feeType: string; amount: number; paid: number; discount: number; waived: number };
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ amount: String(fee.amount - fee.paid - fee.discount - fee.waived), method: "CASH", transactionId: "", notes: "" });

  const outstanding = fee.amount - fee.paid - fee.discount - fee.waived;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);
    const res = await recordPayment({
      studentFeeId: fee.id,
      studentId,
      amount: Number(form.amount),
      method: form.method as never,
      transactionId: form.transactionId,
      notes: form.notes,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setSaved(`Receipt ${res.receipt} generated`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label>Amount</Label>
        <Input required type="number" step="0.01" min={0.01} max={outstanding} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Method</Label>
        <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
          <option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>CARD</option><option>CHECK</option>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Transaction / Ref no.</Label>
        <Input value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      {saved && <p className="text-sm text-success sm:col-span-2">{saved}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving || outstanding <= 0}>{saving ? "Recording…" : "Record Payment"}</Button>
      </div>
    </form>
  );
}

export function AdjustmentForm({ studentId, feeId }: { studentId: string; feeId: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ type: "DISCOUNT", amount: "", reason: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await adjustFee({ studentFeeId: feeId, studentId, type: form.type, amount: Number(form.amount), reason: form.reason });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setForm({ type: "DISCOUNT", amount: "", reason: "" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label>Type</Label>
        <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="DISCOUNT">Discount</option><option value="WAIVER">Waiver</option><option value="CONCESSION">Concession</option><option value="OTHER">Other</option>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Amount</Label>
        <Input required type="number" step="0.01" min={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Reason</Label>
        <Input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-3">{error}</p>}
      <div className="sm:col-span-3">
        <Button type="submit" size="sm" variant="outline" disabled={saving}>{saving ? "Applying…" : "Apply Adjustment"}</Button>
      </div>
    </form>
  );
}