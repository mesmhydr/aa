"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/app/(app)/attendance/actions";
import { Badge, Button, Input, Label, Select } from "@/components/ui";

const STATUSES = ["PRESENT", "ABSENT", "OD", "LEAVE", "MEDICAL"] as const;

export function AttendanceMarkForm({ offerings, selectedOffering, selectedDate }: {
  offerings: Array<{ id: string; label: string }>;
  selectedOffering?: string;
  selectedDate?: string;
}) {
  const router = useRouter();
  const [offeringId, setOfferingId] = React.useState(selectedOffering ?? offerings[0]?.id ?? "");
  const [date, setDate] = React.useState(selectedDate ?? new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = React.useState("1");
  const [students, setStudents] = React.useState<Array<{ id: string; name: string; usn: string; status: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function loadRoster() {
    if (!offeringId || !date) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/attendance/roster?offering=${offeringId}&date=${date}&period=${period || "1"}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load roster");
      setStudents(data.students);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { void loadRoster(); }, [offeringId, date, period]);

  const setAll = (status: string) => setStudents((s) => s.map((x) => ({ ...x, status })));
  const presentCount = students.filter((s) => s.status === "PRESENT").length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await markAttendance({
      courseOfferingId: offeringId,
      date,
      periodNumber: period ? Number(period) : undefined,
      entries: students.map((s) => ({ studentId: s.id, status: s.status })),
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Course offering</Label>
          <Select value={offeringId} onChange={(e) => setOfferingId(e.target.value)}>
            {offerings.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Period (optional)</Label>
          <Input type="number" min={1} max={12} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="1" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading roster…" : `${students.length} students · ${presentCount} present`}
        </p>
        <div className="flex gap-1">
          {STATUSES.map((st) => (
            <Button key={st} type="button" size="sm" variant="outline" onClick={() => setAll(st)} disabled={loading || students.length === 0}>
              All {st}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-success">Attendance saved</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        {students.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">USN</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-1.5">{s.name}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{s.usn}</td>
                    <td className="px-3 py-1.5">
                      <select
                        value={s.status}
                        onChange={(e) => setStudents((arr) => arr.map((x) => (x.id === s.id ? { ...x, status: e.target.value } : x)))}
                        className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                      >
                        {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {students.length > 0 && (
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Attendance"}</Button>
          </div>
        )}

        {!loading && students.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No registered students found for this offering. Create the offering first to auto-register enrolled students.
          </div>
        )}
      </form>
    </div>
  );
}