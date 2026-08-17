"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveOffering } from "@/app/(app)/courses/actions";
import { Button, Label, Select } from "@/components/ui";

export function OfferingForm({ courses, departments, semesters, faculty, canAssign }: {
  courses: Array<{ id: string; code: string; name: string; departmentId: string; semesterNumber: number }>;
  departments: Array<{ id: string; name: string }>;
  semesters: Array<{ id: string; label: string }>;
  faculty: Array<{ id: string; name: string; departmentId: string }>;
  canAssign: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [courseId, setCourseId] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id ?? "");
  const [semesterId, setSemesterId] = React.useState(semesters[0]?.id ?? "");
  const [facultyId, setFacultyId] = React.useState("");

  const deptFaculty = faculty.filter((f) => f.departmentId === departmentId);
  const coursesForDept = courses.filter((c) => c.departmentId === departmentId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveOffering({ courseId, departmentId, academicSemesterId: semesterId, facultyId: canAssign ? facultyId : undefined });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1 h-3.5 w-3.5" /> Create Offering
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Course Offering</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setCourseId(""); setFacultyId(""); }}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setFacultyId(""); }}>
                  <option value="">Select course</option>
                  {coursesForDept.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name} (Sem {c.semesterNumber})</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
                    {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                </div>
              </div>
              {canAssign && (
                <div className="space-y-2">
                  <Label>Primary instructor (optional)</Label>
                  <Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                    <option value="">None</option>
                    {deptFaculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Students actively enrolled in the selected academic semester will be auto-registered for this offering.</p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving || !departmentId || !courseId}>{saving ? "Creating…" : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}