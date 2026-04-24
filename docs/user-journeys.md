# End-To-End User Journeys

## Purpose

This document explains how each core persona moves through Spanforge Compass from first trigger to repeat usage.

The goal is not to list features in isolation. The goal is to show how the product creates value in sequence.

## Core Product Loop

The core Compass loop is:

1. Discover what applies.
2. Turn that into actions and evidence.
3. Track what changes later.

That loop is expressed in the product through these main surfaces:

- Explore laws: [app/explore/page.tsx](app/explore/page.tsx)
- Run assessment: [app/assess/page.tsx](app/assess/page.tsx)
- Review results and action plan: [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx)
- Manage evidence: [app/evidence/page.tsx](app/evidence/page.tsx)
- Monitor ongoing status: [app/dashboard/page.tsx](app/dashboard/page.tsx)
- Track updates and watchlists: [app/alerts/page.tsx](app/alerts/page.tsx)

## Journey 1: Founder Preparing For Launch Or Procurement

### Starting point

The founder is about to launch an AI feature or answer a buyer questionnaire. They need clarity fast and do not want to translate legal material into operational work by hand.

### Step 1: Enter through the homepage or assessment flow

- They land on the product promise in [app/page.tsx](app/page.tsx).
- The main CTA sends them to the assessment.
- If they are in a hurry, they use the quick-start path in [app/assess/page.tsx](app/assess/page.tsx) and describe their product in plain English.

### Step 2: Generate a first-pass regulatory profile

- Compass infers likely product shape, use cases, and target markets.
- The founder fills any missing facts and completes the assessment.
- The rules engine determines which laws are likely applicable and which obligations matter most.

### Step 3: Read an owner-friendly result

- The results page shows an executive verdict and law map in [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx).
- The founder sees plain-English actions, suggested owners, target timing, and evidence to attach.
- This turns a legal question into a shipping plan.

### Step 4: Capture proof without heavy process

- The founder opens [app/evidence/page.tsx](app/evidence/page.tsx).
- They use the quick-capture flow to paste a policy link, internal doc, or note.
- Compass suggests where that proof belongs and helps create an evidence artifact.

### Step 5: Return only when something important changes

- The dashboard in [app/dashboard/page.tsx](app/dashboard/page.tsx) shows drift, priorities, and evidence coverage.
- The alerts surface in [app/alerts/page.tsx](app/alerts/page.tsx) keeps tracked laws visible.
- The founder does not need to re-run everything constantly. They return when the product changes, laws change, or a buyer asks new questions.

### Value delivered

- Fast clarity on what matters.
- A concrete list of next steps.
- Reusable evidence for customers and advisors.
- Lower risk of being surprised late in the launch cycle.

## Journey 2: Product Lead Managing An Expanding AI Feature

### Starting point

The product lead is expanding an AI feature into new markets, new data flows, or new automation patterns. They need to understand what changed and what to do next.

### Step 1: Reassess the current product shape

- The product lead runs or updates an assessment in [app/assess/page.tsx](app/assess/page.tsx).
- They capture current use cases, AI behaviors, data categories, and markets.

### Step 2: Understand which obligations become operational work

- In [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx), the action plan groups the most urgent work.
- The lead sees what belongs to product, engineering, legal, or operations.
- The result is useful because it is tied to execution, not only applicability.

### Step 3: Move from actions to implementation evidence

- The product lead uses [app/evidence/page.tsx](app/evidence/page.tsx) to see evidence gaps.
- Recommended evidence types help the team understand what documentation or process record is missing.
- The quick-capture flow lowers friction when someone already has a link or document ready.

### Step 4: Keep the team focused on the real deltas

- The dashboard in [app/dashboard/page.tsx](app/dashboard/page.tsx) surfaces weekly priorities, change-impact briefs, and regulatory updates.
- This helps the product lead decide what must be handled now versus what can wait.

### Step 5: Monitor the watchlist around rollout

- In [app/alerts/page.tsx](app/alerts/page.tsx), the team tracks jurisdictions or laws tied to the feature.
- The lead stays informed without manually monitoring every legal source.

### Value delivered

- Better launch decisions.
- Clear ownership and sequencing.
- Lower overhead when product scope evolves.
- A practical bridge between product work and compliance work.

## Journey 3: Compliance Or Legal Operator Building A Defensible Record

### Starting point

The operator needs traceable outputs, evidence coverage, and a defensible view of why a law applies or does not apply.

### Step 1: Review law inventory and provenance

- They begin in [app/explore/page.tsx](app/explore/page.tsx) or individual law pages.
- They review jurisdictions, topics, statuses, freshness cues, and cited law summaries.

### Step 2: Run or inspect an assessment

- They use [app/assess/page.tsx](app/assess/page.tsx) to define the system profile.
- They review results in [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx) with rationale, law mapping, obligation views, and follow-up tabs.

### Step 3: Translate obligations into checklist and evidence coverage

- The operator uses [app/evidence/page.tsx](app/evidence/page.tsx) to inspect evidence status by obligation.
- They can see what is covered, in progress, stale, or still missing.
- This makes compliance work reviewable instead of hidden in scattered docs.

### Step 4: Maintain ongoing visibility

- The dashboard in [app/dashboard/page.tsx](app/dashboard/page.tsx) shows trust scorecard, gap patterns, and drift triggers.
- The alerts surface in [app/alerts/page.tsx](app/alerts/page.tsx) captures tracked law changes and compliance alerts.

### Step 5: Prepare reusable outputs

- The operator can use templates and evidence artifacts to support internal signoff, procurement responses, and audit-style reviews.
- The system becomes a working layer for evidence readiness, not just an assessment snapshot.

### Value delivered

- More defensible conclusions.
- Easier gap reviews.
- Better continuity over time.
- Stronger proof for internal and external stakeholders.

## Journey 4: Fractional Advisor Running Client Sessions

### Starting point

The advisor needs a structured way to evaluate a client quickly, identify exposure, and leave behind an actionable work product.

### Step 1: Use Compass live during intake

- The advisor starts in [app/assess/page.tsx](app/assess/page.tsx).
- The plain-English quick-start path helps accelerate the first client conversation.

### Step 2: Turn legal uncertainty into a shared picture

- The results page in [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx) gives the client a concrete view of what matters now.
- The advisor can explain laws, obligations, and priorities in a structured way.

### Step 3: Move the client toward evidence and follow-up

- In [app/evidence/page.tsx](app/evidence/page.tsx), the advisor shows what proof should exist.
- The client can begin documenting policies, controls, and oversight evidence immediately.

### Step 4: Stay useful between sessions

- The dashboard and alerts surfaces make it easier to revisit client exposure later.
- This creates a more durable client workflow than a one-off memo.

### Value delivered

- Faster first-pass advisory work.
- Better client understanding.
- A reusable operating layer between advisory sessions.
- A clearer handoff from diagnosis to implementation.

## Feature-To-Value Map

| Product surface | What the user sees | Why it matters |
|---|---|---|
| [app/page.tsx](app/page.tsx) | Clear promise and CTA | Sets expectation around applicability, evidence, and revisit workflows |
| [app/explore/page.tsx](app/explore/page.tsx) | Searchable law inventory | Builds trust and supports top-of-funnel exploration |
| [app/assess/page.tsx](app/assess/page.tsx) | Fast intake, presets, quick-start | Gets users to first value faster |
| [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx) | Verdict, obligations, actions, gaps | Converts assessment output into execution |
| [app/evidence/page.tsx](app/evidence/page.tsx) | Evidence gaps, recommendations, quick capture | Makes readiness tangible and reusable |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | Weekly priorities, drift, trust signals | Creates repeat usage after the first assessment |
| [app/alerts/page.tsx](app/alerts/page.tsx) | Watchlists and legal change visibility | Keeps the system useful after initial setup |

## Recommended Demo Narrative

If you are explaining the product to a prospect, partner, or advisor, use this narrative order:

1. Start with the trigger: launch, buyer diligence, or changing AI scope.
2. Show the quick-start assessment path.
3. Show the results page with owner-ready actions.
4. Show the evidence workspace to prove this is not just analysis.
5. Show the dashboard or alerts page to explain why users come back.

That sequence communicates the product as an operating workflow, not a static database of laws.