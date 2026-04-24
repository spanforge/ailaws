# How Compass Works

## What Compass does

Spanforge Compass helps a team answer three practical questions about an AI product:

1. Which AI laws actually apply to us?
2. What do we need to do next?
3. What evidence should we keep ready?

It is designed for small teams that need a usable working system, not a heavy enterprise governance program.

## Who should use Compass

Compass is most useful for:

- founders and operators launching AI features
- product leads expanding AI systems into new regions or use cases
- compliance, privacy, legal, or trust generalists at startups and SMBs
- fractional advisors helping multiple small companies prepare for launch or diligence

## The core workflow

Compass is built around a simple loop:

1. Assess your system.
2. Turn the result into actions and evidence.
3. Revisit only when something changes.

## Step 1: Assess your system

Start in [app/assess/page.tsx](app/assess/page.tsx).

You can either:

- choose a preset that matches your product shape
- start from a blank assessment
- use the quick-start path and describe your product in plain English

Compass uses that input to build a first-pass profile of:

- likely use cases
- target markets
- data signals
- risk-relevant characteristics

The goal of this step is speed. A serious user should be able to get from rough product description to a credible first-pass assessment in one session.

## Step 2: Review the result like an operator, not like a lawyer

After the assessment, Compass generates results in [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx).

This is where the product becomes useful. Instead of only showing a law list, Compass turns the analysis into working outputs:

- an executive verdict
- a law map
- top obligations
- a prioritized action plan
- suggested owners
- target timing
- evidence guidance

This helps a team move from “what does this mean?” to “what should we do next?”

## Step 3: Turn compliance work into evidence

The evidence workspace lives in [app/evidence/page.tsx](app/evidence/page.tsx).

This is where teams can:

- see which obligations already have supporting proof
- identify evidence gaps
- collect recommended evidence types
- paste a document link or note and get a suggested attachment target
- create evidence artifacts for later reuse

This matters because most teams do not fail on awareness alone. They fail when they cannot produce proof quickly when a customer, partner, or reviewer asks for it.

## Step 4: Stay current without starting over

Compass is not only a one-time assessment tool.

The dashboard in [app/dashboard/page.tsx](app/dashboard/page.tsx) helps teams keep their current posture visible by showing:

- weekly priority items
- trust and gap signals
- evidence freshness and drift indicators
- targeted change-impact and regulatory update briefs

The alerts workflow in [app/alerts/page.tsx](app/alerts/page.tsx) helps teams watch the laws and jurisdictions that matter to their product.

This means the team can return when something changed, instead of rebuilding the whole analysis on every review cycle.

## What a good first session looks like

By the end of a strong first session, a user should be able to say:

- these are the laws that matter most to us right now
- these are the obligations we need to pay attention to
- these are the next actions and who should own them
- these are the documents or controls we should be able to show

If Compass delivers those four outcomes, it has already created real value.

## What Compass is not trying to be

Compass is not a full enterprise GRC suite.

It is also not a substitute for formal legal advice in edge cases.

It is a focused operating layer for small teams that need to:

- understand likely applicability
- organize follow-up work
- keep evidence ready
- track changes over time

## Why teams come back

Teams do not return to Compass just to reread laws.

They return because one of these things changed:

- the product expanded into a new region
- a new use case or data type was introduced
- a customer asked for evidence
- a tracked law changed
- old evidence became stale

That repeat-use loop is a core part of the product value.

## Short version

Compass helps a small team go from uncertainty to readiness:

1. understand which AI laws matter
2. turn that into action and evidence
3. stay current as the product or legal landscape changes