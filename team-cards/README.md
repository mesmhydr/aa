# Team Speaking Cards — Academic Atelier

Four one-page cards, one per member. Each card fits on a single printed page and can be
pasted straight into a group chat.

| Card | Member | Role |
|---|---|---|
| [01 — Platform & Architecture Lead](01-platform-lead.md) | Member A (strong) | Tech Lead: database, auth/RBAC, audit, deployment |
| [02 — Academic Engine](02-academic-engine.md) | Member B (strong) | Timetable, registration, attendance, leave |
| [03 — Exams & Results](03-exams-results.md) | Member C (learner) | Question bank, papers, exam eligibility, results |
| [04 — Finance & Engagement](04-finance-engagement.md) | Member D (learner) | Fees, dashboards, announcements, placement, clubs |

Each card also includes **What I used** (tech, libraries, patterns) and **Problems I faced & how I solved them** —
all grounded in the actual repo code (server actions with Zod, Prisma transactions, the shared timetable config,
the recharts `ssr:false` fix, the auth origin fix, etc.), so the claims hold up if a reviewer opens the code.

**How to use:**
- Each member rehearses their 60-second script out loud 2–3 times — it's timed for roughly a minute.
- The "Top 3 claims" are the safe answers to "what did you do?" — keep them short and let the script carry the detail.
- Everyone may also add the shared line at the bottom of their card; it's true for all four members.

**Cover story (team-level, if asked "how did you work together?"):**
> We split the project by modules, with one owner per area, and agreed on shared conventions —
> server actions, Zod validation, Prisma for all data access, and a common UI kit. Members A
> and B built the core platform and the heaviest logic; C and D owned full modules end-to-end
> and grew into the stack while shipping them. We integrated through the shared dashboard and
> nav, and tested together before demos.
