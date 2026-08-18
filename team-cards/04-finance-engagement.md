# Member D — Finance & Engagement

**Role:** Full-stack on fees, reporting, and student life *(learner — slightly less tech, strong learning story)*

**Owns:** Fee structures · Payments & receipts · Dashboards & reports · Announcements · Placement · Scholarships · Clubs & events

---

## Top 3 claims (short answers to "what did you do?")

1. **Built the fee module** — fee structures, payment recording, and receipts, with Zod validation on every form.
2. **Created the dashboards and reports** — charts, plus data export — my first real experience with data visualization.
3. **Shipped the engagement screens** — announcements, placement drives, scholarships, clubs/events — and learned the full form → validation → database → dashboard cycle.

---

## 60-second script

> "I worked on the finance and student-engagement side, and I grew the most technically in
> this project. I built the fee module — fee structures, payment recording, and receipts.
> That was my first time handling money-related data, so I learned to be really careful with
> validation: every form is checked with Zod before anything touches the database. I also
> built the dashboards and reports — my first experience with charts — and I added the
> data-export feature. Beyond that, I handled the engagement side: announcements, placement
> drives, scholarships, and clubs. The biggest thing I learned was the complete cycle — form,
> validation, database write, then reading it back on a dashboard — because before this I only
> knew how to build screens with fake data. I also got much better at reading the patterns the
> team set up, like permission checks and shared UI components, and reusing them instead of
> reinventing. So I can honestly say I shipped two full modules and learned the fundamentals
> of real full-stack development along the way."

*(≈1 minute at a normal speaking pace)*

---

## If asked "what was the hardest part?"

> "Handling money data — there's no room for error. Learning to validate everything and
> understanding how payments, allocations, and receipts link together in the database was
> where I grew the most."

---

## What I used

- **Server actions** with Zod validation on every form
- **Prisma** with exact `Decimal(10,2)` money columns
- **recharts** for charts, loaded with `next/dynamic` + `ssr: false`
- **Shared UI kit** (Button, Card, Badge, StatCard, Table) + lucide icons; parallel queries for dashboards

## Problems I faced & how I solved them

1. **Money must never lose precision** — amounts are stored as exact decimals, never float math for balances; forms convert once and the database keeps the exact value.
2. **Charts crashed on the server** — recharts is client-only, so I load it with `next/dynamic` and `ssr: false`.
3. **Fee status going wrong** — PENDING / PARTIAL / PAID / OVERDUE must stay consistent across adjustments and partial payments, so the status is derived from the recorded amounts, not guessed.
4. **Dashboards doing too many queries** — I run the counts in parallel with `Promise.all` and reuse formatting helpers instead of repeating logic.
5. **My biggest lesson** — validating everything with Zod before it touches the database, and reusing the team's patterns (permissions, UI kit, audit) instead of reinventing them.

## Shared line (all four members can add)

> I also integrated my modules into the shared dashboard and nav, followed the team's
> conventions (server actions, Zod, Prisma), and helped with testing and demo prep.
