import { getLawBySlug, laws } from "@/lib/lexforge-data";
import { getEffectiveEvidenceStatus, type EvidenceArtifactRecord } from "@/lib/evidence-artifacts";
import { runRulesEngine, type AssessmentInput, type AssessmentResult } from "@/lib/rules-engine";
import { enrichAssessmentResults, getFreshnessTone } from "@/lib/smb";

export type ChecklistStatus = "not_started" | "in_progress" | "completed";

export type WorkspaceChecklistItem = {
  id: string;
  lawSlug: string | null;
  title: string;
  citation?: string | null;
  category?: string | null;
  priority?: string | null;
  status: string;
};

export type ClauseGapEntry = {
  lawSlug: string;
  lawShortTitle: string;
  obligationTitle: string;
  citation: string;
  category: string;
  priority: string;
  status: "covered" | "in_progress" | "gap" | "not_generated";
  whyItMatters: string;
};

export type TrustDimensionScore = {
  key: "transparency" | "reliability" | "user_trust" | "security" | "traceability";
  label: string;
  score: number;
  trend: "up" | "flat" | "down";
  explanation: string;
};

export type TrustScorecard = {
  overall: number;
  band: "green" | "amber" | "red";
  dimensions: TrustDimensionScore[];
};

export type DriftTrigger = {
  severity: "high" | "medium" | "low";
  title: string;
  reason: string;
};

export type SimulationDelta = {
  summary: string;
  currentLikely: number;
  candidateLikely: number;
  newLikelyApplies: Array<{ lawSlug: string; lawShortTitle: string }>;
  reducedRisk: Array<{ lawSlug: string; lawShortTitle: string }>;
  changedStatuses: Array<{
    lawSlug: string;
    lawShortTitle: string;
    from: AssessmentResult["applicability_status"];
    to: AssessmentResult["applicability_status"];
  }>;
  candidateResults: ReturnType<typeof enrichAssessmentResults>;
};

function normalizeChecklistStatus(status: string): ClauseGapEntry["status"] {
  if (status === "completed") return "covered";
  if (status === "in_progress") return "in_progress";
  return "gap";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildClauseGapReport(
  results: AssessmentResult[],
  checklistItems: WorkspaceChecklistItem[] = [],
): {
  summary: string;
  entries: ClauseGapEntry[];
  totals: { covered: number; inProgress: number; gaps: number; notGenerated: number };
} {
  const candidateResults = results.filter((result) => result.applicability_status === "likely_applies" || result.applicability_status === "may_apply");

  const entries = candidateResults.flatMap((result) => {
    const law = getLawBySlug(result.law_slug);
    const obligations = result.triggered_obligations.length > 0 ? result.triggered_obligations : law?.obligations ?? [];

    return obligations.map((obligation) => {
      const matchingChecklist = checklistItems.find((item) => item.lawSlug === result.law_slug && item.title === obligation.title);
      return {
        lawSlug: result.law_slug,
        lawShortTitle: result.law_short_title,
        obligationTitle: obligation.title,
        citation: obligation.citation ?? "No citation captured",
        category: obligation.category ?? "General",
        priority: obligation.priority ?? "medium",
        status: matchingChecklist ? normalizeChecklistStatus(matchingChecklist.status) : checklistItems.length > 0 ? "not_generated" : "gap",
        whyItMatters: obligation.action_required ?? obligation.description ?? "Review and document how this obligation is handled.",
      } satisfies ClauseGapEntry;
    });
  });

  const totals = entries.reduce(
    (accumulator, entry) => {
      if (entry.status === "covered") accumulator.covered += 1;
      else if (entry.status === "in_progress") accumulator.inProgress += 1;
      else if (entry.status === "not_generated") accumulator.notGenerated += 1;
      else accumulator.gaps += 1;
      return accumulator;
    },
    { covered: 0, inProgress: 0, gaps: 0, notGenerated: 0 },
  );

  const summary =
    totals.gaps > 0 || totals.notGenerated > 0
      ? `${totals.covered} covered, ${totals.inProgress} in progress, ${totals.gaps} open gaps, ${totals.notGenerated} obligations not yet tracked.`
      : `Coverage is in a strong state: ${totals.covered} covered and ${totals.inProgress} in progress.`;

  return { summary, entries, totals };
}

export function buildTrustScorecard(
  results: ReturnType<typeof enrichAssessmentResults>,
  checklistItems: WorkspaceChecklistItem[] = [],
): TrustScorecard {
  const applicable = results.filter((result) => result.applicability_status !== "unlikely");
  const sourceCoverage = applicable.length > 0 ? applicable.filter((result) => Boolean(result.sourceUrl)).length / applicable.length : 0;
  const freshnessCoverage = applicable.length > 0 ? applicable.filter((result) => result.freshnessTone === "fresh").length / applicable.length : 0;
  const checklistCompletion = checklistItems.length > 0 ? checklistItems.filter((item) => item.status === "completed").length / checklistItems.length : 0;
  const criticalCompletionPool = checklistItems.filter((item) => item.priority === "critical");
  const criticalCompletion = criticalCompletionPool.length > 0 ? criticalCompletionPool.filter((item) => item.status === "completed").length / criticalCompletionPool.length : checklistCompletion;
  const actionability = applicable.length > 0 ? applicable.filter((result) => result.whatToDoFirst.length > 0).length / applicable.length : 0;
  const transparencyScore = clampScore(sourceCoverage * 50 + freshnessCoverage * 50);
  const reliabilityScore = clampScore(criticalCompletion * 60 + actionability * 40);
  const userTrustScore = clampScore(
    applicable.length > 0
      ? (applicable.filter((result) => /Transparency|Consumer Rights|Human Oversight/i.test(result.legalDetails)).length / applicable.length) * 50 + checklistCompletion * 50
      : 60,
  );
  const securityScore = clampScore(
    applicable.length > 0
      ? (applicable.filter((result) => /security|data governance|privacy/i.test(result.legalDetails)).length / applicable.length) * 40 + criticalCompletion * 60
      : 65,
  );
  const traceabilityScore = clampScore((checklistItems.length > 0 ? 50 : 20) + checklistCompletion * 30 + sourceCoverage * 20);

  const dimensions: TrustDimensionScore[] = [
    {
      key: "transparency",
      label: "Transparency",
      score: transparencyScore,
      trend: transparencyScore >= 80 ? "up" : transparencyScore >= 60 ? "flat" : "down",
      explanation: "Based on source coverage and freshness visibility across applicable laws.",
    },
    {
      key: "reliability",
      label: "Reliability",
      score: reliabilityScore,
      trend: reliabilityScore >= 80 ? "up" : reliabilityScore >= 60 ? "flat" : "down",
      explanation: "Based on whether high-priority obligations have concrete first actions and critical work is being closed.",
    },
    {
      key: "user_trust",
      label: "User Trust",
      score: userTrustScore,
      trend: userTrustScore >= 80 ? "up" : userTrustScore >= 60 ? "flat" : "down",
      explanation: "Based on transparency, human-oversight, and consumer-rights readiness.",
    },
    {
      key: "security",
      label: "Security",
      score: securityScore,
      trend: securityScore >= 80 ? "up" : securityScore >= 60 ? "flat" : "down",
      explanation: "Based on security, privacy, and data-governance obligations being addressed.",
    },
    {
      key: "traceability",
      label: "Traceability",
      score: traceabilityScore,
      trend: traceabilityScore >= 80 ? "up" : traceabilityScore >= 60 ? "flat" : "down",
      explanation: "Based on checklist tracking, source linkage, and evidence readiness.",
    },
  ];

  const overall = average(dimensions.map((dimension) => dimension.score));

  return {
    overall,
    band: overall >= 80 ? "green" : overall >= 60 ? "amber" : "red",
    dimensions,
  };
}

export function buildDriftTriggers(params: {
  createdAt: string | Date;
  results: ReturnType<typeof enrichAssessmentResults>;
  checklistItems?: WorkspaceChecklistItem[];
  evidenceArtifacts?: Array<EvidenceArtifactRecord & { checklistItemTitle?: string | null; priority?: string | null }>;
  changelogEntries?: Array<{ lawSlug: string; changedAt: string; summary: string; lawShortTitle?: string }>;
  systemChangeEvents?: Array<{ occurredAt: string; source: string; eventType: string; summary: string; environment?: string | null; recommendation?: string | null }>;
}): DriftTrigger[] {
  const createdAt = typeof params.createdAt === "string" ? new Date(params.createdAt) : params.createdAt;
  const assessmentAgeDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const applicableSlugs = new Set(
    params.results.filter((result) => result.applicability_status !== "unlikely").map((result) => result.law_slug),
  );
  const triggers: DriftTrigger[] = [];

  if (assessmentAgeDays >= 30) {
    triggers.push({
      severity: assessmentAgeDays >= 60 ? "high" : "medium",
      title: "Assessment age drift",
      reason: `This assessment is ${assessmentAgeDays} days old and should be rerun before major launch or sales commitments.`,
    });
  }

  const changedLaw = params.changelogEntries?.find((entry) => applicableSlugs.has(entry.lawSlug) && new Date(entry.changedAt) > createdAt);
  if (changedLaw) {
    triggers.push({
      severity: "high",
      title: "Law-change drift",
      reason: `${changedLaw.lawShortTitle ?? "A matched law"} changed after this assessment: ${changedLaw.summary}`,
    });
  }

  const staleFreshness = params.results.find((result) => getFreshnessTone(result.lastReviewed) === "stale");
  if (staleFreshness) {
    triggers.push({
      severity: "medium",
      title: "Source freshness drift",
      reason: `${staleFreshness.law_short_title} has stale review metadata. Recheck before relying on this output externally.`,
    });
  }

  const openCritical = (params.checklistItems ?? []).find((item) => item.priority === "critical" && item.status !== "completed");
  if (openCritical) {
    triggers.push({
      severity: "medium",
      title: "Execution drift",
      reason: `Critical checklist work is still open: ${openCritical.title}.`,
    });
  }

  const staleEvidence = (params.evidenceArtifacts ?? []).find((artifact) => getEffectiveEvidenceStatus(artifact) === "stale");
  if (staleEvidence) {
    triggers.push({
      severity: staleEvidence.priority === "critical" ? "high" : "medium",
      title: "Evidence freshness drift",
      reason: `Evidence linked to ${staleEvidence.checklistItemTitle ?? "a checklist item"} is stale and should be refreshed before external reliance.`,
    });
  }

  const missingCriticalEvidence = (params.evidenceArtifacts ?? []).length === 0 && openCritical;
  if (missingCriticalEvidence) {
    triggers.push({
      severity: "high",
      title: "Evidence coverage drift",
      reason: `Critical checklist work is open with no linked evidence artifacts: ${openCritical.title}.`,
    });
  }

  const systemChange = params.systemChangeEvents?.find((entry) => new Date(entry.occurredAt) > createdAt);
  if (systemChange) {
    const highImpact = systemChange.environment === "production" || /deploy|release|migration/i.test(systemChange.eventType);
    triggers.push({
      severity: highImpact ? "high" : "medium",
      title: "System-change drift",
      reason: `${systemChange.source} reported ${systemChange.eventType} activity after this assessment: ${systemChange.summary}${systemChange.recommendation ? ` ${systemChange.recommendation}` : ""}`,
    });
  }

  return triggers;
}

function statusRank(status: AssessmentResult["applicability_status"]): number {
  if (status === "likely_applies") return 3;
  if (status === "may_apply") return 2;
  return 1;
}

export function buildSimulationDelta(currentInput: AssessmentInput, candidateInput: AssessmentInput): SimulationDelta {
  const currentResults = runRulesEngine(laws, currentInput);
  return buildSimulationDeltaFromResults(currentInput, candidateInput, currentResults);
}

export function buildSimulationDeltaFromResults(
  _currentInput: AssessmentInput,
  candidateInput: AssessmentInput,
  currentResults: AssessmentResult[],
): SimulationDelta {
  const candidateResultsRaw = runRulesEngine(laws, candidateInput);
  const candidateResults = enrichAssessmentResults(candidateResultsRaw, candidateInput);
  const currentBySlug = new Map(currentResults.map((result) => [result.law_slug, result]));
  const candidateBySlug = new Map(candidateResultsRaw.map((result) => [result.law_slug, result]));

  const changedStatuses = Array.from(candidateBySlug.values())
    .map((candidate) => {
      const current = currentBySlug.get(candidate.law_slug);
      if (!current || current.applicability_status === candidate.applicability_status) return null;
      return {
        lawSlug: candidate.law_slug,
        lawShortTitle: candidate.law_short_title,
        from: current.applicability_status,
        to: candidate.applicability_status,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => statusRank(right.to) - statusRank(left.to));

  const newLikelyApplies = candidateResultsRaw
    .filter((candidate) => candidate.applicability_status === "likely_applies")
    .filter((candidate) => currentBySlug.get(candidate.law_slug)?.applicability_status !== "likely_applies")
    .map((candidate) => ({ lawSlug: candidate.law_slug, lawShortTitle: candidate.law_short_title }));

  const reducedRisk = currentResults
    .filter((current) => current.applicability_status === "likely_applies")
    .filter((current) => candidateBySlug.get(current.law_slug)?.applicability_status !== "likely_applies")
    .map((current) => ({ lawSlug: current.law_slug, lawShortTitle: current.law_short_title }));

  const currentLikely = currentResults.filter((result) => result.applicability_status === "likely_applies").length;
  const candidateLikely = candidateResultsRaw.filter((result) => result.applicability_status === "likely_applies").length;

  const summary =
    changedStatuses.length > 0
      ? `${changedStatuses.length} law statuses would change. ${newLikelyApplies.length} new likely-applicable law${newLikelyApplies.length === 1 ? "" : "s"} would be introduced.`
      : "No major law-scope change would be introduced by this simulation.";

  return {
    summary,
    currentLikely,
    candidateLikely,
    newLikelyApplies,
    reducedRisk,
    changedStatuses,
    candidateResults,
  };
}
