import { createHash, createHmac } from "node:crypto";
import { getLawBySlug, laws } from "@/lib/lexforge-data";
import { buildComplianceAnalysis, normalizeAssessmentInput } from "@/lib/compliance-analysis";
import { summarizeEvidenceCoverage } from "@/lib/evidence-artifacts";
import { runRulesEngine, type AssessmentInput, type AssessmentResult } from "@/lib/rules-engine";
import {
  buildActionPlan,
  buildKeySources,
  buildPenaltySnapshot,
  buildProductSummary,
  enrichAssessmentResults,
  getProductPresetById,
} from "@/lib/smb";
import { buildClauseGapReport, buildDriftTriggers, buildTrustScorecard } from "@/lib/workspace-intelligence";

type ChecklistItem = {
  id: string;
  lawSlug: string | null;
  title: string;
  status: string;
  priority: string | null;
  citation?: string | null;
  description?: string | null;
  evidenceArtifacts?: Array<{
    id: string;
    title: string;
    description: string | null;
    artifactType: string;
    sourceType: string | null;
    sourceUrl: string | null;
    status: string;
    collectedAt: Date;
    verifiedAt: Date | null;
    expiresAt: Date | null;
  }>;
};

type Checklist = {
  id: string;
  title: string | null;
  items: ChecklistItem[];
};

type AssessmentForEvidence = {
  id: string;
  createdAt: Date;
  name: string | null;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  checklists?: Checklist[];
};

function parseAssessmentInput(assessment: AssessmentForEvidence): AssessmentInput {
  return {
    ...JSON.parse(assessment.companyProfile ?? "{}"),
    ...JSON.parse(assessment.productProfile ?? "{}"),
    ...JSON.parse(assessment.technicalProfile ?? "{}"),
  } as AssessmentInput;
}

function pickChecklist(assessment: AssessmentForEvidence): Checklist | null {
  return assessment.checklists?.[0] ?? null;
}

export function buildAssessmentEvidencePackage(assessment: AssessmentForEvidence) {
  const input = normalizeAssessmentInput(parseAssessmentInput(assessment));
  const results: AssessmentResult[] = runRulesEngine(laws, input);
  const enriched = enrichAssessmentResults(results, input);
  const actionPlan = buildActionPlan(results);
  const penalties = buildPenaltySnapshot(results);
  const sources = buildKeySources(results);
  const preset = getProductPresetById(input.product_preset);
  const checklist = pickChecklist(assessment);
  const checklistItems = checklist?.items ?? [];
  const evidenceArtifacts = checklistItems.flatMap((item) => item.evidenceArtifacts ?? []);
  const completedCount = checklistItems.filter((item) => item.status === "completed").length;
  const inProgressCount = checklistItems.filter((item) => item.status === "in_progress").length;
  const notStartedCount = checklistItems.filter((item) => item.status === "not_started").length;

  const clauseGapReport = buildClauseGapReport(
    results,
    checklistItems.map((item) => ({
      ...item,
      citation: null,
      category: null,
    })),
  );
  const trustScorecard = buildTrustScorecard(
    enriched,
    checklistItems.map((item) => ({
      ...item,
      citation: null,
      category: null,
    })),
  );
  const driftTriggers = buildDriftTriggers({
    createdAt: assessment.createdAt,
    results: enriched,
    checklistItems: checklistItems.map((item) => ({
      ...item,
      citation: null,
      category: null,
    })),
    evidenceArtifacts: checklistItems.flatMap((item) =>
      (item.evidenceArtifacts ?? []).map((artifact) => ({
        ...artifact,
        checklistItemTitle: item.title,
        priority: item.priority,
      })),
    ),
  });
  const analysis = buildComplianceAnalysis(
    input,
    results,
    checklistItems.map((item) => ({
      ...item,
      citation: null,
      category: null,
    })),
  );
  const evidenceCoverage = summarizeEvidenceCoverage(evidenceArtifacts);

  const openCriticalGaps = clauseGapReport.entries
    .filter((entry) => entry.priority === "critical" && entry.status !== "covered")
    .slice(0, 10)
    .map((entry) => ({
      title: entry.obligationTitle,
      lawSlug: entry.lawSlug,
      lawShortTitle: entry.lawShortTitle,
      status: entry.status,
      citation: entry.citation,
    }));

  const issuedAt = new Date().toISOString();
  const payload = {
    branding: {
      productName: "Spanforge Compass",
      productTagline: "AI Compliance Workspace",
      packageType: "assessment_evidence_package",
      packageVersion: "2026.04.24",
    },
    assessment: {
      id: assessment.id,
      name: assessment.name,
      createdAt: assessment.createdAt.toISOString(),
      issuedAt,
      preset: preset?.title ?? "Custom assessment",
      profileSummary: buildProductSummary(input),
      input,
    },
    summary: {
      likelyApplies: enriched.filter((result) => result.applicability_status === "likely_applies").length,
      mayApply: enriched.filter((result) => result.applicability_status === "may_apply").length,
      urgentActions: actionPlan.topUrgentActions.length,
      checklistCompletionPct: checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0,
    },
    analysis: {
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      complianceScore: analysis.complianceScore,
      auditReadinessScore: analysis.auditReadinessScore,
      blockers: analysis.blockers,
      detectedUseCases: analysis.detectedUseCases,
      detectedDataTypes: analysis.detectedDataTypes,
    },
    trustScorecard,
    results: enriched.map((result) => ({
      lawSlug: result.law_slug,
      lawShortTitle: result.law_short_title,
      jurisdiction: result.jurisdiction,
      applicabilityStatus: result.applicability_status,
      relevanceScore: result.relevance_score,
      founderSummary: result.founderSummary,
      whyThisMattersThisWeek: result.whyThisMattersThisWeek,
      firstAction: result.whatToDoFirst,
      lastReviewed: result.lastReviewed,
      sourceUrl: result.sourceUrl,
    })),
    actionPlan: {
      topUrgentActions: actionPlan.topUrgentActions,
      groupedActions: actionPlan.groupedActions,
    },
    checklist: checklist
      ? {
          id: checklist.id,
          title: checklist.title,
          totalItems: checklistItems.length,
          completedCount,
          inProgressCount,
          notStartedCount,
          evidenceArtifacts: evidenceCoverage.total,
          verifiedArtifacts: evidenceCoverage.verified,
        }
      : null,
    evidenceArtifacts: evidenceArtifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      description: artifact.description,
      artifactType: artifact.artifactType,
      sourceType: artifact.sourceType,
      sourceUrl: artifact.sourceUrl,
      status: artifact.status,
      collectedAt: artifact.collectedAt,
      verifiedAt: artifact.verifiedAt,
      expiresAt: artifact.expiresAt,
    })),
    gapReport: {
      obligationCoverage: clauseGapReport.totals,
      lawCoverage: enriched
        .filter((result) => result.applicability_status !== "unlikely")
        .map((result) => {
          const lawEntries = clauseGapReport.entries.filter((entry) => entry.lawSlug === result.law_slug);
          const completed = lawEntries.filter((entry) => entry.status === "covered").length;
          const total = lawEntries.length;
          return {
            lawSlug: result.law_slug,
            lawShortTitle: result.law_short_title,
            status: result.applicability_status,
            completedItems: completed,
            totalItems: total,
            completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        }),
      clauseEntries: clauseGapReport.entries,
      openCriticalGaps,
      summary: clauseGapReport.summary,
    },
    traceability: {
      mappedLaws: analysis.mappedLaws,
      checklistLinkedItems: checklistItems.filter((item) => Boolean(item.lawSlug)).length,
      totalChecklistItems: checklistItems.length,
      evidenceCoverage,
    },
    driftTriggers,
    penalties,
    sources,
  };

  const canonicalJson = JSON.stringify(payload);
  const checksum = createHash("sha256").update(canonicalJson).digest("hex");
  const signingSecret = process.env.EVIDENCE_SIGNING_SECRET ?? "spanforge-compass-dev-signing-key";
  const signature = createHmac("sha256", signingSecret).update(checksum).digest("hex");

  return {
    ...payload,
    attestation: {
      checksumSha256: checksum,
      signatureHmacSha256: signature,
      signedAt: issuedAt,
      signingMode: process.env.EVIDENCE_SIGNING_SECRET ? "configured_secret" : "development_fallback",
    },
  };
}
