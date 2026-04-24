# Product Personas

## Purpose

This document explains who Spanforge Compass is for, what job each persona is trying to get done, and which parts of the product matter most to them.

Use this when writing product copy, onboarding flows, demos, outbound messaging, or customer support replies.

## Primary ICP

Spanforge Compass is best suited for individuals, startups, and SMB teams shipping AI features and needing to answer one practical question:

How do we determine which AI laws apply, show that we are handling the risk responsibly, and stay current without building a heavyweight internal compliance program?

## Persona 1: Founder Or CEO Shipping AI Fast

### Who this person is

- Founder, CEO, or small-company operator.
- Usually owns launch readiness, customer diligence, and internal prioritization.
- Often does not have dedicated legal or compliance staff.

### What triggers usage

- A launch is coming up.
- A customer or prospect asks about AI governance.
- An enterprise buyer sends a questionnaire.
- The team wants to know whether a new AI feature creates regulatory exposure.

### What they need from the product

- A fast answer on which laws matter.
- Plain-English next steps instead of legal theory.
- Evidence they can reuse in sales, diligence, and internal reviews.
- Confidence that they are not missing an obvious issue.

### Most important product surfaces

- [app/assess/page.tsx](app/assess/page.tsx)
- [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx)
- [app/evidence/page.tsx](app/evidence/page.tsx)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)

### What success looks like

- They finish one assessment in a single session.
- They understand the top laws, top obligations, and top actions.
- They export or prepare at least one evidence artifact.
- They can answer a buyer or advisor with something concrete.

## Persona 2: Product Lead Or AI Feature Owner

### Who this person is

- Product manager, AI lead, engineering manager, or implementation owner.
- Responsible for scope, rollout decisions, and operational follow-through.
- Needs a workflow that connects product decisions to legal or governance impact.

### What triggers usage

- A new AI workflow is being designed.
- A feature is expanding to new regions.
- The system starts using new data, automation, or human review patterns.
- The team needs to know what changes should trigger reassessment.

### What they need from the product

- A structured view of applicability and obligations.
- A prioritized action plan that can be assigned and executed.
- Visibility into change impact and drift.
- A way to connect product reality to ongoing compliance work.

### Most important product surfaces

- [app/assess/page.tsx](app/assess/page.tsx)
- [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [app/alerts/page.tsx](app/alerts/page.tsx)

### What success looks like

- They know which actions are urgent versus later.
- They can point to suggested owners, due windows, and evidence types.
- They can see what to rerun when product scope changes.
- They return when laws or product inputs change.

## Persona 3: Compliance, Legal, Or Trust Operator At A Small Team

### Who this person is

- Compliance lead, privacy owner, legal ops, trust lead, or security/compliance generalist.
- Usually works without a large dedicated governance platform.
- Needs traceability, auditability, and evidence coverage.

### What triggers usage

- Internal launch signoff is needed.
- The company needs defensible documentation.
- The team wants a checklist-driven view of gaps.
- A regulator, partner, or buyer asks for proof.

### What they need from the product

- Source-linked law information.
- A deterministic assessment with visible rationale.
- Checklist and evidence tracking.
- Exportable artifacts and confidence that evidence stays fresh.

### Most important product surfaces

- [app/explore/page.tsx](app/explore/page.tsx)
- [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx)
- [app/evidence/page.tsx](app/evidence/page.tsx)
- [app/alerts/page.tsx](app/alerts/page.tsx)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)

### What success looks like

- They can show where the conclusion came from.
- They can identify evidence gaps quickly.
- They can keep a watchlist on relevant laws and changes.
- They can prepare a reusable trust packet or evidence package.

## Persona 4: Fractional Advisor, Consultant, Or External Operator

### Who this person is

- Fractional compliance advisor, startup counsel, trust consultant, or operator helping several companies.
- Needs a repeatable way to assess multiple client situations without rebuilding analysis from scratch.

### What triggers usage

- A client asks whether an AI feature is launch-ready.
- The advisor needs a structured first-pass review before deeper legal work.
- A client needs a practical compliance work plan, not just a memo.

### What they need from the product

- A fast intake workflow.
- Reusable outputs they can review with a client.
- A way to turn legal exposure into concrete operational tasks.
- A system that makes follow-up and reassessment easy.

### Most important product surfaces

- [app/assess/page.tsx](app/assess/page.tsx)
- [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx)
- [app/templates/page.tsx](app/templates/page.tsx)
- [app/evidence/page.tsx](app/evidence/page.tsx)

### What success looks like

- They can complete a first-pass review live with a client.
- They leave the session with a concrete action plan.
- They can guide the client toward evidence collection instead of abstract advice.
- They can use Compass as the operating layer around a broader advisory engagement.

## Users Who Are A Poor Fit Right Now

Compass is less suitable today for:

- Large enterprises requiring deep custom policy mapping, SSO, and complex workflow controls.
- Teams looking for formal legal advice instead of operational guidance.
- Users who only want passive law news without assessment or evidence workflows.

## Positioning Summary

If a team is asking whether an AI feature is safe to launch, what laws apply, what evidence to prepare, and what to revisit later, Compass is a strong fit.

If a team needs a full enterprise GRC platform or jurisdiction-specific legal counsel, Compass should be positioned as a focused working layer, not the complete answer.