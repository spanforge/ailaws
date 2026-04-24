# Demo Script

## Purpose

Use this script for live demos, launch walkthroughs, founder calls, and short recordings.

The goal is to communicate value through the user journey, not through a raw feature inventory.

## Best audience

This demo works best for:

- founders shipping AI products
- product or AI leads
- compliance, legal, privacy, or trust generalists at small companies
- fractional advisors supporting startups

## Demo promise in one sentence

Compass helps a small team figure out which AI laws apply, what they need to do next, and what evidence they should keep ready.

## Recommended demo length

- Short version: 5 minutes
- Standard version: 10 to 12 minutes
- Deep version: 15 to 20 minutes

## Demo flow

### 1. Start with the problem

Say this:

> Most small teams shipping AI do not need a huge governance suite first. They need to know which laws matter, what to do next, and what proof they should be ready to show.

Then show the homepage in [app/page.tsx](app/page.tsx).

What to point out:

- the product is built for practical readiness, not abstract law tracking
- the promise is assess, act, and revisit
- the target user is a small team that needs clarity fast

### 2. Show how fast first value happens

Go to [app/assess/page.tsx](app/assess/page.tsx).

Say this:

> The first thing we optimize for is speed to clarity. A user can either choose a preset or describe their product in plain English and let Compass prefill the first-pass profile.

What to show:

- the preset options
- the quick-start textarea
- the company and product profile flow
- the intake assistant summary and inferred fields

What to emphasize:

- the system reduces blank-page friction
- users do not need to translate everything manually before seeing value

### 3. Show the results as an operating view

Go to [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx).

Say this:

> This is where Compass stops being a questionnaire and becomes a working system. It turns the assessment into a law map, prioritized obligations, and an action plan a small team can actually use.

What to show:

- executive verdict
- law map and key obligations
- action plan cards with suggested owner, target date, and evidence to attach
- operator queue and monitoring briefs if available

What to emphasize:

- this is not just “here are some laws”
- it turns output into plain-English follow-up work
- a founder or product lead can immediately see what needs to happen next

### 4. Show the evidence workflow

Go to [app/evidence/page.tsx](app/evidence/page.tsx).

Say this:

> Most teams do not struggle only with analysis. They struggle when someone asks for proof. The evidence workspace is where Compass turns obligations into reusable readiness artifacts.

What to show:

- evidence gaps by obligation
- recommended evidence to collect next
- quick-capture flow using a link or short note
- prefilled artifact creation

What to emphasize:

- the system lowers the cost of turning work into proof
- this makes the output reusable in diligence, procurement, and internal reviews

### 5. Show why the product has repeat value

Go to [app/dashboard/page.tsx](app/dashboard/page.tsx) and [app/alerts/page.tsx](app/alerts/page.tsx).

Say this:

> The product is not meant to be used once and forgotten. Teams come back when their product changes, when evidence goes stale, or when tracked laws move.

What to show:

- weekly priorities
- change-impact or regulatory update briefs
- drift or trust signals
- watchlist and alert management

What to emphasize:

- this creates a real operating loop
- teams do not need to restart from zero every time something changes

### 6. Close with the value summary

Say this:

> The job Compass does is simple: help a small team understand applicability, turn that into action and evidence, and stay current over time without heavyweight process.

## Short demo track

If you only have 5 minutes, use this sequence:

1. homepage promise
2. quick-start assessment
3. results action plan
4. evidence quick-capture
5. dashboard or alerts for repeat value

## Questions to ask during the demo

Use these if you want the demo to feel consultative instead of scripted:

- What AI feature are you shipping right now?
- Is your pressure coming from launch, procurement, customer diligence, or internal review?
- Which regions matter first?
- What evidence do you wish you already had on hand?
- What would make a tool like this worth returning to next week?

## Objection handling

### Objection: “We already have lawyers”

Suggested response:

> That is fine. Compass is not trying to replace legal advice. It gives your team a practical operating layer so legal review, product follow-up, and evidence capture are easier and more structured.

### Objection: “We are too small for compliance software”

Suggested response:

> That is exactly why the workflow is narrow. The goal is not to create a big governance program. The goal is to help a small team answer the most important applicability and evidence questions fast.

### Objection: “We only care when a customer asks”

Suggested response:

> That is one of the best reasons to use it. Compass helps you prepare before the question arrives, and then keep the answer current as your product changes.

## Tips for a strong live demo

- Show one realistic example, not every feature.
- Keep the narrative centered on one persona and one trigger event.
- Spend more time on results and evidence than on input forms.
- End on repeat value, not just first-run value.

## Closing line

Use this at the end:

> If your team is shipping AI and needs to know what laws matter, what to do next, and what proof to keep ready, that is the gap Compass is built to close.