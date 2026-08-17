"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveCieMarks } from "@/app/(app)/assessments/actions";
import { Badge, Button } from "@/components/ui";

export function CieMarksForm({ assessmentId, students }: {
  assessmentId: string;
  students: Array<{ id: string; name: string; usn: string; marksObtained: number | null; isAbsent: boolean }>;
}) {
  const router = useRouter();
  const [marks, setMarks] = React.useState<Record<string, string>>(
    Object.fromEntries(students.map((s) => [s.id, s.marksObtained != null ? String(s.marksObtained) : ""])),
  );
  const [absent, setAbsent] = React.useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.isAbsent])),
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await saveCieMarks({
      assessmentId,
      entries: students.map((s) => ({
        studentId: s.id,
        marksObtained: absent[s.id] ? undefined : marks[s.id] ? Number(marks[s.id]) : undefined,
        isAbsent: absent[s.id],
        status: "PENDING",
      })),
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students registered for this offering.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">USN</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Marks</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Absent</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-1.5">{s.name}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">{s.usn}</td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      disabled={absent[s.id]}
                      value={marks[s.id]}
                      onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                      className="h-8 w-24 rounded-md border border-border bg-card px-2 text-right text-sm disabled:opacity-40"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="checkbox" checked={absent[s.id]} onChange={(e) => setAbsent({ ...absent, [s.id]: e.target.checked })} className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-success">Marks saved</p>}
      {students.length > 0 && (
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Marks"}</Button>
        </div>
      )}
    </form>
  );
}