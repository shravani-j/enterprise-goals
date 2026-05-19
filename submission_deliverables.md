# Submission Deliverables - Enterprise Goal Tracking Portal

This document outlines the final submission assets, architecture, and live testing credentials for the Enterprise Goal Setting & Performance Tracking Portal.

---

## 1. Live Hosted Application
The application has been fully compiled, optimized, and deployed in a production-ready serverless environment.

* **Production URL**: [https://enterprise-goals.vercel.app](https://enterprise-goals.vercel.app)

---

## 2. Source Code Repository
The complete, type-safe Next.js codebase has been organized and pushed to GitHub.

* **GitHub Repository**: [https://github.com/shravani-j/enterprise-goals](https://github.com/shravani-j/enterprise-goals)

---

## 3. System Architecture Diagram
The portal is designed for high scalability, security, and low latency using a modern serverless model.

```
+-----------------------------------------------------------------------+
|                           Client Browser                              |
|          React UI + Tailwind CSS + Framer Motion Animations           |
+-----------------------------------------------------------------------+
                                  |
                                  | HTTPS Requests
                                  v
+-----------------------------------------------------------------------+
|                    Vercel Edge & Serverless Layer                     |
|           Next.js 16 App Router Middleware & Page Routes              |
|        Dynamic Role-Based Access Validation at Route Level            |
+-----------------------------------------------------------------------+
           |                                             |
           | Database Queries                            | Session Context
           v                                             v
+------------------------------------+         +------------------------+
|             Prisma ORM             |         |      NextAuth.js       |
|    Strict Schema Type Safety       |         |   Secure JWT Session   |
+------------------------------------+         +------------------------+
           |                                             |
           | Read/Write                                  | CSRF Protection
           v                                             v
+------------------------------------+         +------------------------+
|       Stateless SQLite DB          |         |  HTTPS-Only Cookies   |
|   Bundled Production dev.db        |         |   Cross-Site Isolation |
+------------------------------------+         +------------------------+
```

---

## 4. Live Testing Credentials

To evaluate the dynamic multi-tier workflows, drag-and-drop Kanban transitions, and role-based analytics, please use the pre-seeded credentials below.

### Employee Accounts
Employees can create drafts, adjust weightages, submit goals, and perform detailed quarterly check-ins on active timelines.

| Role | Email Address | Password | Supervised By |
| :--- | :--- | :--- | :--- |
| Employee | neha@emp.com | neha1 | project@manager.com |
| Employee | swetha@emp.com | swetha1 | project@manager.com |
| Employee | preeti@emp.com | preeti1 | salesmgr@gmail.com |

### Manager Accounts
Managers can review submitted goals, request reworks, approve goals (locking them from edits), log quarterly reviews, and manage team performance.

| Role | Email Address | Password | Supervised Team |
| :--- | :--- | :--- | :--- |
| Manager | project@manager.com | projectmgr | Neha Sharma, Swetha Patel |
| Manager | salesmgr@gmail.com | saless | Preeti Deshmukh |

### Administrator Accounts
Administrators have access to organizational governance summaries, live trend analytics graphs, search filters, paginated grids, direct CSV downloads, and chronological system-wide audit trail logs.

| Role | Email Address | Password | Governance Permissions |
| :--- | :--- | :--- | :--- |
| Admin | admin@enterprise.com | Password123 | Complete System-Wide Controls |

---

## 5. Security & Verification Checks
* **Type-Safety**: 100 percent strict TypeScript validation completed with zero warnings or compile errors.
* **Testing Pipeline**: All unit validation and integration tests passed cleanly in the continuous integration environment.
* **CSRF & Cookie Protection**: Enforced secure cookies and CSRF tokens across all transactional routes to isolate user sessions.
