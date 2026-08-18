# Member C — Exams & Results

**Role:** Full-stack on the exam lifecycle *(learner — slightly less tech, strong learning story)*

**Owns:** Question bank · Question papers + approval workflow · Exam eligibility & hall allocation · CIE marks · Results & backlogs

---

## Top 3 claims (short answers to "what did you do?")

1. **Built the question bank and question-paper screens end-to-end**, including the approval workflow (draft → submitted → approved → published).
2. **Wired exam eligibility and hall allocation** to existing student, course, and faculty data.
3. **Learned the full stack while shipping it** — Prisma migrations, Zod validation, Next.js server actions, and modeling state transitions in a database.

---

## 60-second script

> "I owned the exams and results module end to end — and honestly, this project is where I
> learned most of what I know about real development. Before this, I'd never worked with a
> real database or a proper backend. I built the question bank and question-paper screens:
> creating questions, organizing them into papers, and then the approval workflow where a
> paper goes from draft, to submitted, to approved, to published. That workflow taught me how
> to model state transitions in a database — that was a big 'aha' moment for me. I also wired
> up exam eligibility and hall allocation, pulling from data other teammates built, which
> taught me how modules talk to each other. Along the way I learned Prisma queries across
> related tables, Zod validation on every form, and Next.js server actions. What I'm proudest
> of: faculty, the exam cell, and admins all use these screens with different permissions,
> and I handled that correctly. I went from building static screens to understanding the
> whole flow — form, validation, database, and back."

*(≈1 minute at a normal speaking pace)*

---

## If asked "what was the hardest part?"

> "The approval workflow — understanding that a question paper is *not* just data, it has a
> life cycle. Figuring out how to store and check its state at every step took me the longest,
> and it's what taught me the most."

---

## What I used

- **Server actions** with Zod validation + `revalidatePath`
- **Prisma** — `$transaction`, `groupBy`/`_count` aggregation, `createMany` + `skipDuplicates`
- **Status enums** for the workflow (DRAFT → SUBMITTED → APPROVED → LOCKED)
- **Audit logging** (`logAudit`) on every state change

## Problems I faced & how I solved them

1. **Exam eligibility** — for every student, count attendance per course and compare to the threshold. I learned to aggregate with `groupBy`/`_count` inside a transaction instead of looping queries.
2. **Registering 100+ students without duplicates** — `createMany` + `skipDuplicates`, then log how many were actually added.
3. **A question paper changing state wrongly** — I guard every action by its current status, so a paper can't be approved from DRAFT or edited after LOCKED. That's where I learned to model a state machine in the database.
4. **Re-entering the same student's CIE marks** — unique keys on assessment + student, with its own DRAFT → ENTERED → APPROVED → LOCKED flow.
5. **Result consistency** — writing the result and its per-course items atomically so SGPA/CGPA can never disagree with the stored marks.

## Shared line (all four members can add)

> I also integrated my modules into the shared dashboard and nav, followed the team's
> conventions (server actions, Zod, Prisma), and helped with testing and demo prep.
