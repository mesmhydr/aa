"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveExamAttendance } from "@/app/(app)/examinations/actions";
import { Button } from "@/components/ui";

export function ExamAttendanceForm({ examId, sessionId, students }: {
  examId: string;
  sessionId: string;
  students: Array<{ id: string; name: string; usn: string; status: string }>;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = React.useState<Record<string, string>>(Object.fromEntries(students.map((s) => [s.id, s.status])));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const setAll = (status: string) => setStatuses((st) => Object.fromEntries(students.map((s) => [s.id, status])));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await saveExamAttendance({
      examId,
      sessionId,
      entries: students.map((s) => ({ studentId: s.id, status: statuses[s.id] })),
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setAll("PRESENT")}>All Present</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setAll("ABSENT")}>All Absent</Button>
      </div>
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students allocated for this exam yet.</p>
      ) : (
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
                      value={statuses[s.id]}
                      onChange={(e) => setStatuses({ ...statuses, [s.id]: e.target.value })}
                      className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                    >
                      <option>PRESENT</option><option>ABSENT</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-success">Attendance saved</p>}
      {students.length > 0 && (
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      )}
    </form>
  );
}