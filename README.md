# Enterprise Goal Setting & Performance Tracking Portal

An enterprise-grade, high-performance **Goal Setting, Check-In, and Visual Analytics Portal** designed to streamline OKR tracking, manager workflows, and organization-wide governance. Built with modern web standards, beautiful aesthetics, and absolute type-safety.

---

## Premium Aesthetics & UI System
The portal uses an elite corporate **glassmorphic design system** styled with custom CSS variables:
* **Color Palette**: Sophisticated Dijon, Mimosa, and Flax Yellow accents matched with highly polished, readable dark modes.
* **Typography**: Custom fonts configured for optimal readability (Manrope for headers, Inter and Poppins for UI widgets).
* **Interactions**: Smooth micro-animations powered by **Framer Motion**, skeleton loading states, elegant hover-states, responsive sidebars, and custom floating notifications.

---

## Core Features

### 1. Goal Creation & Multi-Tier Validation
* Strictly enforced enterprise rules: Goal weightages between **10% and 100%**, maximum of **8 active goals** per employee, and total allocated weightage capped at **100%**.
* Robust, custom-built, resilient server-side date parsers handling standard ISO `YYYY-MM-DD` and `DD-MM-YYYY` client formats dynamically to prevent database runtime crashes.

### 2. Automated Kanban Workflow Lifecycle
* Fluid drag-and-drop workflow tracking a goal's journey: `Draft` ➔ `Submitted` ➔ `Approved` / `Returned for Rework` ➔ `Locked`.
* Automatically locks goals upon manager approval to prevent un-audited modifications.

### 3. Quarterly Check-In & Progress Timelines
* Automated schedule: Goal Setting (May), Q1 Check-in (July), Q2 Check-in (October), Q3 Check-in (January), Q4/Annual Review (March-April).
* Interactive Vertical Timeline showing historical updates categorized by **wins**, **blockers**, and **next steps**.
* Restricts employee changes on locked/completed goals while retaining manager override controls.

### 4. Completion Dashboard & Rich Analytics
* Interactive analytics graphs (powered by **Recharts**) showing organization-wide, department-wise, and team-wise progress.
* Dynamic KPIs tracking **completion percentage**, **pending reviews**, and **overdue check-ins**.

### 5. Audit Trails & Governance
* Comprehensive, chronological audit log capturing every post-lock adjustment: *who modified what, previous values, new values, role, timestamps, and action types*.
* Role-based edge middleware dynamically verifying session context and restricting `/admin` and `/manager` panels immediately at the router level.

### Paginated Achievement CSV Reporting
* Efficient achievement reports featuring paginated tables, keyword search filters, date range pickers, and direct CSV file downloads.

---

## Technical Stack
* **Framework**: Next.js 16.2.6 (App Router) + TypeScript
* **Styling**: Tailwind CSS + Custom HSL variables + Framer Motion
* **Database**: Supabase PostgreSQL / Local SQLite (dev) + Prisma ORM
* **Authentication**: NextAuth.js (Session JWT, HTTPS-only secure cookies, CSRF protection)
* **Testing**: Jest + React Testing Library + Playwright (E2E)
* **Email Service**: Resend API Integration

---

## Getting Started

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/shravani-j/enterprise-goals.git
cd enterprise-goals
npm install
```

### 2. Database Synchronization & Client Generation
Setup the Prisma models and generate the fully typed Prisma Client:
```bash
npx prisma db push
npx prisma generate
```

### 3. Populating Demo Datasets
Run the automated tsx seed script to instantly load realistic, high-fidelity corporate database records:
```bash
npx tsx prisma/seed.ts
```

### 4. Run Locally
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing Suites
We maintain strict quality control through comprehensive testing pipelines:

* **Run Unit Tests** (Validation rules, weight calculations, permissions):
  ```bash
  npm run test:unit
  ```
* **Run End-to-End (E2E) Browser Tests** (Dashboard access, goal workflows, checkins):
  ```bash
  npx playwright install --with-deps
  npx playwright test
  ```

---

## Environment Setup Guide (`.env`)
Create a `.env` file in the root directory by following [.env.example](file:///.env.example):
```bash
# App Environment
APP_ENV=production

# Database (Supabase Pooler URL / transactional pooling for serverless)
DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"

# NextAuth Secret & URL
NEXTAUTH_SECRET="your_32_character_security_string"
NEXTAUTH_URL="https://your-custom-app.vercel.app"

# Resend API Key
RESEND_API_KEY="re_123456789"
```

---

## Production Deployment
* **Vercel Deployments**: The repository contains an optimized [vercel.json](file:///vercel.json) configuration specifying production headers (Strict-Transport-Security, CSP, DNS Prefetch, Permissions-Policy) and cron schedulers.
* **Prisma migrations**: For production PostgreSQL, execute pending transactional migrations safely via:
  ```bash
  npx prisma migrate deploy
  ```
