# Member B — Academic Engine

**Role:** Academic Engine Engineer *(strong engineer)*

**Owns:** Timetable & clash detection · Course registration & enrollment · Attendance rules & records · Leave management

---

## Top 3 claims (short answers to "what did you do?")

1. **Built the timetable with clash detection** — no room, faculty, batch, or section double-booked.
2. **Implemented course registration & enrollment** — capacity and prerequisite checks on top of existing offerings data.
3. **Built the attendance system** — configurable rules (e.g., minimum attendance %), daily marking, staff leave.

---

## 60-second script

> "I built what we call the academic engine — the module that runs day-to-day academics. The
> centerpiece is the timetable. I wrote the logic that generates schedules and, more
> importantly, detects clashes: it checks rooms, faculty, batches, and sections so nobody gets
> double-booked. That's the kind of problem where a small mistake cascades across the whole
> college, so I focused a lot on correctness and edge cases. I also implemented course
> registration and enrollment — students register for offerings and the system validates
> capacity and prerequisites. And I built the attendance module: configurable rules like
> minimum attendance percentage, daily marking, and staff leave. Most of my work is
> database-heavy — queries that join course offerings, faculty assignments, timetable
> entries, and enrollments. If a student's timetable or attendance record is right, the
> logic behind it is mine."

*(≈1 minute at a normal speaking pace)*

---

## What I used

- **Prisma** — `$transaction`, `createMany` + `skipDuplicates`, composite unique keys
- **Server actions** with Zod validation, `revalidatePath` for cache invalidation
- **Shared timetable config** (`src/lib/timetable.ts`) — periods, breaks, time formatting
- **Season logic** (`src/lib/season.ts`) — resolving which semesters are currently active

## Problems I faced & how I solved them

1. **Timetable clashes** — a room or faculty member booked twice. I built clash detection and put the whole grid (periods, breaks, lunch) in one shared config so the editor, student view, and faculty view can never drift apart.
2. **Marking attendance for a class, then editing it later** — every entry is find-then-update-or-create inside one transaction, keyed on offering + student + date + period.
3. **Bulk course registration hitting duplicate rows** — `createMany` with `skipDuplicates` so re-running a registration never crashes.
4. **Which semester is "current"** — odd/even season rules are centralized, so offerings, attendance, and dashboards all resolve the active semester the same way.
5. **A faculty member marking another department's class** — department authorization check runs before any write.

## Shared line (all four members can add)

> I also integrated my modules into the shared dashboard and nav, followed the team's
> conventions (server actions, Zod, Prisma), and helped with testing and demo prep.
