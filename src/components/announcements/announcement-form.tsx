"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveAnnouncement } from "@/app/(app)/announcements/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function AnnouncementForm({ departments }: {
  departments: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    message: "",
    audience: "INSTITUTION",
    departmentId: "",
    expiresAt: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await saveAnnouncement({ ...form, audience: form.audience as "INSTITUTION" | "DEPARTMENT" | "SECTION" | "COURSE" | "PROGRAM" });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setOpen(false);
    setForm({ title: "", message: "", audience: "INSTITUTION", departmentId: "", expiresAt: "" });
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> New Announcement
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Announcement</h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mid-term CIE schedule" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Details of the announcement…"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                    <option value="INSTITUTION">Institution</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="SECTION">Section</option>
                    <option value="PROGRAM">Program</option>
                    <option value="COURSE">Course</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department (for scoped)</Label>
                  <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">All</option>
                    {departments.map((dep) => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Publishing…" : "Publish"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}