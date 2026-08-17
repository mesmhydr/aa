"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createRole, assignRole } from "@/app/(app)/settings/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function CreateRoleForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ code: "", name: "", scope: "DEPARTMENT", description: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await createRole(form);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    setForm({ code: "", name: "", scope: "DEPARTMENT", description: "" });
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>New Role</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Role</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LIBRARIAN" /></div>
                <div className="space-y-2"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Librarian" /></div>
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                  <option value="INSTITUTION">Institution</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="SELF">Self</option>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AssignRoleForm({ roles, departments }: {
  roles: Array<{ id: string; code: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ userId: "", roleId: roles[0]?.id ?? "", departmentId: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await assignRole(form);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    setForm({ userId: "", roleId: roles[0]?.id ?? "", departmentId: "" });
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>Assign Role</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assign Role</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="user id" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department (for dept roles)</Label>
                <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">None</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit">Assign</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}