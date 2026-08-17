"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { createFaculty } from "@/app/(app)/faculty/actions";
import { Button, Input, Label, Select } from "@/components/ui";

type FacultyRow = {
  id: string;
  name: string;
  employeeId: string;
  email: string | null;
  departmentId: string;
  designation: string;
  qualification: string | null;
  specialization: string | null;
  experienceYears: number | null;
  joiningDate: Date | null;
  employmentType: string;
  phone: string | null;
};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FacultyForm({ departments, existing }: {
  departments: Array<{ id: string; name: string }>;
  existing?: FacultyRow;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    employeeId: existing?.employeeId ?? "",
    name: existing ? (existing.name ?? "") : "",
    email: existing?.email ?? "",
    password: "Welcome@123",
    departmentId: existing?.departmentId ?? departments[0]?.id ?? "",
    designation: existing?.designation ?? "Assistant Professor",
    qualification: existing?.qualification ?? "",
    specialization: existing?.specialization ?? "",
    experienceYears: existing?.experienceYears?.toString() ?? "",
    joiningDate: toDateInput(existing?.joiningDate ?? null),
    employmentType: existing?.employmentType ?? "PERMANENT",
    phone: existing?.phone ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await createFaculty({
      id: existing?.id,
      ...form,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant={existing ? "outline" : "default"} size={existing ? "icon" : "default"}>
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Faculty</>)}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{existing ? "Edit Faculty" : "Add Faculty"}</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value.toUpperCase() })} placeholder="FAC001" />
                </div>
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Login email</Label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={Boolean(existing)} />
                </div>
                {!existing && (
                  <div className="space-y-2">
                    <Label>Password (min 8)</Label>
                    <Input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Assistant Professor" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="M.Tech, Ph.D" />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Experience (years)</Label>
                  <Input type="number" min={0} max={60} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Joining date</Label>
                  <Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Employment type</Label>
                  <Select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                    <option>PERMANENT</option><option>CONTRACT</option><option>ADJUNCT</option><option>VISITING</option><option>GUEST</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : existing ? "Save Changes" : "Create Faculty"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}