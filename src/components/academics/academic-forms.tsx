"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { saveAcademicYear, saveProgram, saveScheme, saveSemester, saveBatch } from "@/app/(app)/academics/actions";
import { Button, Input, Label, Select } from "@/components/ui";

function useModalSubmit(fn: (payload: any) => Promise<{ ok: boolean; error?: string }>) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent, payload: any, close: () => void) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fn(payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Failed");
      return;
    }
    close();
    router.refresh();
  }

  return { error, saving, submit, setError };
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function YearForm({ institutionId, existing }: { institutionId: string; existing?: { id: string; name: string; startDate: Date; endDate: Date } }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: existing?.name ?? "",
    startDate: existing ? existing.startDate.toISOString().slice(0, 10) : "",
    endDate: existing ? existing.endDate.toISOString().slice(0, 10) : "",
  });
  const { error, saving, submit } = useModalSubmit(saveAcademicYear);
  const close = () => setOpen(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"} size={existing ? "icon" : "default"}>
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Year</>)}
      </Button>
      <Modal open={open} onClose={close} title={existing ? "Edit Academic Year" : "Add Academic Year"}>
        <form onSubmit={(e) => submit(e, { id: existing?.id, institutionId, ...form }, close)} className="space-y-4">
          <div className="space-y-2">
            <Label>Year name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2026-27" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ProgramForm({ institutionId, departments, existing }: {
  institutionId: string;
  departments: Array<{ id: string; name: string }>;
  existing?: { id: string; code: string; name: string; degreeType: string; departmentId: string; durationSemesters: number };
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    code: existing?.code ?? "",
    name: existing?.name ?? "",
    degreeType: existing?.degreeType ?? "B.E.",
    departmentId: existing?.departmentId ?? departments[0]?.id ?? "",
    durationSemesters: existing?.durationSemesters?.toString() ?? "8",
  });
  const { error, saving, submit } = useModalSubmit(saveProgram);
  const close = () => setOpen(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"} size={existing ? "icon" : "default"}>
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Program</>)}
      </Button>
      <Modal open={open} onClose={close} title={existing ? "Edit Program" : "Add Program"}>
        <form onSubmit={(e) => submit(e, { id: existing?.id, institutionId, ...form }, close)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Program code</Label>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CSE" />
            </div>
            <div className="space-y-2">
              <Label>Degree type</Label>
              <Input required value={form.degreeType} onChange={(e) => setForm({ ...form, degreeType: e.target.value })} placeholder="B.E." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Program name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Computer Science & Engineering" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (semesters)</Label>
              <Input required type="number" min={1} max={12} value={form.durationSemesters} onChange={(e) => setForm({ ...form, durationSemesters: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SchemeForm({ institutionId, programs, existing }: {
  institutionId: string;
  programs: Array<{ id: string; code: string; name: string }>;
  existing?: { id: string; code: string; name: string; regulation: string | null; programIds: string[] };
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    code: existing?.code ?? "",
    name: existing?.name ?? "",
    regulation: existing?.regulation ?? "",
  });
  const [programIds, setProgramIds] = React.useState<string[]>(existing?.programIds ?? []);
  const { error, saving, submit } = useModalSubmit(saveScheme);
  const close = () => setOpen(false);
  const toggleProgram = (id: string) => setProgramIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"} size={existing ? "icon" : "default"}>
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Scheme</>)}
      </Button>
      <Modal open={open} onClose={close} title={existing ? "Edit Scheme" : "Add Scheme"}>
        <form onSubmit={(e) => submit(e, { id: existing?.id, institutionId, programIds, ...form }, close)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Scheme code</Label>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VTU-2022" />
            </div>
            <div className="space-y-2">
              <Label>Regulation</Label>
              <Input value={form.regulation} onChange={(e) => setForm({ ...form, regulation: e.target.value })} placeholder="2022" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Scheme name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VTU 2022 Scheme" />
          </div>
          <div className="space-y-2">
            <Label>Applicable programs</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {programs.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={programIds.includes(p.id)} onChange={() => toggleProgram(p.id)} className="h-4 w-4" />
                  {p.name} ({p.code})
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SemesterForm({ academicYearId, existing }: {
  academicYearId: string;
  existing?: { id: string; semesterNumber: number; startDate: Date; endDate: Date };
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    semesterNumber: existing?.semesterNumber?.toString() ?? "1",
    startDate: existing ? existing.startDate.toISOString().slice(0, 10) : "",
    endDate: existing ? existing.endDate.toISOString().slice(0, 10) : "",
  });
  const { error, saving, submit } = useModalSubmit(saveSemester);
  const close = () => setOpen(false);
  return (
    <>
      <Button type="button" size="sm" variant={existing ? "outline" : "default"} onClick={() => setOpen(true)}>
        {existing ? <Pencil className="h-3.5 w-3.5" /> : <><Plus className="h-3.5 w-3.5" /> Add Semester</>}
      </Button>
      <Modal open={open} onClose={close} title={existing ? "Edit Semester" : "Add Semester"}>
        <form onSubmit={(e) => submit(e, { id: existing?.id, academicYearId, ...form }, close)} className="space-y-4">
          <div className="space-y-2">
            <Label>Semester number</Label>
            <Input required type="number" min={1} max={12} value={form.semesterNumber} onChange={(e) => setForm({ ...form, semesterNumber: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function BatchForm({ institutionId, programs, schemes, existing }: {
  institutionId: string;
  programs: Array<{ id: string; code: string; name: string }>;
  schemes: Array<{ id: string; code: string; name: string }>;
  existing?: { id: string; programId: string; schemeId: string | null; admissionYear: number; name: string | null };
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    programId: existing?.programId ?? "",
    schemeId: existing?.schemeId ?? "",
    admissionYear: existing?.admissionYear?.toString() ?? new Date().getFullYear().toString(),
    name: existing?.name ?? "",
  });
  const { error, saving, submit } = useModalSubmit(saveBatch);
  const close = () => setOpen(false);
  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"}>
        {existing ? <Pencil className="h-3.5 w-3.5" /> : <><Plus className="h-3.5 w-3.5" /> Add Batch</>}
      </Button>
      <Modal open={open} onClose={close} title={existing ? "Edit Batch" : "Add Batch"}>
        <form onSubmit={(e) => submit(e, { id: existing?.id, institutionId, ...form }, close)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                <option value="">Select program</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admission year</Label>
              <Input required type="number" min={1990} max={2100} value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Scheme</Label>
              <Select value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })}>
                <option value="">None</option>
                {schemes.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
