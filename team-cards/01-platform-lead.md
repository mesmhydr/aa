# Member A — Platform & Architecture Lead

**Role:** Tech Lead — Platform, Data Model, Security, Deployment *(strong engineer)*

**Owns:** Database schema · Authentication & RBAC · Audit logs · Notifications · App shell & settings · Deployment

---

## Top 3 claims (short answers to "what did you do?")

1. **Designed the database** — 60+ models covering academics, exams, fees, and students; every other module reads and writes against it.
2. **Implemented authentication + role-based access control** — admins, faculty, and students each see only what they're allowed to.
3. **Built the audit-log system and the deployment pipeline** — Prisma migrations, Neon/Postgres production database, and production builds.

---

## 60-second script

> "I led the platform layer — the foundation the whole project sits on. My biggest piece is
> the database. I designed the schema, around sixty tables covering academics, examinations,
> fees, and students. Every other module in the project reads and writes against that schema,
> so getting it right was critical. I also implemented authentication and role-based access
> control, so an admin, a faculty member, and a student all see different things — that meant
> thinking carefully about permissions on every screen. On top of that, I built the
> audit-logging system, so every sensitive action in the system is recorded and traceable,
> and I set up the deployment side: Prisma migrations, the production database on Neon, and
> the build pipeline. If the question is 'what holds the whole project together?' — that's my
> work: the data model, the security, and getting it deployed."

*(≈1 minute at a normal speaking pace)*

---

## What I used

- **better-auth** (email/password sign-in, sessions, cookie cache) + `@better-auth/prisma-adapter`
- **Prisma 7** with the Neon driver adapter and generated client (`prisma generate` in build)
- **RBAC tables** (Role, Permission, RolePermission, UserRole, UserPermission) enforced in code
- **Server actions** + `next/headers`, React `cache()`, and a central `logAudit()` helper

## Problems I faced & how I solved them

1. **Auth 500ed in production** — `BETTER_AUTH_URL` had no scheme, so `new URL()` threw on every request. I normalized the value, and later fixed sign-in being rejected with `INVALID_ORIGIN` on the real domain by making trusted origins resolve from the actual request.
2. **Enforcing permissions everywhere** — wrote central `requireAccess()` / `requirePermission()` helpers that throw a 403, reused by every module instead of repeating checks.
3. **Prisma 7 needs a driver adapter** — schema has no datasource URL; the client is generated into the project and wired to Neon via `PrismaNeon`.
4. **Keeping the audit trail consistent** — one `logAudit()` helper capturing action, entity, user, IP, and user agent, called from every module's actions.

## Shared line (all four members can add)

> I also integrated my modules into the shared dashboard and nav, followed the team's
> conventions (server actions, Zod, Prisma), and helped with testing and demo prep.
