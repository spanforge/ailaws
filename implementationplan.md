# Spanforge Compass Master Implementation Plan

## Objective

Build Spanforge Compass into an intelligent, always-on AI compliance engine with audit-grade outputs.

The core product loop remains:

`Describe system -> Classify risk -> Map laws -> Generate tasks -> Collect evidence -> Export audit package`

This master plan also includes the missing maturity work from `roadmap.md`, so it covers both product capability and production readiness. It is intended to be the single implementation plan for getting all major features and release gates done.

## Product End State

A user should be able to:

1. Describe their AI system in plain English.
2. Receive a risk classification and law applicability explanation.
3. Get concrete obligations translated into owned tasks with deadlines.
4. Track compliance status, blockers, and drift over time.
5. Attach or auto-link evidence to each requirement.
6. Export an audit-ready regulator package.
7. Monitor legal changes, system changes, and evidence freshness continuously.

## Current Status

Already implemented:

- Freeform system description input
- Heuristic classification and normalization layer
- Risk score, compliance score, audit-readiness score
- Blocker detection in results
- Law mapping reasons in results
- Action-plan-driven checklist generation with due dates
- Persistent evidence artifact model and item-level evidence APIs
- Evidence workspace with attachment, verification, and stale-evidence handling
- Evidence drift surfaced in dashboard and results
- Expanded evidence export metadata
- Law-page trust and provenance signals
- Editorial review queue for laws and obligations with actionable review flow and visible change history
- Unit tests for the new compliance-analysis layer

Already present in the codebase before this pass:

- Assessment wizard
- Rules engine and evaluation traces
- Dashboard foundations
- Checklists and checklist item mutation
- Alerts and organizations foundations
- Print/export surfaces
- Prisma persistence and auth

Still pending:

- the rest of the product roadmap
- deeper evidence traceability
- data ingestion automation
- trust, security, ops, CI/CD, and launch hardening from `roadmap.md`

## Master Delivery Sequence

Do not skip the order. Product capability without trust and operations does not get this to the target state.

### Phase 1. Core Product Backbone

Goal: make the assessment and compliance loop the center of the product.

Status: partially implemented.

Scope:

- Add and refine `system_description` and `data_types` capture.
- Keep improving the classification engine for use cases, data classes, and risk posture.
- Make law mapping explanations explicit and audit-defensible.
- Generate concrete task plans from obligations.
- Make evidence export reflect actual system posture and blockers.

Files:

- [app/assess/page.tsx](/D:/Sriram/ailaws/app/assess/page.tsx)
- [app/api/assessments/route.ts](/D:/Sriram/ailaws/app/api/assessments/route.ts)
- [app/assess/results/[id]/page.tsx](/D:/Sriram/ailaws/app/assess/results/[id]/page.tsx)
- [lib/rules-engine.ts](/D:/Sriram/ailaws/lib/rules-engine.ts)
- [lib/compliance-analysis.ts](/D:/Sriram/ailaws/lib/compliance-analysis.ts)
- [lib/evidence-package.ts](/D:/Sriram/ailaws/lib/evidence-package.ts)

Remaining work:

- improve classification coverage for more product types and industries
- capture assessment assumptions explicitly in results and exports
- add richer obligation-to-owner mapping
- add stronger audit wording in exports and print surfaces

### Phase 2. Deep Traceability and Evidence Engine

Goal: connect laws, obligations, tasks, logs, and evidence into one traceable chain.

Status: partially implemented.

Scope:

- Add persistent evidence entities linked to checklist items and assessments.
- Support manual evidence attachment and metadata.
- Support automatic evidence linking from Spanforge Core logs when available.
- Add explicit traceability views:
  - law -> obligation
  - obligation -> task
  - task -> evidence
- Add evidence freshness and completeness scoring.
- Add regulator-ready export sections showing traceability directly.

Likely repo areas:

- [prisma/schema.prisma](/D:/Sriram/ailaws/prisma/schema.prisma)
- [app/api/assessments/[id]/evidence/route.ts](/D:/Sriram/ailaws/app/api/assessments/[id]/evidence/route.ts)
- [app/evidence/page.tsx](/D:/Sriram/ailaws/app/evidence/page.tsx)
- [app/assess/results/[id]/page.tsx](/D:/Sriram/ailaws/app/assess/results/[id]/page.tsx)
- [lib/evidence-package.ts](/D:/Sriram/ailaws/lib/evidence-package.ts)

Acceptance criteria:

- every tracked task can have evidence attached
- exports show traceability, not just summaries
- evidence freshness affects blocker state and audit-readiness

### Phase 3. Continuous Compliance and Monitoring

Goal: turn the app from point-in-time output into an always-on engine.

Status: pending.

Scope:

- Add change monitoring for:
  - law changes
  - source health changes
  - system or model changes
  - evidence staleness
- Add user-facing drift alerts:
  - compliance score dropped
  - new law affects saved assessment
  - evidence expired or missing
- Add integrations:
  - GitHub
  - Slack
  - CI/CD or release hooks

Likely repo areas:

- [app/alerts/page.tsx](/D:/Sriram/ailaws/app/alerts/page.tsx)
- [app/api/alerts/route.ts](/D:/Sriram/ailaws/app/api/alerts/route.ts)
- [lib/alert-delivery.ts](/D:/Sriram/ailaws/lib/alert-delivery.ts)
- [lib/workspace-intelligence.ts](/D:/Sriram/ailaws/lib/workspace-intelligence.ts)

Acceptance criteria:

- users receive actionable alerts tied to real changes
- drift is visible in dashboard, results, and alert feeds
- external integrations can trigger reassessment or notification

### Phase 4. Data Moat and Legal Graph

Goal: make the product defensible through structured legal and compliance data.

Status: pending.

Scope:

- Build law ingestion or sync pipeline for tracked regulations.
- Add versioning for law and obligation records.
- Build structured legal graph:
  - law -> requirement -> risk -> task -> evidence
- Add benchmarking surfaces where justified.

Likely repo areas:

- [prisma/schema.prisma](/D:/Sriram/ailaws/prisma/schema.prisma)
- [prisma/seed.ts](/D:/Sriram/ailaws/prisma/seed.ts)
- [lib/lexforge-data.ts](/D:/Sriram/ailaws/lib/lexforge-data.ts)
- `scripts/` for ingest and sync jobs

Acceptance criteria:

- law updates are versioned and reproducible
- legal entities can be traversed relationally
- product can support comparative or benchmark features later without redesign

## Roadmap Workstreams From `roadmap.md`

These are now part of the implementation plan and are required for full feature completion.

### Workstream 1. Legal Data Provenance

Goal: make every law and obligation traceable to a source and reviewer.

Status: partially implemented, with user-facing trust signals now visible on law detail and editorial surfaces.

Required work:

- expand provenance fields and relationships where still missing
- attach full citations and excerpts to obligations
- distinguish primary law, guidance, standards, proposals, and editorial summaries
- support reviewer identity, confidence, review status, and supersession lineage

Repo areas:

- [prisma/schema.prisma](/D:/Sriram/ailaws/prisma/schema.prisma)
- [prisma/seed.ts](/D:/Sriram/ailaws/prisma/seed.ts)
- [lib/lexforge-data.ts](/D:/Sriram/ailaws/lib/lexforge-data.ts)
- admin/editorial pages

### Workstream 2. Editorial Governance and Content Operations

Goal: make content governance enforced by the product.

Status: partially implemented, with law and obligation review actions now available in the admin queue.

Required work:

- editorial queue for stale, broken, or missing-review content
- approval workflow with reviewer and approver separation
- diffable edit history and revert path
- scheduled content review cadences and source checks
- changelog distinction between corrections and regulatory updates

Repo areas:

- [app/admin/editorial/page.tsx](/D:/Sriram/ailaws/app/admin/editorial/page.tsx)
- [app/admin/changelog/page.tsx](/D:/Sriram/ailaws/app/admin/changelog/page.tsx)
- admin APIs under [app/api/admin](/D:/Sriram/ailaws/app/api/admin)

### Workstream 3. Rules Engine Explainability and Legal Defensibility

Goal: make outputs reviewable and reproducible.

Status: mostly present, still needs deeper polish.

Required work:

- expose assumptions used during assessment
- add better UI for matches, misses, and weighting
- add historical comparison and result diffing
- lock historical result display to exact stored evaluation traces where needed

Repo areas:

- [lib/rules-engine.ts](/D:/Sriram/ailaws/lib/rules-engine.ts)
- [app/assess/results/[id]/page.tsx](/D:/Sriram/ailaws/app/assess/results/[id]/page.tsx)

### Workstream 4. Testing Pyramid and Regression Safety

Goal: keep the product from regressing as the system grows.

Status: partial, with additional unit coverage now in place for evidence helpers.

Required work:

- expand unit coverage:
  - evidence package builders
  - export helpers
  - auth utilities
  - changelog and review queue logic
  - freshness logic
- add integration tests for critical API routes
- add broader smoke or end-to-end coverage
- ensure CI blocks on test and type failures

Repo areas:

- [tests/unit](/D:/Sriram/ailaws/tests/unit)
- [tests/smoke](/D:/Sriram/ailaws/tests/smoke)
- CI config files to be added

### Workstream 5. Security, Authorization, and Tenant Safety

Goal: ensure org and user data cannot leak or be misused.

Status: pending review and hardening.

Required work:

- inventory all routes and define access policy
- enforce server-side ownership and org membership checks consistently
- add audit logging for admin, invites, assignments, and sensitive changes
- validate invite expiration and replay behavior
- add password reset before public production release
- harden secrets, rate limits, and startup validation

Repo areas:

- [app/api](/D:/Sriram/ailaws/app/api)
- [auth.ts](/D:/Sriram/ailaws/auth.ts)
- [middleware.ts](/D:/Sriram/ailaws/middleware.ts)
- [lib/env-validation.ts](/D:/Sriram/ailaws/lib/env-validation.ts)

### Workstream 6. Observability, Logging, and Incident Response

Goal: make failures diagnosable and alertable.

Status: partial, with trust metadata now visible on law, evidence, results, and editorial surfaces.

Required work:

- structured logs with request correlation
- better instrumentation of key flows
- alerting for failed jobs, auth spikes, export failures, and source validation issues
- tracing for slow pages and endpoints
- uptime checks and operational dashboards

Repo areas:

- [lib/monitoring.ts](/D:/Sriram/ailaws/lib/monitoring.ts)
- APIs under [app/api](/D:/Sriram/ailaws/app/api)
- background jobs to be added

### Workstream 7. Data Resilience, Migrations, and Recovery

Goal: ensure production data survives deploys and mistakes.

Status: pending.

Required work:

- finalize production DB path
- document migration runbook and rollback steps
- separate immutable source content from editable runtime records
- add backup, restore, and preflight discipline
- validate restore in staging

Repo areas:

- [prisma/schema.prisma](/D:/Sriram/ailaws/prisma/schema.prisma)
- [README.md](/D:/Sriram/ailaws/README.md)
- `docs/runbooks/`

### Workstream 8. External Source Integrity and Freshness Automation

Goal: detect dead or drifting legal sources automatically.

Status: partial foundations exist.

Required work:

- scheduled source validation job
- richer source health states
- admin dashboard for source failures
- fallback archival references
- automatic confidence downgrades or review-state impacts when sources break

Repo areas:

- [app/admin/sources/page.tsx](/D:/Sriram/ailaws/app/admin/sources/page.tsx)
- [app/api/admin/source-health/route.ts](/D:/Sriram/ailaws/app/api/admin/source-health/route.ts)

### Workstream 9. Performance and Scalability

Goal: keep key flows responsive under real usage.

Status: pending.

Required work:

- measure key page and API latency
- reduce repeated transforms and lookups
- define response-size and timing budgets
- add DB indexes once production DB target is locked
- profile evidence generation and assessment computation at larger scales

### Workstream 10. Accessibility and UX Hardening

Goal: ensure the product is understandable and usable in real conditions.

Status: pending.

Required work:

- accessibility review across public and authenticated flows
- stronger keyboard and focus behavior
- better validation, loading, empty, and failure states
- export and print review for readability and non-color-only meaning

### Workstream 11. Product Trust Signals in the UI

Goal: make reliability visible to users on-page.

Status: partial.

Required work:

- show verification and review metadata in law and evidence views
- label content type clearly: law, guidance, proposal, editorial summary
- show last reviewed date, confidence, and reviewer identity
- make disclaimers and assumptions clearer in results

### Workstream 12. Documentation, Runbooks, and Launch Discipline

Goal: remove tribal knowledge from deployment, ops, and content workflows.

Status: pending.

Required work:

- production deployment guide
- environment variable reference
- migration and rollback runbook
- backup and restore runbook
- incident response playbook
- editorial workflow handbook
- testing and release checklist

Likely docs:

- [README.md](/D:/Sriram/ailaws/README.md)
- [docs](/D:/Sriram/ailaws/docs)

## Feature Completion Matrix

This section ties product-facing features to the implementation work needed.

### Intelligent assessment engine

Needed:

- better classifier coverage
- assumption capture
- explainability polish
- regression fixtures for known scenarios

### Automatic law mapping

Needed:

- stronger source-backed rationale generation
- better diffing across assessment runs
- clearer confidence and review metadata

### Obligation generator

Needed:

- richer owner mapping
- stronger deadline logic
- evidence requirements per obligation
- assignment and workload management in teams

### Compliance dashboard

Needed:

- continuous drift and score updates
- evidence completeness rollups
- org-level posture views
- performance optimization for dashboard aggregation

### Audit export

Needed:

- full traceability sections
- persistent evidence links
- stronger trust metadata display
- verified export templates with failure-state handling

### Monitoring and alerts

Needed:

- scheduled jobs
- notification routing
- integration hooks
- source-health and evidence-freshness automation

### Data moat

Needed:

- ingestion pipeline
- legal graph
- version history
- benchmark support

## Final Exit Checklist

- [x] Freeform assessment entrypoint shipped
- [x] First-pass classifier and blocker engine shipped
- [x] Action-plan-driven checklist generation shipped
- [x] Expanded audit export metadata shipped
- [x] Persistent evidence model shipped
- [x] Obligation -> task -> evidence traceability shipped
- [x] Continuous compliance monitoring shipped
- [ ] Law ingestion and versioning pipeline shipped
- [ ] Provenance model fully populated for all in-scope content
- [x] Editorial review workflow enforced
- [x] Content audit trail and revert path shipped
- [x] Rules engine explainability polished and fully surfaced
- [x] Historical comparison and result diffing shipped
- [x] Unit coverage expanded for critical helpers
- [x] Integration test suite shipped
- [x] Smoke or end-to-end coverage expanded for major flows
- [x] CI pipeline blocks bad merges
- [x] Authorization matrix documented and enforced
- [x] Sensitive admin and org actions audited
- [x] Structured logging and request correlation shipped
- [x] Alerting and incident visibility configured
- [ ] Backup and restore tested
- [x] Migration and rollback runbooks completed
- [x] Scheduled source validation job running
- [ ] Performance budgets defined and met
- [x] Accessibility review completed
- [x] Failure-state UX hardened
- [x] Trust metadata visible in the UI
- [x] Editorial history includes inline rollback actions with guarded revert logic
- [x] Rollback reasons and dedicated audit-log visibility shipped
- [x] Persistent compliance-alert registry and refreshable drift queue shipped
- [x] Compliance-alert delivery automation and user email controls shipped
- [x] Scheduler-safe delivery endpoint and Slack webhook escalation shipped
- [x] GitHub/CI system-change ingestion and drift-trigger wiring shipped
- [x] Native GitHub webhook adapters and reassessment recommendations shipped
- [x] Organization-level alert routing and workspace integration settings shipped
- [x] Checklist assignee controls and ownership-aware alert routing shipped
- [x] Deployment, security, testing, and content-ops docs completed
- [ ] Final staging launch review completed

When every item above is complete, the plan covers both the roadmap feature set and the production/trust gates needed to call the product fully implemented.
