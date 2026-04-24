import { PrismaClient } from "@prisma/client";
import { laws } from "../lib/lexforge-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // Seed laws
  for (const law of laws) {
    const upsertedLaw = await prisma.law.upsert({
      where: { slug: law.slug },
      update: {
        title: law.title,
        shortTitle: law.short_title,
        jurisdiction: law.jurisdiction,
        topics: JSON.stringify(law.topics),
        issuingBody: law.issuing_body,
        status: law.status,
        contentType: law.content_type,
        summaryShort: law.summary_short,
        summaryLong: law.summary_long,
        officialUrl: law.official_url,
        adoptedDate: law.adopted_date ? new Date(law.adopted_date) : null,
        effectiveDate: law.effective_date ? new Date(law.effective_date) : null,
        lastReviewedAt: new Date(),
        isPublished: true,
        // WS1: Provenance
        sourceKind: law.source_kind ?? "editorial_summary",
        sourceAuthority: law.source_authority ?? null,
        sourceJurisdiction: law.jurisdiction_code ?? null,
        sourceCitationFull: law.source_citation_full ?? null,
        confidenceLevel: law.confidence_level ?? "medium",
        reviewStatus: law.review_status ?? "needs_review",
        rulesEngineVersion: law.rules_engine_version ?? "1.0.0",
      },
      create: {
        slug: law.slug,
        title: law.title,
        shortTitle: law.short_title,
        jurisdiction: law.jurisdiction,
        topics: JSON.stringify(law.topics),
        issuingBody: law.issuing_body,
        status: law.status,
        contentType: law.content_type,
        summaryShort: law.summary_short,
        summaryLong: law.summary_long,
        officialUrl: law.official_url,
        adoptedDate: law.adopted_date ? new Date(law.adopted_date) : null,
        effectiveDate: law.effective_date ? new Date(law.effective_date) : null,
        lastReviewedAt: new Date(),
        isPublished: true,
        // WS1: Provenance
        sourceKind: law.source_kind ?? "editorial_summary",
        sourceAuthority: law.source_authority ?? null,
        sourceJurisdiction: law.jurisdiction_code ?? null,
        sourceCitationFull: law.source_citation_full ?? null,
        confidenceLevel: law.confidence_level ?? "medium",
        reviewStatus: law.review_status ?? "needs_review",
        rulesEngineVersion: law.rules_engine_version ?? "1.0.0",
      },
    });

    // Seed obligations for this law
    for (const obl of law.obligations) {
      await prisma.obligation.upsert({
        where: { id: obl.id },
        update: {
          lawId: upsertedLaw.id,
          title: obl.title,
          description: obl.description,
          category: obl.category,
          priority: obl.priority,
          citation: obl.citation,
          actionRequired: obl.action_required,
          // WS1: Provenance
          sourceKind: obl.source_kind ?? null,
          sourceCitationFull: obl.source_citation_full ?? null,
          sourceExcerpt: obl.source_excerpt ?? null,
          confidenceLevel: obl.confidence_level ?? "medium",
          reviewStatus: obl.review_status ?? "draft",
          editorNotes: obl.editor_notes ?? null,
        },
        create: {
          id: obl.id,
          lawId: upsertedLaw.id,
          title: obl.title,
          description: obl.description,
          category: obl.category,
          priority: obl.priority,
          citation: obl.citation,
          actionRequired: obl.action_required,
          // WS1: Provenance
          sourceKind: obl.source_kind ?? null,
          sourceCitationFull: obl.source_citation_full ?? null,
          sourceExcerpt: obl.source_excerpt ?? null,
          confidenceLevel: obl.confidence_level ?? "medium",
          reviewStatus: obl.review_status ?? "draft",
          editorNotes: obl.editor_notes ?? null,
        },
      });
    }

    // Seed applicability rules
    for (const rule of law.applicability_rules) {
      await prisma.applicabilityRule.upsert({
        where: { id: rule.id },
        update: {
          lawId: upsertedLaw.id,
          name: rule.name,
          ruleJson: JSON.stringify(rule.rule_json),
          weight: rule.weight,
          enabled: true,
        },
        create: {
          id: rule.id,
          lawId: upsertedLaw.id,
          name: rule.name,
          ruleJson: JSON.stringify(rule.rule_json),
          weight: rule.weight,
          enabled: true,
        },
      });
    }

    console.log(`  ✓ ${law.title}`);
  }

  // Seed law changelog entries
  const changelogEntries = [
    {
      lawSlug: "eu-ai-act",
      changeType: "amendment",
      summary: "High-risk AI annex updated — new use cases added to Annex III",
      details:
        "The European Commission adopted delegated acts extending Annex III to cover AI systems used in insurance risk assessment and AI-assisted legal research tools.",
      changedAt: new Date("2025-11-15"),
    },
    {
      lawSlug: "eu-ai-act",
      changeType: "effective_date_change",
      summary: "GPAI model obligations now in effect as of August 2025",
      details:
        "The 12-month grace period for General Purpose AI providers expired. All GPAI model providers above the compute threshold must now comply with transparency and copyright obligations.",
      changedAt: new Date("2025-08-02"),
    },
    {
      lawSlug: "nist-ai-rmf",
      changeType: "new_obligation",
      summary: "NIST released AI RMF Generative AI Profile (NIST AI 600-1)",
      details:
        "Companion resource to the AI RMF addressing unique risks of generative AI including hallucinations, CBRN information risks, data privacy, and homogenization of AI outputs.",
      changedAt: new Date("2024-07-26"),
    },
    {
      lawSlug: "us-ai-executive-order-14110",
      changeType: "status_change",
      summary: "EO 14110 revoked — successor AI policy under review",
      details:
        "Executive Order 14110 was revoked in January 2025. Federal agencies are operating under interim guidance while new AI policy framework is developed.",
      changedAt: new Date("2025-01-20"),
    },
    {
      lawSlug: "colorado-ai-act",
      changeType: "effective_date_change",
      summary: "Colorado AI Act enforcement begins February 2026",
      details:
        "After a 12-month implementation period, the Colorado AI Act is now enforceable. Developers and deployers of high-risk AI systems must have completed risk assessments and impact disclosures.",
      changedAt: new Date("2026-02-01"),
    },
    {
      lawSlug: "eu-gdpr-ai",
      changeType: "amendment",
      summary: "EDPB issued guidelines on AI and GDPR interaction",
      details:
        "The European Data Protection Board clarified that AI systems processing personal data must comply with all GDPR principles, including purpose limitation and data minimisation, regardless of EU AI Act compliance.",
      changedAt: new Date("2025-09-10"),
    },
  ];

  for (const entry of changelogEntries) {
    const existing = await prisma.lawChangelog.findFirst({
      where: { lawSlug: entry.lawSlug, summary: entry.summary },
    });
    if (!existing) {
      await prisma.lawChangelog.create({ data: entry });
    }
  }

  console.log(`  ✓ Seeded ${changelogEntries.length} changelog entries`);
  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
