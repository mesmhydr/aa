"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { createStudent } from "@/app/(app)/students/actions";
import { Button, Input, Label, Select } from "@/components/ui";

type StudentRow = {
  id: string;
  usn: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  departmentId: string;
  programId: string;
  schemeId: string | null;
  admissionYear: number;
  admissionType: string;
  profile: { dob: Date | null; gender: string | null; phone: string | null; personalEmail: string | null; address: string | null } | null;
  parent: { fatherName: string | null; motherName: string | null; fatherPhone: string | null; motherPhone: string | null } | null;
};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function StudentForm({ institutionId, departments, programs, schemes, existing }: {
  institutionId: string;
  departments: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string; code: string; departmentId: string }>;
  schemes: Array<{ id: string; name: string }>;
  existing?: StudentRow;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    institutionId,
    usn: existing?.usn ?? "",
    firstName: existing?.firstName ?? "",
    lastName: existing?.lastName ?? "",
    email: existing?.email ?? "",
    password: "Welcome@123",
    departmentId: existing?.departmentId ?? departments[0]?.id ?? "",
    programId: existing?.programId ?? "",
    schemeId: existing?.schemeId ?? schemes[0]?.id ?? "",
    admissionYear: existing?.admissionYear?.toString() ?? "",
    admissionType: existing?.admissionType ?? "REGULAR",
    dob: toDateInput(existing?.profile?.dob ?? null),
    gender: existing?.profile?.gender ?? "",
    phone: existing?.profile?.phone ?? "",
    personalEmail: existing?.profile?.personalEmail ?? "",
    fatherName: existing?.parent?.fatherName ?? "",
    motherName: existing?.parent?.motherName ?? "",
    fatherPhone: existing?.parent?.fatherPhone ?? "",
    motherPhone: existing?.parent?.motherPhone ?? "",
    address: existing?.profile?.address ?? "",
  });

  const deptPrograms = programs.filter((p) => p.departmentId === form.departmentId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await createStudent({
      id: existing?.id,
      ...form,
      admissionYear: Number(form.admissionYear),
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
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Student</>)}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{existing ? "Edit Student" : "Add Student"}</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>USN</Label>
                  <Input required value={form.usn} onChange={(e) => setForm({ ...form, usn: e.target.value.toUpperCase() })} placeholder="1AA21CS001" />
                </div>
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Login email</Label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={Boolean(existing)} />
                </div>
                {!existing && (
                  <div className="space-y-2">
                    <Label>Login password (min 8)</Label>
                    <Input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.departmentId} onChange={(e) => { setForm({ ...form, departmentId: e.target.value, programId: "" }); }}>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                    <option value="">Select program</option>
                    {deptPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Select value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })}>
                    {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admission year</Label>
                  <Input required type="number" min={2000} max={2100} value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: e.target.value })} placeholder="2026" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Admission type</Label>
                  <Select value={form.admissionType} onChange={(e) => setForm({ ...form, admissionType: e.target.value })}>
                    <option>REGULAR</option><option>LATERAL</option><option>READMISSION</option><option>CARRY_OVER</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of birth</Label>
                  <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">—</option><option>MALE</option><option>FEMALE</option><option>OTHER</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Personal email</Label>
                  <Input type="email" value={form.personalEmail} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Father name</Label>
                  <Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Mother name</Label>
                  <Input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Father phone</Label>
                  <Input value={form.fatherPhone} onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Mother phone</Label>
                  <Input value={form.motherPhone} onChange={(e) => setForm({ ...form, motherPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : existing ? "Save Changes" : "Create Student"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}