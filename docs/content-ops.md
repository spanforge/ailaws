# Content Operations

## Overview

Law content lives in `lib/lexforge-data.ts` as a TypeScript constant (`laws: Law[]`). This is the single source of truth for law definitions, obligations, and provenance metadata.

## Adding a New Law

1. Open `lib/lexforge-data.ts`.
2. Add a new `Law` object to the `laws` array. Required fields:

```ts
{
  id: "unique-id",                // unique string, e.g. "law-country-year"
  slug: "url-friendly-slug",      // used in URLs: /laws/[slug]
  title: "Full official title",
  short_title: "Short name",
  jurisdiction: "Country / Region",
  jurisdiction_code: "US",        // ISO 3166-1 alpha-2 or custom
  issuing_body: "Issuing authority",
  content_type: "regulation",     // regulation|directive|act|executive_order|framework|guideline
  status: "in_force",             // in_force|enacted|proposed|draft|repealed
  summary_short: "One sentence summary",
  summary_long: "Full paragraph summary",
  topics: ["AI", "Privacy"],
  obligations: [],                // see Obligation type below
  official_url: "https://...",
  adopted_date: "2024-01-01",     // YYYY-MM-DD or null
  effective_date: "2025-01-01",   // YYYY-MM-DD or null

  // Provenance fields (WS1)
  source_kind: "primary_law",     // primary_law|regulator_guidance|standard|proposal|policy|editorial_summary
  confidence_level: "high",       // high|medium|low
  review_status: "verified",      // verified|needs_review|draft|superseded|archived
  source_citation_full: "Official Journal ...",
  verified_at: "2025-01-15",      // date of last editorial verification
}
```

3. Add obligations for the law:

```ts
obligations: [
  {
    id: "law-slug-ob-001",        // unique, prefixed with law slug
    title: "Obligation name",
    description: "What the obligation requires",
    category: "Transparency",
    priority: "high",             // critical|high|medium|low
    applicability: "likely",      // likely|possible|unlikely
    action_required: "Specific action teams must take",
    citation: "Article 12(1)",
    weight: 1.0,
    spanforge_controls: [],        // optional control tags
  }
]
```

4. Add applicability rules in `lib/rules-engine.ts` if this law requires new rule conditions.

5. Run the tests to verify data integrity:

```bash
npm run test:unit
```

The `lexforge-data.test.ts` suite will catch: missing required fields, duplicate slugs/IDs/obligation IDs, and invalid enum values.

## Updating an Existing Law

1. Find the law by its `slug` in `lib/lexforge-data.ts`.
2. Edit the fields that changed.
3. Update `verified_at` to today's date.
4. If the review_status was `needs_review`, change it to `verified`.
5. If the `official_url` changed, run `npm run source:validate -- --slug <slug>` to verify it.
6. Run `npm test` to confirm no regressions.

## Editorial Review Workflow

For laws flagged with `review_status: "needs_review"`:

1. Navigate to `/admin/editorial` (admin role required).
2. The review queue lists all laws pending review.
3. Click "Approve" to verify, or "Request changes" to flag for follow-up.
4. Approvals are logged in the `ContentApproval` table for audit.
5. Reverts and field-level edits are available through the editorial audit surfaces.

## Auditability and trust operations

- Editorial field changes are persisted in `ContentEditAuditLog`.
- Sensitive workspace and admin operations are persisted in `ActionAuditLog`.
- Admin audit surfaces:
  - `GET /api/admin/editorial/audit-log`
  - `GET /api/admin/action-audit`
- Source-health automation is scheduled through `POST /api/cron/source-validation` and visible in `/admin/sources`.

## Source URL Validation

Run periodically (weekly recommended) to detect broken or redirected official URLs:

```bash
npm run source:validate
```

Results are stored in `SourceHealthCheck` and surfaced as `sourceHealthStatus` on each law card.

To check a single law:

```bash
npm run source:validate -- --slug eu-ai-act
```

Dry run (no DB writes):

```bash
npm run source:validate:dry
```

For production, keep the scheduled cron enabled in `vercel.json` and use dry runs only for staging checks.

## Content Quality Standards

- `source_kind: "editorial_summary"` must be flagged on any law not directly sourced from the official text. These show an editorial notice banner to users.
- `confidence_level: "low"` is set when the law text is a draft or the interpretation is uncertain.
- All obligations should have a `citation` pointing to a specific article or section.
- `summary_long` should be 2–4 sentences, written for a technical product team audience (not legal counsel).
