# Case Study: AI Hiring And Screening Tool

## Scenario

A startup sells an AI-assisted hiring workflow for SMB employers.

The product:

- summarizes resumes
- ranks candidate fit signals
- drafts interview notes
- helps recruiters prioritize applicants
- processes candidate and employment-related data

The team is preparing for launch expansion and wants to understand where the biggest regulatory and evidence risks are likely to show up.

## Why this team would use Compass

This team needs more than a general law list. It needs a structured view of:

- whether the use case is likely to trigger higher scrutiny
- what evidence should exist before rollout
- what internal policies or oversight controls should be documented

## How the journey works in Compass

### 1. Run the assessment with a realistic system profile

The product lead or compliance owner starts in [app/assess/page.tsx](app/assess/page.tsx).

They describe the system in plain English or start from a relevant preset.

Compass is likely to infer:

- HR or recruitment use case
- employment data processing
- possible automated decision sensitivity
- jurisdictions that matter based on planned rollout

### 2. Use the results to focus the real work

In [app/assess/results/[id]/page.tsx](app/assess/results/[id]/page.tsx), the team reviews:

- applicable or potentially applicable laws
- the most important obligations
- action items with suggested owners
- evidence guidance tied to those items

This is especially useful in a hiring context because the biggest risk is often not lack of awareness. It is lack of a clear plan for oversight, documentation, and defensible process.

### 3. Turn controls into evidence

In [app/evidence/page.tsx](app/evidence/page.tsx), the team can collect and organize proof such as:

- recruiter review or escalation procedures
- candidate notice language
- internal bias or fairness review notes
- documentation of when human review overrides model suggestions

The evidence workspace makes these artifacts visible and easier to reuse later.

### 4. Watch for drift as the product evolves

If the startup later adds new markets, new ranking logic, or more automated workflows, [app/dashboard/page.tsx](app/dashboard/page.tsx) and [app/alerts/page.tsx](app/alerts/page.tsx) help the team see when the original assessment may need to be revisited.

## What value the team gets

For this kind of product, Compass helps the team move from a vague sense of risk to a usable operating plan:

- understand likely exposure
- identify the most important control gaps
- prepare evidence before outside scrutiny increases
- keep reassessment tied to real product changes

## Why this case matters

This is a good example of a higher-scrutiny SMB use case. It shows that Compass can help a small team structure its readiness work before legal, procurement, or customer pressure forces a reactive scramble.