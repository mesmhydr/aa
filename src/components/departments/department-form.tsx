"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { saveDepartment } from "@/app/(app)/departments/actions";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

type DepartmentRow = {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  establishedYear: number | null;
  description: string | null;
  institutionId: string;
  hodUserId: string | null;
  deptCoordinatorUserId: string | null;
};

export function DepartmentForm({
  institutionId,
  faculty,
  existing,
}: {
  institutionId: string;
  faculty: Array<{ id: string; name: string; employeeId: string }>;
  existing?: DepartmentRow;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    code: existing?.code ?? "",
    name: existing?.name ?? "",
    shortName: existing?.shortName ?? "",
    establishedYear: existing?.establishedYear?.toString() ?? "",
    description: existing?.description ?? "",
    hodUserId: existing?.hodUserId ?? "",
    deptCoordinatorUserId: existing?.deptCoordinatorUserId ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveDepartment({
      id: existing?.id,
      institutionId,
      code: form.code,
      name: form.name,
      shortName: form.shortName,
      description: form.description,
      hodUserId: form.hodUserId,
      deptCoordinatorUserId: form.deptCoordinatorUserId,
      establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant={existing ? "outline" : "default"}
        size={existing ? "icon" : "default"}
      >
        {existing ? <Pencil className="h-4 w-4" /> : (<><Plus className="mr-1 h-4 w-4" /> Add Department</>)}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{existing ? "Edit Department" : "Add Department"}</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Department code</Label>
                  <Input id="code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CSE" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName">Short name</Label>
                  <Input id="shortName" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="CSE" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Department name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Computer Science & Engineering" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established year</Label>
                  <Input id="establishedYear" type="number" value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod">Head of Department</Label>
                  <Select id="hod" value={form.hodUserId} onChange={(e) => setForm({ ...form, hodUserId: e.target.value })}>
                    <option value="">None</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.employeeId})</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deptCoord">Department ERP Coordinator</Label>
                <Select id="deptCoord" value={form.deptCoordinatorUserId} onChange={(e) => setForm({ ...form, deptCoordinatorUserId: e.target.value })}>
                  <option value="">None</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.employeeId})</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
