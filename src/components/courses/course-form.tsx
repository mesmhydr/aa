"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { saveCourse, setFacultyForCourse } from "@/app/(app)/courses/actions";
import { Button, Input, Label, Select } from "@/components/ui";

type CourseRow = {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  departmentId: string;
  schemeId: string;
  courseTypeId: string;
  semesterNumber: number;
  credits: number;
  l_t_p: string | null;
  contactHours: number | null;
  isElective: boolean;
  isOpenElective: boolean;
  facultyCourses: Array<{ facultyId: string }>;
};

export function CourseForm({ departments, schemes, courseTypes, existing, faculty }: {
  departments: Array<{ id: string; name: string }>;
  schemes: Array<{ id: string; name: string }>;
  courseTypes: Array<{ id: string; code: string; name: string }>;
  faculty: Array<{ id: string; name: string; departmentId: string }>;
  existing?: CourseRow;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: existing?.code ?? "",
    name: existing?.name ?? "",
    shortName: existing?.shortName ?? "",
    departmentId: existing?.departmentId ?? departments[0]?.id ?? "",
    schemeId: existing?.schemeId ?? schemes[0]?.id ?? "",
    courseTypeId: existing?.courseTypeId ?? courseTypes[0]?.id ?? "",
    semesterNumber: existing?.semesterNumber?.toString() ?? "1",
    credits: existing?.credits?.toString() ?? "4",
    ltp: existing?.l_t_p ?? "3:0:0",
    contactHours: existing?.contactHours?.toString() ?? "",
    isElective: existing?.isElective ?? false,
    isOpenElective: existing?.isOpenElective ?? false,
  });
  const [selectedFaculty, setSelectedFaculty] = React.useState<string[]>(existing?.facultyCourses.map((f) => f.facultyId) ?? []);

  const close = () => setOpen(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveCourse({
      id: existing?.id,
      code: form.code,
      name: form.name,
      shortName: form.shortName,
      departmentId: form.departmentId,
      schemeId: form.schemeId,
      courseTypeId: form.courseTypeId,
      semesterNumber: Number(form.semesterNumber),
      credits: Number(form.credits),
      ltp: form.ltp,
      contactHours: form.contactHours ? Number(form.contactHours) : undefined,
      isElective: form.isElective,
      isOpenElective: form.isOpenElective,
    });
    if (!res.ok) { setError(res.error); setSaving(false); return; }
    if (existing) {
      const fa = await setFacultyForCourse(existing.id, selectedFaculty);
      if (!fa.ok) { setError(fa.error); setSaving(false); return; }
    }
    setSaving(false);
    close();
    router.refresh();
  }

  const deptFaculty = faculty.filter((f) => f.departmentId === form.departmentId || form.departmentId === "");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"} size={existing ? "icon" : "default"}>
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Course</>)}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{existing ? "Edit Course" : "Add Course"}</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Course code</Label>
                  <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="21CS32" />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input required type="number" min={1} max={12} value={form.semesterNumber} onChange={(e) => setForm({ ...form, semesterNumber: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Course name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Data Structures" />
              </div>
              <div className="space-y-2">
                <Label>Shorthand <span className="text-muted-foreground">(optional, shown on timetable)</span></Label>
                <Input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="DS" maxLength={20} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Select value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })}>
                    {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.courseTypeId} onChange={(e) => setForm({ ...form, courseTypeId: e.target.value })}>
                    {courseTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credits</Label>
                  <Input required type="number" min={0} max={30} value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>L-T-P</Label>
                  <Input value={form.ltp} onChange={(e) => setForm({ ...form, ltp: e.target.value })} placeholder="3:0:0" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isElective} onChange={(e) => setForm({ ...form, isElective: e.target.checked })} className="h-4 w-4" />
                  Elective
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isOpenElective} onChange={(e) => setForm({ ...form, isOpenElective: e.target.checked })} className="h-4 w-4" />
                  Open elective
                </label>
              </div>
              {existing && (
                <div className="space-y-2">
                  <Label>Assigned faculty</Label>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {deptFaculty.length === 0 && <p className="text-xs text-muted-foreground">No faculty in this department yet.</p>}
                    {deptFaculty.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedFaculty.includes(f.id)} onChange={() => setSelectedFaculty((s) => s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id])} className="h-4 w-4" />
                        {f.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
