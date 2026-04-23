# LexForge — Implementation Plan (V2: Paid-Tier Features)

> **Goal**: Transform LexForge from a polished demo into a subscription-worthy compliance intelligence platform. Every phase is independently shippable. Work through them in order.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Already in use |
| Database | Prisma + SQLite (dev) → PostgreSQL (prod) | Zero-config local, migrate via one env var |
| Auth | Auth.js v5 (next-auth@beta) | Built for Next.js 15, App Router native |
| Password hashing | bcryptjs | Simple, no native dep |
| Email | Nodemailer | SMTP-agnostic, works with any provider |
| PDF export | Browser print API + print CSS | Zero dependencies |
| ORM | Prisma | Type-safe, matches prodspec schema exactly |

---

## Phase 1 — Database + Auth ✅ FOUNDATION
**Goal**: Persistent data layer and user identity. Nothing else can work without this.

### 1.1 Prisma Setup
- [x] Install `prisma`, `@prisma/client`, `bcryptjs`, `@types/bcryptjs`, `next-auth@beta`
- [x] `prisma/schema.prisma` — full schema matching prodspec section 3
- [x] `lib/prisma.ts` — singleton client
- [x] `prisma/seed.ts` — seed all 10 laws + obligations from lexforge-data.ts
- [x] `npx prisma migrate dev` → creates `prisma/dev.db`

### 1.2 Auth.js v5
- [x] `auth.ts` — Auth.js config (Credentials provider: email/password)
- [x] `middleware.ts` — protect `/dashboard`, `/assess/results/*`, `/api/assessments`, `/api/checklists`
- [x] `app/api/auth/[...nextauth]/route.ts` — Auth.js handler
- [x] `app/(auth)/login/page.tsx` — Login form
- [x] `app/(auth)/register/page.tsx` — Register form (creates user + hashes password)
- [x] `app/api/auth/register/route.ts` — POST handler for registration

### 1.3 API Route Migration
- [x] `app/api/assessments/route.ts` — save to Prisma (assessments + assessment_results tables)
- [x] `app/api/checklists/route.ts` — save to Prisma (checklists + checklist_items)
- [x] `app/api/checklists/[id]/items/[itemId]/route.ts` — PATCH to Prisma
- [x] Remove `lib/assessment-store.ts` and `lib/checklist-store.ts` (replaced by Prisma)

### Deliverable
Users can register, log in, run assessments, and their data persists across sessions.

---

## Phase 2 — Persistence + Watchlist
**Goal**: Give users a reason to return. Their work is saved. They can track laws they care about.

### 2.1 Saved Laws (Watchlist)
- [ ] `app/api/saved-laws/route.ts` — GET (list saved) + POST (save/unsave toggle)
- [ ] Save button on `/laws/[slug]` — filled/outline heart icon, calls API
- [ ] Save button on law cards in `/explore`

### 2.2 Dashboard (Real Data)
- [ ] `app/dashboard/page.tsx` — replace placeholder with:
  - Recent assessments (last 5, link to results)
  - Saved laws watchlist (quick access)
  - Laws with recent changelog entries ("Updated")
  - Overall stats (total assessments, laws tracked)

### 2.3 Assessment History
- [ ] `app/api/assessments/route.ts` GET — list user's assessments
- [ ] `app/assessments/page.tsx` — all assessments table with date, law count, status

### Deliverable
Dashboard is genuinely useful. Users have a personal workspace they return to.

---

## Phase 3 — Law Coverage (30+ Laws)
**Goal**: Cover enough jurisdictions that most companies using AI globally find their laws here.

### Laws to add (20 new)
| Jurisdiction | Law | Slug |
|---|---|---|
| India | Digital Personal Data Protection Act (DPDP) | india-dpdp |
| Japan | AI Guidelines for Business | japan-ai-guidelines |
| Australia | AI Ethics Framework | australia-ai-ethics |
| ISO | ISO/IEC 42001 AI Management System | iso-42001 |
| US State | California CCPA (AI profiling) | us-ccpa-ai |
| US Local | NYC Local Law 144 (Automated Employment) | nyc-local-law-144 |
| South Korea | AI Basic Act | south-korea-ai-act |
| UAE | AI Regulatory Policy | uae-ai-policy |
| Canada (QC) | Quebec Law 25 (AI data) | canada-quebec-law25 |
| Switzerland | Federal Act on Data Protection (AI) | switzerland-fadp |
| Taiwan | AI Basic Act | taiwan-ai-basic-act |
| France | AI National Strategy | france-ai-strategy |
| Saudi Arabia | Personal Data Protection Law (AI) | saudi-pdpl-ai |
| Argentina | AI Bill | argentina-ai-bill |
| Israel | Proposed AI Law | israel-ai-bill |
| Thailand | Personal Data Protection Act (AI) | thailand-pdpa-ai |
| Vietnam | Cybersecurity AI Decree | vietnam-ai-decree |
| Mexico | Federal AI Bill | mexico-ai-bill |
| Kenya | Data Protection Act (AI) | kenya-dpa-ai |
| Netherlands | AI Accountability Policy | netherlands-ai-policy |

### Implementation
- [ ] Add all 20 laws to `lib/lexforge-data.ts` with full obligations (4–5 each)
- [ ] Run `npx prisma db seed` to populate DB
- [ ] Update `JURISDICTIONS` constant to include all new regions

### Deliverable
30 laws covering every major AI regulatory market globally.

---

## Phase 4 — Richer Assessment Output
**Goal**: Change the assessment from a binary verdict to an actionable compliance gap analysis.

### 4.1 Compliance Gap Score
- [ ] After checklist generates, compute: `score = completed_items / total_items * 100`
- [ ] Display score on checklist header: "You're 0% compliant with EU AI Act"
- [ ] Color-coded: 0–33% red, 34–66% amber, 67–100% green
- [ ] Score updates in real-time as user checks off items

### 4.2 Obligation-Level Breakdown
- [ ] On `/assess/results/[id]` — for each law: show obligations list with individual status badges
- [ ] "Partially addressed" status for items in progress
- [ ] Group by category (Governance, Transparency, Data, Technical, etc.)

### 4.3 Priority Next Actions
- [ ] Extract `critical` + `high` priority uncompleted items across all applicable laws
- [ ] Show "Top 5 actions to take now" section at the top of results page
- [ ] Include deadline context if law has `effective_date`

### 4.4 Assessment Naming
- [ ] Prompt user to name assessment at step 1 (e.g. "My HR Screening App — April 2026")
- [ ] Show name in dashboard and assessment history

### Deliverable
Assessment results are a compliance roadmap, not just a verdict.

---

## Phase 5 — PDF / Export
**Goal**: Enable users to share compliance work with legal teams, boards, and auditors.

### 5.1 Checklist PDF Export
- [ ] "Export PDF" button on checklist page
- [ ] Print-optimized CSS (`@media print`) — hides nav, shows full checklist
- [ ] Header: company name, law name, date, assessment ID
- [ ] Each item: title, description, category, status, citation
- [ ] `window.print()` triggered on button click

### 5.2 Assessment Summary Report (PDF)
- [ ] "Download Report" button on `/assess/results/[id]`
- [ ] Print view shows: input summary, applicable laws table, gap scores per law, top actions
- [ ] LexForge branding in footer

### 5.3 CSV Export
- [ ] "Export CSV" button on checklist
- [ ] Generates `compliance-checklist-[date].csv` download
- [ ] Columns: Law, Category, Obligation, Priority, Status, Citation, Action Required

### Deliverable
Compliance teams can hand artifacts to lawyers and boards without screenshots.

---

## Phase 6 — Regulatory Alerts
**Goal**: Make LexForge a monitoring tool, not just a point-in-time reference. This is the main justification for a recurring subscription.

### 6.1 Law Changelog
- [ ] `LawChangelog` table seeded with realistic example changes (EU AI Act amendment, NIST update, etc.)
- [ ] `/api/laws/[slug]/changelog` — GET changelog for a law
- [ ] "What's changed" section on law detail page (most recent 5 entries)
- [ ] Badge on law card if changed in last 30 days: "Updated"

### 6.2 Alert Preferences
- [ ] `app/account/alerts/page.tsx` — manage alert preferences
- [ ] Toggle per jurisdiction or per specific law
- [ ] Email preference (immediate vs. weekly digest)

### 6.3 Email Notifications (Nodemailer)
- [ ] `lib/email.ts` — Nodemailer transporter + template renderer
- [ ] `app/api/alerts/send/route.ts` — POST endpoint (admin-only) to send alerts
- [ ] Email template: "A law you're tracking has been updated"
- [ ] Weekly digest email template

### 6.4 "Updated" Badges
- [ ] Law cards in `/explore` show "Updated" chip if changelog entry < 30 days old
- [ ] Saved laws on dashboard highlight recent changes

### Deliverable
Users receive email when laws they care about change. Recurring value that justifies subscription.

---

## Phase 7 — Team Features
**Goal**: Move from individual use to team use. B2B teams share compliance work, not individuals.

### 7.1 Organizations
- [ ] `Organization` + `OrganizationMember` Prisma models
- [ ] Create org on register or via `/account/org`
- [ ] All assessments and checklists belong to org (visible to all members)

### 7.2 Member Invites
- [ ] `app/api/org/invite/route.ts` — POST: send invite email with token
- [ ] `app/invite/[token]/page.tsx` — accept invite, create account, join org
- [ ] `app/account/org/page.tsx` — manage members, pending invites

### 7.3 Checklist Assignment
- [ ] `assigneeId` on `ChecklistItem` (already in schema)
- [ ] Dropdown on each checklist item: assign to org member
- [ ] "Assigned to me" filter on checklist view
- [ ] Email notification when item assigned

### 7.4 Team Dashboard
- [ ] Org-level view: all team assessments, completion rates per law
- [ ] Team compliance score across all active laws

### Deliverable
Compliance teams work together. The app becomes a shared workspace, not a solo tool.

---

## Pricing Alignment

| Tier | Features |
|---|---|
| **Free** | Explore laws, run 1 assessment (not saved), view checklist (not saved) |
| **Pro ($29/mo)** | Everything saved, unlimited assessments, PDF export, law alerts, 1 user |
| **Team ($99/mo)** | Pro + org + up to 10 members + assignment + team dashboard |
| **Enterprise** | Custom law coverage, SSO, audit logs, API access |

---

## Current Status

- [x] Phase 1 — Database + Auth
- [ ] Phase 2 — Persistence + Watchlist
- [ ] Phase 3 — Law Coverage (30+)
- [ ] Phase 4 — Richer Assessment Output
- [ ] Phase 5 — PDF / Export
- [ ] Phase 6 — Regulatory Alerts
- [ ] Phase 7 — Team Features
