import type { EvidenceArtifact } from "@prisma/client";
import type { AssessmentInput, AssessmentResult } from "@/lib/rules-engine";
import { buildActionPlan, enrichAssessmentResults } from "@/lib/smb";
import { getEffectiveEvidenceStatus, summarizeEvidenceCoverage } from "@/lib/evidence-artifacts";
import { buildClauseGapReport, buildDriftTriggers, buildTrustScorecard, type WorkspaceChecklistItem } from "@/lib/workspace-intelligence";
import { buildChangeImpactBriefs, buildEvidenceRecommendations, buildRegulatoryUpdateBriefs, buildWeeklyPriorityQueue } from "@/lib/product-intelligence";
import { getLawBySlug } from "@/lib/lexforge-data";

type StoredAssessment = {
  id: string;
  name: string | null;
  createdAt: Date;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  results: Array<{
    lawSlug: string;
    relevanceScore: number | null;
    applicabilityStatus: string | null;
    rationale: string | null;
  }>;
  checklists?: Array<{
    id: string;
    items: Array<{
      id: string;
      lawSlug: string | null;
      title: string;
      category: string | null;
      citation: string | null;
      priority: string | null;
      status: string;
      evidenceArtifacts: EvidenceArtifact[];
    }>;
  }>;
};

type StoredChecklist = NonNullable<StoredAssessment["checklists"]>[number];

type ChangelogEntry = {
  id: string;
  lawSlug: string;
  lawShortTitle: string;
  summary: string;
  changedAt: string;
};

type SystemChangeEvent = {
  occurredAt: string;
  source: string;
  eventType: string;
  summary: string;
  environment?: string | null;
  recommendation?: string | null;
};

function parseAssessmentInput(record: StoredAssessment): AssessmentInput {
  return {
    ...JSON.parse(record.companyProfile ?? "{}"),
    ...JSON.parse(record.productProfile ?? "{}"),
    ...JSON.parse(record.technicalProfile ?? "{}"),
  } as AssessmentInput;
}

function mapStoredResults(record: StoredAssessment): AssessmentResult[] {
  return record.results.map((result) => {
    const law = getLawBySlug(result.lawSlug);
    return {
      law_id: result.lawSlug,
      law_slug: result.lawSlug,
      law_title: law?.title ?? result.lawSlug,
      law_short_title: law?.short_title ?? result.lawSlug,
      jurisdiction: law?.jurisdiction ?? "",
      jurisdiction_code: law?.jurisdiction_code ?? "",
      relevance_score: result.relevanceScore ?? 0,
      applicability_status: (result.applicabilityStatus as AssessmentResult["applicability_status"]) ?? "unlikely",
      rationale: result.rationale ?? "",
      triggered_rules: [],
      triggered_obligations: [],
      evaluation_trace: {
        rulesEngineVersion: "stored",
        rules: [],
        score: result.relevanceScore ?? 0,
        totalWeight: 0,
        matchedWeight: 0,
        scoreBreakdown: { matchedRuleCount: 0, totalRuleCount: 0, weightedPercentage: result.relevanceScore ?? 0 },
      },
    };
  });
}

function mapChecklistItems(checklist: StoredChecklist | null): WorkspaceChecklistItem[] {
  if (!checklist) return [];
  return checklist.items.map((item) => ({
    id: item.id,
    lawSlug: item.lawSlug,
    title: item.title,
    citation: item.citation,
    category: item.category,
    priority: item.priority,
    status: item.status,
  }));
}

export function buildAssessmentIntelligence(params: {
  assessment: StoredAssessment;
  changelogEntries: ChangelogEntry[];
  systemChangeEvents?: SystemChangeEvent[];
}) {
  const input = parseAssessmentInput(params.assessment);
  const results = mapStoredResults(params.assessment);
  const enriched = enrichAssessmentResults(results, input);
  const checklist = params.assessment.checklists?.[0] ?? null;
  const checklistItems = mapChecklistItems(checklist);
  const clauseGapReport = buildClauseGapReport(results, checklistItems);
  const trustScorecard = buildTrustScorecard(enriched, checklistItems);
  const evidenceArtifacts = checklist?.items.flatMap((item) =>
    item.evidenceArtifacts.map((artifact) => ({
      ...artifact,
      collectedAt: artifact.collectedAt.toISOString(),
      verifiedAt: artifact.verifiedAt?.toISOString() ?? null,
      expiresAt: artifact.expiresAt?.toISOString() ?? null,
      checklistItemTitle: item.title,
      priority: item.priority,
    })),
  ) ?? [];
  const evidenceCoverage = summarizeEvidenceCoverage(evidenceArtifacts);
  const staleEvidenceCount = evidenceArtifacts.filter((artifact) => getEffectiveEvidenceStatus(artifact) === "stale").length;
  const driftTriggers = buildDriftTriggers({
    createdAt: params.assessment.createdAt,
    results: enriched,
    checklistItems,
    evidenceArtifacts,
    changelogEntries: params.changelogEntries.map((entry) => ({
      lawSlug: entry.lawSlug,
      changedAt: entry.changedAt,
      summary: entry.summary,
      lawShortTitle: entry.lawShortTitle,
    })),
    systemChangeEvents: params.systemChangeEvents,
  });
  const actionPlan = buildActionPlan(results);
  const evidenceRecommendations = buildEvidenceRecommendations(clauseGapReport.entries);
  const weeklyPriorityQueue = buildWeeklyPriorityQueue({
    actionPlanItems: actionPlan.allActions,
    checklistItems,
    driftTriggers,
    evidenceRecommendations,
  });
  const applicableResults = results.filter((result) => result.applicability_status !== "unlikely");
  const changeImpactBriefs = buildChangeImpactBriefs({
    alerts: params.changelogEntries.map((entry) => ({
      id: entry.id,
      lawSlug: entry.lawSlug,
      lawShortTitle: entry.lawShortTitle,
      title: `${entry.lawShortTitle} update`,
      summary: entry.summary,
      changedAt: entry.changedAt,
    })),
    driftTriggers,
    applicableResults,
  });
  const regulatoryUpdateBriefs = buildRegulatoryUpdateBriefs({
    alerts: params.changelogEntries.map((entry) => ({
      id: entry.id,
      lawSlug: entry.lawSlug,
      lawShortTitle: entry.lawShortTitle,
      title: `${entry.lawShortTitle} update`,
      summary: entry.summary,
      changedAt: entry.changedAt,
    })),
    input,
    results: applicableResults,
  });

  return {
    weeklyPriorityQueue,
    changeImpactBriefs,
    regulatoryUpdateBriefs,
    evidenceRecommendations,
    trustScorecard,
    clauseGapReport,
    driftTriggers,
    evidenceCoverage,
    staleEvidenceCount,
  };
}