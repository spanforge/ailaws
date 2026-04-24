# Case Study: AI Support SaaS

## Scenario

A small B2B SaaS company sells an AI support assistant for ecommerce and SaaS teams.

The product:

- answers customer support questions
- summarizes tickets
- drafts suggested replies for agents
- processes customer messages from EU and US users

The company is preparing for larger customer procurement reviews and wants to understand what compliance work should exist before those conversations intensify.

## Why this team would use Compass

This team does not need a giant compliance stack first. It needs fast answers to practical questions:

- which laws might apply to this product?
- which obligations should we take seriously now?
- what evidence should we have ready if a buyer asks?

## How the journey works in Compass

### 1. Quick-start the assessment

The founder or product lead opens [app/assess/page.tsx](app/assess/page.tsx) and enters a plain-English description of the support assistant.

Compass infers likely signals such as:

- customer service use case
- possible content generation behavior
- personal data processing
- EU and US market relevance

This gets the team to a first-pass profile quickly.

### 2. Review the result

In [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx), the team sees:

- which laws are likely relevant
- what obligations matter most
- an action plan with suggested owners and timing
- what evidence to attach to key actions

For this type of product, the most important outcome is not just the law map. It is the shift from uncertainty to a clear operational next step.

### 3. Build usable evidence

In [app/evidence/page.tsx](app/evidence/page.tsx), the team can attach:

- support escalation policies
- AI disclosure language
- internal review notes for agent oversight
- ticket handling or monitoring artifacts

The quick-capture flow is useful here because small teams often already have docs in Notion, Google Docs, or internal tickets. They just have not mapped them into a readiness workflow yet.

### 4. Stay ready for procurement and product changes

In [app/dashboard/page.tsx](app/dashboard/page.tsx) and [app/alerts/page.tsx](app/alerts/page.tsx), the team can keep track of:

- weekly priorities
- evidence freshness
- legal updates tied to tracked laws
- reassessment triggers when the product expands

## What value the team gets

By using Compass well, this team should be able to say:

- we know which laws are most likely relevant
- we know what work is still missing
- we have evidence we can show in procurement or diligence
- we know when we need to revisit the assessment later

## Why this case matters

This is a strong example of the SMB use case Compass is built for. The customer is not trying to build a full enterprise governance program. They are trying to ship responsibly, answer buyer questions, and stay ahead of obvious compliance gaps.