"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, User, X } from "lucide-react";
import { clearTimetableCell, saveTimetableCell } from "@/app/(app)/timetable/actions";
import { Button, Label, Select } from "@/components/ui";
import { TIMETABLE_DAYS, TIMETABLE_ROWS, formatTime, type TimetableDay } from "@/lib/timetable";

export type GridEntry = {
  id: string;
  dayOfWeek: TimetableDay;
  periodNumber: number;
  courseId: string;
  courseCode: string;
  courseName: string;
  courseShort?: string | null;
  departmentShort?: string | null;
  facultyName?: string | null;
  roomCode?: string | null;
};

export type GridCourse = {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  semesterNumber: number;
  primaryFacultyId?: string | null;
};

type Picker = { day: TimetableDay; periodNumber: number };

function hueFor(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % 360;
  return h;
}

export function TimetableGrid({
  semesterId,
  sectionId,
  entries,
  courses,
  faculty,
  rooms,
  canEdit = false,
  today = null,
}: {
  semesterId: string;
  sectionId?: string | null;
  entries: GridEntry[];
  courses: GridCourse[];
  faculty: Array<{ id: string; name: string }>;
  rooms: Array<{ id: string; code: string }>;
  canEdit?: boolean;
  today?: TimetableDay | null;
}) {
  const router = useRouter();
  const [picker, setPicker] = React.useState<Picker | null>(null);
  const [courseId, setCourseId] = React.useState("");
  const [facultyId, setFacultyId] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const entryMap = React.useMemo(() => {
    const m = new Map<string, GridEntry>();
    for (const e of entries) m.set(`${e.dayOfWeek}|${e.periodNumber}`, e);
    return m;
  }, [entries]);

  const primaryFaculty = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of courses) if (c.primaryFacultyId) m.set(c.id, c.primaryFacultyId);
    return m;
  }, [courses]);

  function openPicker(day: TimetableDay, periodNumber: number) {
    const e = entryMap.get(`${day}|${periodNumber}`);
    setPicker({ day, periodNumber });
    setCourseId(e?.courseId ?? "");
    setFacultyId("");
    setRoomId("");
    setError(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!picker || !courseId) return;
    setSaving(true);
    setError(null);
    const res = await saveTimetableCell({
      academicSemesterId: semesterId,
      sectionId: sectionId ?? undefined,
      dayOfWeek: picker.day,
      periodNumber: picker.periodNumber,
      courseId,
      facultyId,
      roomId,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setPicker(null);
    router.refresh();
  }

  async function onRemove() {
    if (!picker) return;
    const e = entryMap.get(`${picker.day}|${picker.periodNumber}`);
    if (!e) return;
    setSaving(true);
    const res = await clearTimetableCell(e.id);
    setSaving(false);
    if (!res.ok) { setError(res.error); return; }
    setPicker(null);
    router.refresh();
  }

  const close = () => setPicker(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-32 px-2 py-2 text-left font-medium text-muted-foreground">Time</th>
              {TIMETABLE_DAYS.map((d) => (
                <th key={d} className={`px-2 py-2 text-left font-medium text-muted-foreground capitalize ${today === d ? "text-primary" : ""}`}>
                  {d.toLowerCase()}
                  {today === d && <span className="ml-1.5 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMETABLE_ROWS.map((row, i) =>
              row.kind === "BREAK" ? (
                <tr key={`break-${i}`} className="border-b border-border bg-muted/40">
                  <td className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {formatTime(row.startTime)}–{formatTime(row.endTime)}
                  </td>
                  <td colSpan={TIMETABLE_DAYS.length} className="px-2 py-1 text-center text-xs font-medium text-muted-foreground">
                    {row.label} · {formatTime(row.startTime)}–{formatTime(row.endTime)}
                  </td>
                </tr>
              ) : (
                <tr key={row.periodNumber} className="border-b border-border">
                  <td className="whitespace-nowrap px-2 py-1.5 align-top text-xs font-semibold">
                    {row.periodNumber}
                    <span className="block font-normal text-muted-foreground">
                      {formatTime(row.startTime)}–{formatTime(row.endTime)}
                    </span>
                  </td>
                  {TIMETABLE_DAYS.map((day) => {
                    const e = entryMap.get(`${day}|${row.periodNumber}`);
                    const isToday = today === day;
                    return (
                      <td
                        key={day}
                        className={`p-1 align-top ${isToday ? "bg-primary/[0.03]" : ""} ${canEdit ? "cursor-pointer" : ""}`}
                        onClick={canEdit ? () => openPicker(day, row.periodNumber) : undefined}
                      >
                        {e ? (
                          <div
                            className="h-full min-h-[58px] rounded-md border border-border/70 p-1.5"
                            style={{ backgroundColor: `hsl(${hueFor(e.courseCode)} 70% 93%)` }}
                          >
                            <p className="text-xs font-semibold leading-tight">{e.courseShort || e.courseCode}</p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                              {e.courseCode} · {e.courseName}
                              {e.departmentShort ? <span className="font-medium text-foreground/70"> · {e.departmentShort}</span> : null}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                              {e.facultyName && (
                                <span className="inline-flex items-center gap-0.5"><User className="h-3 w-3" />{e.facultyName}</span>
                              )}
                              {e.roomCode && (
                                <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{e.roomCode}</span>
                              )}
                            </div>
                          </div>
                        ) : canEdit ? (
                          <div className="flex h-full min-h-[58px] items-center justify-center rounded-md border border-dashed border-border text-muted-foreground/40 transition-colors hover:border-muted-foreground/30 hover:bg-muted/50 hover:text-muted-foreground/70">
                            <Plus className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[58px] items-center justify-center text-muted-foreground/25">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {picker.day.toLowerCase()} · Period {picker.periodNumber}
              </h2>
              <button onClick={close} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={onSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={courseId} onChange={(e) => {
                  const next = e.target.value;
                  const prevPrimary = next === courseId ? undefined : primaryFaculty.get(courseId);
                  const nextPrimary = next ? primaryFaculty.get(next) : "";
                  setCourseId(next);
                  if (!facultyId || facultyId === prevPrimary) setFacultyId(nextPrimary ?? "");
                }}>
                  <option value="">Select course…</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.shortName || c.name} (Sem {c.semesterNumber})</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Faculty (optional)</Label>
                  <Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                    <option value="">—</option>
                    {faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room (optional)</Label>
                  <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                    <option value="">—</option>
                    {rooms.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
                  </Select>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                {entryMap.get(`${picker.day}|${picker.periodNumber}`) ? (
                  <Button type="button" variant="outline" size="sm" onClick={onRemove} disabled={saving} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                ) : <span />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                  <Button type="submit" disabled={saving || !courseId}>{saving ? "Saving…" : "Save"}</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
