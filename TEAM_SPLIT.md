# Academic Atelier — 4-Member Team Split

All four members are technical. Two are the strong engineers (Architecture, Academic Engine).
The other two are slightly less experienced but own real modules end-to-end, and their story is
built around what they **learned** while shipping them. Everyone owns code, no one is "non-tech."

---

## Member A — Platform & Architecture Lead (strong)

**Role:** Tech Lead — auth, data model, security, deployment.

**Owns:**
- Authentication & authorization (better-auth, roles/permissions, user management)
- Core database schema: institution, departments, programs, batches, schemes, sections
- Audit logging, notification infrastructure, app shell / navigation / settings
- Deployment & build pipeline (Prisma migrations, Neon/Postgres, production build)

**What they did:**
- Designed the database schema (60+ models) that the whole project runs on
- Implemented role-based access control — who can see/edit what, per module
- Built the audit trail so every sensitive action is logged
- Set up the build & deployment pipeline (Prisma generate, env config, production builds)
- Enforced type-safety and consistent error handling across the codebase

**Script (what to say when asked):**
> "I led the platform layer. I designed the database schema — around 60 tables covering
> academics, exams, fees, and students — and implemented the authentication and role-based
> access control on top of it, so admins, faculty, and students see only what they're allowed
> to. I also built the audit-logging system, so every important action in the system is
> traceable, and I set up the deployment pipeline and handled things like Prisma migrations
> and environment configuration for the production database. Essentially, everything that
> isn't a specific module — the foundation — is mine."

---

## Member B — Academic Engine (strong)

**Role:** Backend-heavy engineer — the "brains" of academics.

**Owns:**
- Academics: courses, course offerings, faculty assignments, course registrations
- Timetable (generation + clash detection), sections, rooms
- Attendance: rules, records, staff attendance; leave management

**What they did:**
- Built timetable generation and clash detection (no room/faculty double-booking)
- Implemented course registration and enrollment workflows
- Designed attendance rules and the daily attendance marking flow
- Handled the hardest relational queries: offerings ↔ faculty ↔ timetable ↔ students

**Script (what to say when asked):**
> "I built the academic engine. My main piece is the timetable — I wrote the logic that
> generates schedules and detects clashes, so no room or faculty member is double-booked.
> I also implemented course registration and enrollment, and the attendance system with
> configurable rules — like minimum attendance percentage. Most of my work is heavy
> database logic: querying across course offerings, faculty assignments, and timetable
> entries. If a student's timetable or attendance record is correct, I'm the one who made
> sure the data model and queries behind it work."

---

## Member C — Exams & Results (learner — slightly less tech, strong learning story)

**Role:** Full-stack on the exam lifecycle.

**Owns:**
- Question bank, question papers, and the approval workflow (draft → approved → published)
- Exam scheduling: eligibility, registrations, hall allocation, invigilators
- CIE marks, results, grades, backlogs, CO-PO attainment

**What they did:**
- Built the question-bank and question-paper screens end-to-end
- Implemented the multi-step approval workflow (created → submitted → approved → published)
- Wired exam eligibility and hall allocation to existing student/faculty data
- Learned Prisma migrations, Zod validation, and Next.js server actions while doing it

**Script (what to say when asked):**
> "I owned the exams and results module end-to-end. Before this project I had never worked
> with a real database or an authentication system — I learned both here. I built the
> question bank and question-paper screens, and the approval workflow where a paper goes
> from draft to approved to published, which taught me how to design state transitions in a
> database. I also wired up exam eligibility and hall allocation using data from other
> modules. The biggest thing I learned was thinking in terms of related tables — writing
> Prisma queries that join students, courses, and exams — and using Zod to validate every
> form. It was the first time I built something where multiple users with different roles
> interact with the same data, and I'm proud of how it turned out."

---

## Member D — Finance & Engagement (learner — slightly less tech, strong learning story)

**Role:** Full-stack on fees, reporting, and student life.

**Owns:**
- Fees: fee structures, payments, receipts
- Dashboards & reports (charts, data export)
- Engagement: announcements, placement drives, scholarships, clubs, events, sports

**What they did:**
- Built the fee-structure and payment/receipt flows with full validation
- Created the dashboards and report pages with charts
- Learned data visualization, Excel/CSV export, and form validation with Zod
- Implemented announcement, placement, scholarship, and club/event screens

**Script (what to say when asked):**
> "I worked on the finance and student-engagement side. I built the fee-structure and payment
> screens, including receipts, and learned a lot doing it — especially how to validate forms
> properly with Zod and how server actions talk to the database. I also built the dashboards
> and reports, which was my first time working with charts, and I added the data-export
> feature. On the engagement side I handled announcements, placement drives, scholarships,
> and clubs. My biggest growth was going from just 'making screens' to understanding the
> full flow — form → validation → database write → read back on a dashboard. I also got much
> better at reading other people's code and reusing the patterns the team set up, like the
> permission checks and the UI components."

---

## Shared / Everyone-claims-this

- Integration: wiring their module's data into the shared dashboard and nav
- Following the team's conventions (server actions, Zod schemas, Prisma queries)
- Testing, bug fixes, and demo prep for reviews

---

## Suggested mapping of modules to repos/areas (if you ever split code)

| Area | Files (for reference) |
|---|---|
| A — Platform | `src/lib/auth*`, `src/lib/access.ts`, `permissions.ts`, `audit.ts`, `src/app/settings`, `src/components/auth`, `src/app/profile` |
| B — Academics | `src/components/academics`, `attendance`, `timetable`, `leave`, `src/lib/timetable.ts` |
| C — Exams & Results | `src/components/examinations`, `question-bank`, `question-papers`, `results`, `assessments` |
| D — Finance & Engagement | `src/components/fees`, `reports`, `dashboards`, `announcements`, `placement`, `scholarship`, `events`, `clubs` (files live under `src/app/*` page folders too) |
