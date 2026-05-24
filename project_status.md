# Enterprise Goals — Project Status

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| DB | SQLite (local `prisma/dev.db`) via `better-sqlite3` + Prisma 7 driver adapter |
| Auth | NextAuth v4 (Credentials) |
| UI | Tailwind CSS v4, Framer Motion, Recharts, dnd-kit, shadcn/ui |
| Testing | Jest (unit), Playwright (E2E) |
| Deployment | Vercel (config present) |

---

## What Is Built

### Auth
- `POST /api/auth/register` — registers users with name, email, password, companyCode, role, managerEmail
- NextAuth Credentials provider with JWT, role stored in token
- Middleware guards `/dashboard/*`, `/admin/*`, `/manager/*` by role

### Database (Prisma schema — `prisma/schema.prisma`)
Models: `User`, `Goal`, `CheckIn`, `Comment`, `Notification`, `AuditLog`

Enums: `RoleType` (EMPLOYEE, MANAGER, ADMIN), `UomType` (NUMERIC, PERCENTAGE, TIMELINE, ZERO_BASED), `GoalPriority` (LOW, MEDIUM, HIGH), `GoalStatus` (DRAFT, SUBMITTED, RETURNED_FOR_REWORK, APPROVED, COMPLETED)

### API Routes
- `GET/POST /api/goals` — list & create goals
- `GET/PUT/DELETE /api/goals/[id]` — single goal CRUD
- `POST /api/goals/[id]/checkins` — submit a check-in
- `GET/POST /api/goals/[id]/comments` — threaded comments
- `PUT /api/goals/[id]/status` — status transitions
- `GET/POST /api/goals/[id]/quarterly` — quarterly review
- `/api/escalations`, `/api/users`, `/api/governance` — additional routes present

### Frontend Pages
- `/` — Landing/auth page with Framer Motion animations
- `/dashboard` — role-aware redirect → Employee / Manager / Admin dashboard
- `/dashboard/goals` — Goal portal (GoalPortal.tsx, ~58 KB, full CRUD + Kanban)
- `/dashboard/escalations`, `/dashboard/governance` — present

### Components
- `EmployeeDashboard.tsx`, `ManagerDashboard.tsx`, `AdminDashboard.tsx`
- `GoalPortal.tsx` — Kanban board with dnd-kit, check-ins, comments
- Layout: Sidebar + Top Nav
- `Providers.tsx` — wraps SessionProvider

---

## ❌ Known Issues Blocking the Build

### 1. Build fails — `seed.ts` references non-existent models
**Error:**
```
Type error: Property 'quarterlyReview' does not exist on type 'PrismaClient'
  at prisma/seed.ts:93
```
`seed.ts` uses `prisma.quarterlyReview` and `prisma.auditLog` fields (`field`, `previousValue`, `newValue`, `role`, `actionType`, `goalId`) that **do not exist in the Prisma schema**.

The schema `AuditLog` only has: `id`, `action`, `details`, `userId`, `createdAt`.  
The schema has **no `QuarterlyReview` model at all**.

**Fix needed:** Either add `QuarterlyReview` model + missing `AuditLog` fields to `schema.prisma` and re-run `prisma migrate dev`, OR strip those calls from `seed.ts`.

### 2. Build warning — `middleware.ts` is deprecated
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
In Next.js 16, `src/middleware.ts` should be renamed to `src/proxy.ts` (or the export convention updated per the new Next.js 16 proxy API).

### 3. `seed.ts` uses wrong UomType values
`uomType: 'MIN'` and `uomType: 'ZERO'` are used in seed data, but the schema enum only allows: `NUMERIC`, `PERCENTAGE`, `TIMELINE`, `ZERO_BASED`. These will cause runtime errors on seeding.

### 4. `prisma.config.ts` datasource URL mismatch
`prisma.config.ts` sets `datasource.url: "file:./prisma/dev.db"` but the schema's `datasource db` block has **no `url` field** — it relies on the `DATABASE_URL` env var. The config file's `datasource` key may be ignored by Prisma 7 depending on version.

---

## Seed Credentials (for demo/testing)
| Role | Email | Password |
|---|---|---|
| Admin | admin@enterprise.com | Password123 |
| Manager | project@manager.com | projectmgr |
| Manager | salesmgr@gmail.com | saless |
| Employee | neha@emp.com | neha1 |
| Employee | swetha@emp.com | swetha1 |
| Employee | preeti@emp.com | preeti1 |

> [!NOTE]  
> The `.env` also has a commented-out Supabase PostgreSQL URL for production deployment on Vercel.

---

## Summary of What Needs Fixing (Priority Order)

1. **Add `QuarterlyReview` model to schema** + add missing `AuditLog` fields (`field`, `previousValue`, `newValue`, `role`, `actionType`, `goalId`), then run `prisma migrate dev`
2. **Fix `seed.ts`** — remove `prisma.quarterlyReview.deleteMany()` call (or use correct model), fix `uomType` values (`'MIN'` → `'NUMERIC'`, `'ZERO'` → `'ZERO_BASED'`)
3. **Rename `middleware.ts` → `proxy.ts`** and update to Next.js 16 proxy convention
4. Run `npx prisma db push` or `prisma migrate dev` after schema changes, then `npx prisma db seed`
