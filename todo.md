# Enterprise Goal Setting & Performance Tracking Portal - Implementation Roadmap

## Phase 1: Project Setup & Architecture
- [x] Initialize Next.js project with Tailwind CSS and TypeScript
- [x] Configure ESLint, Prettier, and basic project folder structure (`/app`, `/components`, `/lib`, `/prisma`, etc.)
- [x] Setup Prisma ORM and connect to PostgreSQL (Supabase) database
- [x] Install required core dependencies (`framer-motion`, `recharts`, `@dnd-kit/core`, `next-auth`)
- [x] Configure global theme and CSS tokens (Inter, Poppins, Manrope fonts; Dijon/Mimosa/Flax Yellow color palette)

## Phase 2: Database Tasks & Data Modeling
- [x] Design Prisma schema for `User`, `Role`, `Goal`, `CheckIn`, `Comment`, `Notification`, and `AuditLog`
- [x] Apply constraints: goal weightages, max goals per user, etc.
- [x] Create database seeding script for roles (Admin, Manager, Employee) and dummy users
- [x] Generate and apply initial database migrations

## Phase 3: Authentication Tasks
- [x] Configure NextAuth.js with Credentials/OAuth providers
- [x] Implement user registration, login, and forgot password endpoints
- [x] Build company identity verification logic
- [x] Create role-based middleware for protecting routes (Employee, Manager, Admin)
- [x] Build seamless auth UI with Framer Motion animations (Landing page to Auth transition)

## Phase 4: Frontend Tasks & UI Components
- [x] Develop global layout layout components: Sidebar, Top Navigation Bar, and Main Workspace
- [x] Create reusable UI components: Buttons, Inputs, Modals, Profile Cards, Progress Bars
- [x] Implement Framer Motion micro-animations and smooth page transitions
- [x] Configure Toast notifications or alert systems for application feedback

## Phase 5: Dashboard Implementation Tasks
- [x] **Employee Dashboard:**
  - [x] Profile card and summary metrics
  - [x] Goal cards list with progress indicators
  - [x] Notifications panel and recent activity feed
- [x] **Manager Dashboard:**
  - [x] Team summary cards and aggregated progress
  - [x] Shared goals module and alignment views
  - [x] Quarterly review visibility panel
- [x] **Admin Portal:**
  - [x] Organization-wide metrics and analytics charts (using Recharts/Chart.js)
  - [x] Escalation tracker and workflow statistics
  - [x] Audit logs and system governance views

## Phase 6: Goal Management & Workflow Tasks
- [x] Implement Goal CRUD (Create, Read, Update, Delete) with validation rules (Weightage = 10-100%, Total = 100%, Max = 8)
- [x] Integrate threaded comments module within individual goals
- [x] Build Kanban Workflow Board using `dnd-kit` for Goal Lifecycle (Draft -> Submitted -> Returned for Rework -> Approved -> Locked)
- [x] Implement Quarterly Check-in mechanisms and progress updates
- [x] Develop escalation workflow and multi-tier approval logic

## Phase 7A: Quarterly Check-In Foundation
- [x] Implement multi-field check-in schema in database (achievements, blockers, next steps, notes)
- [x] Update RESTful API controllers to support secure check-in submissions and audit log capture
- [x] Build rich Quarterly Check-in Form allowing progress updating and inputs for blockers and next steps
- [x] Prevent progress updates and check-ins on completed goals
- [x] Design beautiful, responsive vertical Timeline UI showing logs categorized by wins, blocker badges, and notes
- [x] Secure full manager visibility for reviewing individual employee logs and milestone details

## Phase 7: Backend Tasks & Services
- [x] Develop RESTful/Next.js API routes for all Goal and User interactions
- [x] Build notification service using Resend API / Nodemailer
- [x] Implement automated triggers for state changes, reminders, and escalation events
- [x] Develop robust error handling and API validation middleware

## Phase 8: Testing Tasks
- [x] Write unit tests for core validation logic (Goal weightage calculations)
- [x] Implement integration tests for Authentication flows and Role-based access
- [x] Test the Kanban drag-and-drop state updates
- [x] Test notification triggers, quarterly check-ins, and escalations
- [x] Conduct end-to-end (E2E) UI testing for dashboard access and workflows

## Phase 9: Deployment Tasks
- [x] Setup production environment variables in Vercel
- [x] Configure CI/CD pipeline on Vercel linked to the repository
- [x] Deploy Prisma database to production Supabase instance
- [x] Perform pre-launch database migrations and seed administrative users
- [x] Final UI/UX review for responsiveness and performance optimization

## Phase 10: Reporting & Governance Module
- [x] Design database models for `AuditLog`, `ReportExport`, and `ActivityHistory`
- [x] Implement paginated Achievement Reporting API with filter support and direct CSV downloads
- [x] Develop a real-time Completion Dashboard featuring KPI widgets and Recharts visualizations
- [x] Build a secure Audit Trail logs system tracking chronological goal modifications and status approvals
- [x] Create role-restricted UI with tab transitions, loading skeletons, and interactive search filters

