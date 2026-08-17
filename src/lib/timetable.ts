/**
 * Shared weekly timetable grid configuration.
 *
 * The grid is the same for every department & semester: Monday–Saturday with
 * 50-minute periods, a 15-minute break, and a lunch break (per the institution's
 * schedule). The timetable editor, student "My Timetable" and faculty views all
 * render from these definitions so the slots always stay in sync.
 */

export const TIMETABLE_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export type TimetableDay = (typeof TIMETABLE_DAYS)[number];

export type TimetablePeriod = { periodNumber: number; startTime: string; endTime: string };

export type TimetableRow =
  | ({ kind: "PERIOD" } & TimetablePeriod)
  | { kind: "BREAK"; label: string; startTime: string; endTime: string };

/**
 * The institution's daily schedule:
 * 08:30–09:20 | 09:20–10:10 | 10:10–11:00 | break 11:00–11:15
 * 11:15–12:05 | 12:05–13:00 | lunch 13:00–13:30 | 13:30–14:20 | 14:20–15:10 | 15:10–16:00
 */
export const TIMETABLE_ROWS: TimetableRow[] = [
  { kind: "PERIOD", periodNumber: 1, startTime: "08:30", endTime: "09:20" },
  { kind: "PERIOD", periodNumber: 2, startTime: "09:20", endTime: "10:10" },
  { kind: "PERIOD", periodNumber: 3, startTime: "10:10", endTime: "11:00" },
  { kind: "BREAK", label: "Break", startTime: "11:00", endTime: "11:15" },
  { kind: "PERIOD", periodNumber: 4, startTime: "11:15", endTime: "12:05" },
  { kind: "PERIOD", periodNumber: 5, startTime: "12:05", endTime: "13:00" },
  { kind: "BREAK", label: "Lunch", startTime: "13:00", endTime: "13:30" },
  { kind: "PERIOD", periodNumber: 6, startTime: "13:30", endTime: "14:20" },
  { kind: "PERIOD", periodNumber: 7, startTime: "14:20", endTime: "15:10" },
  { kind: "PERIOD", periodNumber: 8, startTime: "15:10", endTime: "16:00" },
];

/** periodNumber -> fixed start/end times, for persisting timetable entries. */
export const PERIOD_TIMES = Object.fromEntries(
  TIMETABLE_ROWS.filter((r): r is Extract<TimetableRow, { kind: "PERIOD" }> => r.kind === "PERIOD").map((r) => [
    r.periodNumber,
    { startTime: r.startTime, endTime: r.endTime },
  ]),
) as Record<number, { startTime: string; endTime: string }>;

/** Map a JavaScript Date to the matching TimetableDay (or null on Sundays). */
export function dayOfWeekForDate(date: Date): TimetableDay | null {
  const day = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][date.getDay()];
  return (TIMETABLE_DAYS as readonly string[]).includes(day) ? (day as TimetableDay) : null;
}

/** "08:30" -> "8:30 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}
