"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLawBySlug, laws } from "@/lib/lexforge-data";
import { buildAssessmentAssumptions, buildComplianceAnalysis, normalizeAssessmentInput } from "@/lib/compliance-analysis";
import { getEffectiveEvidenceStatus, summarizeEvidenceCoverage } from "@/lib/evidence-artifacts";
import { runRulesEngine, type AssessmentInput, type AssessmentResult } from "@/lib/rules-engine";
import {
  TEMPLATE_LIBRARY,
  buildActionPlan,
  buildAssessmentDiff,
  buildAssessmentDeltaSummary,
  buildExecutiveVerdict,
  buildRecommendedControls,
  enrichAssessmentResults,
  getActionTimelineLabel,
  getObligationDueDateSuggestion,
  getProductPresetById,
  type ActionPlanItem,
  type ExecutiveVerdict,
} from "@/lib/smb";
import {
  buildClauseGapReport,
  buildDriftTriggers,
  buildSimulationDeltaFromResults,
  buildTrustScorecard,
  type ClauseGapEntry,
  type WorkspaceChecklistItem,
} from "@/lib/workspace-intelligence";
import { buildChangeImpactBriefs, buildEvidenceRecommendations, buildRegulatoryUpdateBriefs, buildWeeklyPriorityQueue, type ChangeImpactBrief, type EvidenceRecommendation, type RegulatoryUpdateBrief, type WeeklyPriority } from "@/lib/product-intelligence";

type ChecklistItem = {
  id: string;
  lawSlug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  citation: string | null;
  dueDate: string | null;
  priority: string | null;
  assigneeId?: string | null;
  assignee?: { id: string; name: string | null; email: string | null } | null;
  evidenceArtifacts?: Array<{ id: string; status: string }>;
  status: "not_started" | "in_progress" | "completed";
};

type Checklist = {
  id: string;
  assessmentId: string;
  items: ChecklistItem[];
};

type AssessmentRecord = {
  id: string;
  name: string | null;
  createdAt: string;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  reviewStatus?: string;
  checklists?: Checklist[];
  results: Array<{
    lawSlug: string;
    relevanceScore: number;
    applicabilityStatus: string;
    rationale: string;
  }>;
};

type ChangeEntry = {
  id: string;
  lawSlug: string;
  lawShortTitle: string;
  summary: string;
  changedAt: string;
};

type AssignableMember = { id: string; name: string | null; email: string | null; role: string };

type AssessmentIntelligence = {
  weeklyPriorityQueue: WeeklyPriority[];
  changeImpactBriefs: ChangeImpactBrief[];
  regulatoryUpdateBriefs: RegulatoryUpdateBrief[];
  evidenceRecommendations: EvidenceRecommendation[];
};

const STATUS_CONFIG = {
  likely_applies: { label: "Likely Applies", color: "var(--red)", bg: "rgba(230,57,70,0.1)" },
  may_apply: { label: "May Apply", color: "#915a1e", bg: "rgba(244,162,97,0.18)" },
  unlikely: { label: "Unlikely", color: "var(--green)", bg: "rgba(42,123,98,0.12)" },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#e63946",
  high: "#f4a261",
  medium: "#2b6cb0",
  low: "#2a7b62",
};

const TIMELINE_ORDER = ["this_week", "this_month", "later"] as const;
const TARGET_MARKETS = [
  { code: "EU", label: "European Union" },
  { code: "US", label: "United States" },
  { code: "UK", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "SG", label: "Singapore" },
  { code: "IN", label: "India" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "ES", label: "Spain" },
];
const USE_CASE_OPTIONS = [
  { value: "hr", label: "HR / Recruitment" },
  { value: "credit_scoring", label: "Credit / Lending" },
  { value: "medical", label: "Medical / Healthcare" },
  { value: "biometric", label: "Biometric Identification" },
  { value: "content_generation", label: "Content Generation" },
  { value: "customer_service", label: "Customer Service" },
  { value: "education", label: "Education" },
  { value: "housing", label: "Housing" },
];

function csvEscape(value: string | number | undefined | null): string {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseAssessmentInput(record: AssessmentRecord): AssessmentInput {
  return {
    ...JSON.parse(record.companyProfile ?? "{}"),
    ...JSON.parse(record.productProfile ?? "{}"),
    ...JSON.parse(record.technicalProfile ?? "{}"),
  } as AssessmentInput;
}

function mapStoredResults(record: AssessmentRecord): AssessmentResult[] {
  return record.results.map((result) => {
    const law = getLawBySlug(result.lawSlug);
    return {
      law_id: result.lawSlug,
      law_slug: result.lawSlug,
      law_title: law?.title ?? result.lawSlug,
      law_short_title: law?.short_title ?? result.lawSlug,
      jurisdiction: law?.jurisdiction ?? "",
      jurisdiction_code: law?.jurisdiction_code ?? "",
      relevance_score: result.relevanceScore,
      applicability_status: result.applicabilityStatus as AssessmentResult["applicability_status"],
      rationale: result.rationale,
      triggered_rules: [],
      triggered_obligations: [],
      evaluation_trace: {
        rulesEngineVersion: "stored",
        rules: [],
        score: result.relevanceScore,
        totalWeight: 0,
        matchedWeight: 0,
        scoreBreakdown: { matchedRuleCount: 0, totalRuleCount: 0, weightedPercentage: result.relevanceScore },
      },
    };
  });
}

function exportResultsCsv(results: ReturnType<typeof enrichAssessmentResults>, assessmentId: string) {
  const header = [
    "Law",
    "Status",
    "Summary",
    "Why this matters this week",
    "Who this applies to",
    "Why you matched",
    "What to do first",
    "Last reviewed",
  ];
  const rows = results.map((result) => [
    result.law_short_title,
    result.applicability_status,
    result.plainSummary,
    result.whyThisMattersThisWeek,
    result.whoThisAppliesTo,
    result.whyYouMatched,
    result.whatToDoFirst,
    result.lastReviewed,
  ]);

  downloadCsv(`spanforge-compass-results-${assessmentId}.csv`, [header, ...rows]);
}

function exportActionPlanCsv(actions: ActionPlanItem[], assessmentId: string) {
  const header = ["Timeline", "Urgency", "Owner", "Effort", "Law", "Action", "Why it matters", "Citation"];
  const rows = actions.map((action) => [
    getActionTimelineLabel(action.timeline),
    action.urgency,
    action.owner,
    action.effort,
    action.lawShortTitle,
    action.title,
    action.whyItMatters,
    action.citation,
  ]);

  downloadCsv(`spanforge-compass-action-plan-${assessmentId}.csv`, [header, ...rows]);
}

function mapChecklistItems(checklist: Checklist | null, itemStatuses: Record<string, ChecklistItem["status"]>): WorkspaceChecklistItem[] {
  if (!checklist) return [];

  return checklist.items.map((item) => ({
    id: item.id,
    lawSlug: item.lawSlug,
    title: item.title,
    citation: item.citation,
    category: item.category,
    priority: item.priority,
    status: itemStatuses[item.id] ?? item.status,
  }));
}

function toneColor(status: ClauseGapEntry["status"]) {
  if (status === "covered") return "var(--green)";
  if (status === "in_progress") return "#915a1e";
  if (status === "not_generated") return "#2b6cb0";
  return "var(--red)";
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [input, setInput] = useState<AssessmentInput | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ChecklistItem["status"]>>({});
  const [activeTab, setActiveTab] = useState<"verdict" | "results" | "actions" | "compare" | "checklist" | "gaps" | "simulate">("verdict");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [assessmentRecord, setAssessmentRecord] = useState<AssessmentRecord | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("draft");
  const [previousResults, setPreviousResults] = useState<AssessmentResult[] | null>(null);
  const [founderMode, setFounderMode] = useState(false);
  const [alerts, setAlerts] = useState<ChangeEntry[]>([]);
  const [simulationInput, setSimulationInput] = useState<AssessmentInput | null>(null);
  const [assignableMembers, setAssignableMembers] = useState<AssignableMember[]>([]);
  const [assessmentIntelligence, setAssessmentIntelligence] = useState<AssessmentIntelligence | null>(null);

  useEffect(() => {
    const storedResults = sessionStorage.getItem(`assessment-${id}`);
    const storedInput = sessionStorage.getItem(`assessment-input-${id}`) ?? sessionStorage.getItem("assessment-draft");
    const hasSessionBackedAssessment = Boolean(storedResults || storedInput);

    if (storedInput) {
      const parsedInput = normalizeAssessmentInput(JSON.parse(storedInput) as AssessmentInput);
      setInput(parsedInput);
      setSimulationInput(parsedInput);
      setResults(runRulesEngine(laws, parsedInput));
    } else if (storedResults) {
      setResults(JSON.parse(storedResults) as AssessmentResult[]);
    }

    Promise.all([
      fetch("/api/assessments")
        .then(async (response) => {
          if (!response.ok) return null;
          return response.json();
        })
        .catch(() => null),
      fetch("/api/alerts").then((response) => response.json()).catch(() => ({ data: [] })),
      fetch("/api/organizations").then((response) => response.json()).catch(() => ({ data: [] })),
      fetch(`/api/assessments/${id}/intelligence`).then((response) => (response.ok ? response.json() : { data: null })).catch(() => ({ data: null })),
    ])
      .then(([data, alertsResponse, organizationsResponse, intelligenceResponse]) => {
        const records = ((data?.data ?? []) as AssessmentRecord[]);
        const match = records.find((assessment) => assessment.id === id);

        setAlerts((alertsResponse.data ?? []) as ChangeEntry[]);
        setAssessmentIntelligence((intelligenceResponse.data ?? null) as AssessmentIntelligence | null);
        const members = ((organizationsResponse.data ?? []) as Array<{ members: AssignableMember[] }>).flatMap((organization) => organization.members ?? []);
        setAssignableMembers(Array.from(new Map(members.map((member) => [member.id, member])).values()));

        if (!match) {
          if (!hasSessionBackedAssessment) {
            window.location.href = "/assess";
          }
          return;
        }

        const parsedInput = normalizeAssessmentInput(parseAssessmentInput(match));
        setInput(parsedInput);
        setSimulationInput(parsedInput);
        setResults(runRulesEngine(laws, parsedInput));
        setAssessmentRecord(match);
        setReviewStatus(match.reviewStatus ?? "draft");

        const persistedChecklist = match.checklists?.[0] ?? null;
        setChecklist(persistedChecklist);
        if (persistedChecklist) {
          setItemStatuses(Object.fromEntries(persistedChecklist.items.map((item) => [item.id, item.status])));
        }

        const currentIndex = records.findIndex((assessment) => assessment.id === id);
        const previous = currentIndex >= 0 ? records.slice(currentIndex + 1).find(Boolean) : undefined;
        setPreviousResults(previous ? mapStoredResults(previous) : null);
      })
      .catch(() => {
        if (!hasSessionBackedAssessment) {
          window.location.href = "/assess";
        }
      });
  }, [id]);

  async function generateChecklist() {
    if (!results) return;
    setLoadingChecklist(true);
    const response = await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: id }),
    });
    const data = await response.json();
    setChecklist(data);
    setItemStatuses(Object.fromEntries((data.items ?? []).map((item: ChecklistItem) => [item.id, item.status])));
    setActiveTab("checklist");
    setLoadingChecklist(false);
  }

  function updateChecklistItem(itemId: string, patch: { status?: ChecklistItem["status"]; assigneeId?: string | null; assignee?: ChecklistItem["assignee"] }) {
    if (patch.status) {
      setItemStatuses((current) => ({ ...current, [itemId]: patch.status! }));
    }
    setChecklist((current) => current ? {
      ...current,
      items: current.items.map((item) => item.id === itemId ? {
        ...item,
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.assigneeId !== undefined ? { assigneeId: patch.assigneeId, assignee: patch.assignee ?? null } : {}),
      } : item),
    } : current);

    if (!checklist) return;

    fetch(`/api/checklists/${checklist.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.assigneeId !== undefined ? { assigneeId: patch.assigneeId } : {}),
      }),
    }).catch(() => undefined);
  }

  function updateItemStatus(itemId: string, status: ChecklistItem["status"]) {
    updateChecklistItem(itemId, { status });
  }

  function updateItemAssignee(itemId: string, assigneeId: string) {
    const assignee = assignableMembers.find((member) => member.id === assigneeId) ?? null;
    updateChecklistItem(itemId, {
      assigneeId: assigneeId || null,
      assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
    });
  }

  function updateSimulationField<K extends keyof AssessmentInput>(field: K, value: AssessmentInput[K]) {
    setSimulationInput((current) => (current ? { ...current, [field]: value } : current));
  }

  function toggleSimulationValue(field: "target_markets" | "use_cases", value: string) {
    setSimulationInput((current) => {
      if (!current) return current;
      const existing = current[field];
      const next = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
      return { ...current, [field]: next };
    });
  }

  if (!results || !input) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading results...</p>
        </div>
      </main>
    );
  }

  const enriched = enrichAssessmentResults(results, input);
  const checklistItems = mapChecklistItems(checklist, itemStatuses);
  const actionPlan = buildActionPlan(results);
  const applicable = enriched.filter((result) => result.applicability_status === "likely_applies");
  const mayApply = enriched.filter((result) => result.applicability_status === "may_apply");
  const unlikely = enriched.filter((result) => result.applicability_status === "unlikely");
  const preset = getProductPresetById(input.product_preset);
  const deltaSummary = buildAssessmentDeltaSummary(results, previousResults);
  const assessmentDiff = buildAssessmentDiff(results, previousResults);
  const createdAtLabel = assessmentRecord?.createdAt
    ? new Date(assessmentRecord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const checklistCompleted = checklist ? checklist.items.filter((item) => (itemStatuses[item.id] ?? item.status) === "completed").length : 0;
  const checklistPercent = checklist?.items.length ? Math.round((checklistCompleted / checklist.items.length) * 100) : 0;
  const pendingChecklistCount = checklist ? checklist.items.length - checklistCompleted : 0;
  const trustScorecard = buildTrustScorecard(enriched, checklistItems);
  const clauseGapReport = buildClauseGapReport(results, checklistItems);
  const evidenceArtifacts = checklist?.items.flatMap((item) => item.evidenceArtifacts ?? []) ?? [];
  const evidenceCoverage = summarizeEvidenceCoverage(evidenceArtifacts);
  const staleEvidenceCount = evidenceArtifacts.filter((artifact) => getEffectiveEvidenceStatus(artifact) === "stale").length;
  const driftTriggers = buildDriftTriggers({
    createdAt: assessmentRecord?.createdAt ?? new Date().toISOString(),
    results: enriched,
    checklistItems,
    evidenceArtifacts: (checklist?.items ?? []).flatMap((item) =>
      (item.evidenceArtifacts ?? []).map((artifact) => ({
        ...artifact,
        checklistItemTitle: item.title,
        priority: item.priority,
      })),
    ),
    changelogEntries: alerts.map((entry) => ({
      lawSlug: entry.lawSlug,
      changedAt: entry.changedAt,
      summary: entry.summary,
      lawShortTitle: entry.lawShortTitle,
    })),
  });
  const simulationDelta = simulationInput ? buildSimulationDeltaFromResults(input, simulationInput, results) : null;
  const executiveVerdict = buildExecutiveVerdict(results, input);
  const recommendedControls = buildRecommendedControls(results);
  const analysis = buildComplianceAnalysis(input, results, checklistItems);
  const explicitAssumptions = buildAssessmentAssumptions(input, analysis.normalizedInput);
  const fallbackEvidenceRecommendations = buildEvidenceRecommendations(clauseGapReport.entries);
  const fallbackWeeklyPriorityQueue = buildWeeklyPriorityQueue({
    actionPlanItems: actionPlan.allActions,
    checklistItems,
    driftTriggers,
    evidenceRecommendations: fallbackEvidenceRecommendations,
  });
  const fallbackChangeImpactBriefs = buildChangeImpactBriefs({
    alerts: alerts.map((entry) => ({
      id: entry.id,
      lawSlug: entry.lawSlug,
      lawShortTitle: entry.lawShortTitle,
      title: `${entry.lawShortTitle} update`,
      summary: entry.summary,
      changedAt: entry.changedAt,
    })),
    driftTriggers,
    applicableResults: results.filter((result) => result.applicability_status !== "unlikely"),
  });
  const fallbackRegulatoryUpdateBriefs = buildRegulatoryUpdateBriefs({
    alerts: alerts.map((entry) => ({
      id: entry.id,
      lawSlug: entry.lawSlug,
      lawShortTitle: entry.lawShortTitle,
      title: `${entry.lawShortTitle} update`,
      summary: entry.summary,
      changedAt: entry.changedAt,
    })),
    input,
    results: results.filter((result) => result.applicability_status !== "unlikely"),
  });
  const evidenceRecommendations = assessmentIntelligence?.evidenceRecommendations ?? fallbackEvidenceRecommendations;
  const weeklyPriorityQueue = assessmentIntelligence?.weeklyPriorityQueue ?? fallbackWeeklyPriorityQueue;
  const changeImpactBriefs = assessmentIntelligence?.changeImpactBriefs ?? fallbackChangeImpactBriefs;
  const regulatoryUpdateBriefs = assessmentIntelligence?.regulatoryUpdateBriefs ?? fallbackRegulatoryUpdateBriefs;
  const assessmentAgeDays = assessmentRecord?.createdAt
    ? Math.floor((Date.now() - new Date(assessmentRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isStale = assessmentAgeDays > 30;
  const isGuestAssessment = !assessmentRecord;
  const hasLawChangeSinceAssessment = alerts.some((alert) => {
    const alertDate = new Date(alert.changedAt).getTime();
    const assessmentDate = assessmentRecord?.createdAt ? new Date(assessmentRecord.createdAt).getTime() : 0;
    return alertDate > assessmentDate;
  });

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            className="text-link"
            style={{ fontSize: "0.9rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onClick={() => {
              sessionStorage.removeItem("assessment-draft");
              router.push("/assess");
            }}
          >
            Back to new assessment
          </button>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="button" style={{ fontSize: "0.85rem" }} onClick={() => exportResultsCsv(enriched, id)}>
              Download results CSV
            </button>
            <a href={`/api/assessments/${id}/evidence`} className="button" style={{ fontSize: "0.85rem", textDecoration: "none" }}>
              Download evidence package
            </a>
            <button
              className="button"
              style={{ fontSize: "0.85rem" }}
              onClick={() => exportActionPlanCsv(actionPlan.allActions, id)}
              disabled={actionPlan.allActions.length === 0}
            >
              Download action plan CSV
            </button>
            <div style={{ position: "relative", display: "inline-block" }}>
              <button className="button" style={{ fontSize: "0.85rem" }} onClick={() => setShowExportMenu((v) => !v)}>
                Export PDF ▾
              </button>
              {showExportMenu && (
                <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow)", minWidth: "220px", marginTop: "0.25rem" }}>
                  {[
                    { type: "standard", label: "Full Compliance Report" },
                    { type: "governance", label: "AI Governance Summary" },
                    { type: "applicability", label: "Regulatory Applicability Memo" },
                    { type: "evidence", label: "Evidence Checklist" },
                    { type: "trust", label: "Customer Trust Packet" },
                  ].map(({ type, label }) => (
                    <a
                      key={type}
                      href={`/assess/results/${id}/print?type=${type}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", padding: "0.5rem 0.85rem", fontSize: "0.82rem", color: "var(--text)", textDecoration: "none", borderBottom: "1px solid var(--line)" }}
                      onClick={() => setShowExportMenu(false)}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button className="button" style={{ fontSize: "0.875rem" }} onClick={() => router.push("/assess")}>
              Edit and re-run
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", margin: "1rem 0 0.4rem" }}>
          <h1
            style={{
              margin: 0,
              color: "var(--navy)",
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
            }}
          >
            Your compliance analysis
          </h1>
          {assessmentRecord ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Status
              </label>
              <select
                value={reviewStatus}
                onChange={async (e) => {
                  const next = e.target.value;
                  setReviewStatus(next);
                  await fetch(`/api/assessments/${assessmentRecord.id}/review-status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reviewStatus: next }),
                  });
                }}
                style={{ fontSize: "0.85rem", borderRadius: "10px", padding: "0.3rem 0.65rem" }}
              >
                <option value="draft">Draft</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          ) : null}
        </div>
        <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
          Executive verdict, clause-level gap tracking, trust posture, and drift signals in one working surface.
        </p>

        {checklist ? (
          <section className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.1rem", border: staleEvidenceCount > 0 ? "1px solid rgba(230,57,70,0.16)" : undefined, background: staleEvidenceCount > 0 ? "rgba(230,57,70,0.04)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Evidence drift
                </p>
                <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
                  {evidenceCoverage.verified}/{evidenceCoverage.total} verified artifacts
                </h2>
                <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                  {staleEvidenceCount > 0
                    ? `${staleEvidenceCount} evidence artifact${staleEvidenceCount === 1 ? "" : "s"} are stale. Refresh them before relying on this package externally.`
                    : evidenceCoverage.total > 0
                      ? `${evidenceCoverage.active} linked artifact${evidenceCoverage.active === 1 ? "" : "s"} support this assessment's task layer.`
                      : "No evidence has been attached yet. Add evidence to improve audit readiness and reduce drift risk."}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <Link href="/evidence" className="button button--primary">Open evidence workspace</Link>
                <a href={`/api/assessments/${id}/evidence`} className="button" style={{ textDecoration: "none" }}>Export evidence JSON</a>
              </div>
            </div>
          </section>
        ) : null}

        <section className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Classification engine
              </p>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                {analysis.riskLevel === "unacceptable" ? "Potentially unacceptable" : `${analysis.riskLevel} risk`} system
              </h2>
              <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                {analysis.systemSummary}
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {analysis.detectedUseCases.map((useCase) => (
                  <Pill key={useCase} label={useCase.replace(/_/g, " ")} />
                ))}
                {analysis.detectedDataTypes.map((dataType) => (
                  <Pill key={dataType} label={dataType.replace(/_/g, " ")} color="#2b6cb0" />
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(120px, 1fr))", gap: "0.75rem", minWidth: "280px" }}>
              <MiniMetric label="Risk score" value={analysis.riskScore} color={analysis.riskLevel === "high" || analysis.riskLevel === "unacceptable" ? "var(--red)" : "#915a1e"} />
              <MiniMetric label="Compliance score" value={analysis.complianceScore} color={analysis.complianceScore >= 75 ? "var(--green)" : analysis.complianceScore >= 55 ? "#915a1e" : "var(--red)"} />
              <MiniMetric label="Audit readiness" value={analysis.auditReadinessScore} color={analysis.auditReadinessScore >= 75 ? "var(--green)" : analysis.auditReadinessScore >= 55 ? "#915a1e" : "var(--red)"} />
              <MiniMetric label="Blockers" value={analysis.blockers.length} color={analysis.blockers.length === 0 ? "var(--green)" : "var(--red)"} />
            </div>
          </div>
          {analysis.mappedLaws.length > 0 ? (
            <div style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}>
              {analysis.mappedLaws.slice(0, 3).map((law) => (
                <div key={law.lawSlug} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--navy)" }}>{law.lawShortTitle}</strong>
                    <Pill label={law.status.replace(/_/g, " ")} color={law.status === "likely_applies" ? "var(--red)" : "#915a1e"} />
                  </div>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{law.reason}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ marginTop: "1rem", padding: "0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
              Assessment assumptions
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--navy)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {explicitAssumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
          {analysis.blockers.length > 0 ? (
            <div style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}>
              {analysis.blockers.map((blocker) => (
                <div key={blocker.title} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(230,57,70,0.06)", border: "1px solid rgba(230,57,70,0.14)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Pill label={blocker.severity} color="var(--red)" />
                    <strong style={{ color: "var(--navy)" }}>{blocker.title}</strong>
                  </div>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>{blocker.reason}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {(isStale || hasLawChangeSinceAssessment) ? (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "1rem 1.15rem",
              borderRadius: "var(--radius)",
              background: isStale ? "rgba(244,162,97,0.12)" : "rgba(230,57,70,0.08)",
              border: `1px solid ${isStale ? "rgba(244,162,97,0.3)" : "rgba(230,57,70,0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: "0 0 0.2rem", fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>
                {isStale && hasLawChangeSinceAssessment
                  ? `Assessment is ${assessmentAgeDays} days old and tracked laws have changed`
                  : isStale
                    ? `Assessment is ${assessmentAgeDays} days old — consider a reassessment`
                    : "Tracked laws have changed since this assessment was run"}
              </p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                {isStale
                  ? "Conclusions may be stale if your product profile or regulatory landscape has shifted."
                  : "Some conclusions from this run may no longer reflect the current state of the law."}
              </p>
            </div>
            <button
              className="button"
              style={{ flexShrink: 0 }}
              onClick={() => {
                if (input) {
                  sessionStorage.setItem("assessment-draft", JSON.stringify(input));
                }
                router.push("/assess");
              }}
            >
              Re-run assessment →
            </button>
          </div>
        ) : null}

        <div className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Founder summary mode
              </p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", maxWidth: "60ch" }}>
                Switch to a tighter founder view when you want the shortest explanation of what matters now.
              </p>
            </div>
            <button className={`button ${founderMode ? "button--primary" : ""}`} onClick={() => setFounderMode((current) => !current)}>
              {founderMode ? "Founder mode on" : "Switch to founder mode"}
            </button>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: "1.25rem" }}>
          <div className="stat-card">
            <strong style={{ color: "var(--red)" }}>{applicable.length}</strong>
            <span>Likely applies</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "#915a1e" }}>{mayApply.length}</strong>
            <span>May apply</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--navy)" }}>{actionPlan.topUrgentActions.length}</strong>
            <span>Top urgent actions</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: toneColor(clauseGapReport.totals.gaps > 0 ? "gap" : "covered") }}>{clauseGapReport.totals.gaps}</strong>
            <span>Open obligation gaps</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: trustScorecard.band === "green" ? "var(--green)" : trustScorecard.band === "amber" ? "#915a1e" : "var(--red)" }}>
              {trustScorecard.overall}
            </strong>
            <span>Trust score</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          <div className="content-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Assessment snapshot
                </p>
                <h2 style={{ margin: "0.45rem 0 0.2rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                  {preset?.title ?? "Custom assessment"}
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                  {createdAtLabel ? `Run on ${createdAtLabel} · ` : ""}
                  {input.target_markets.length ? `Markets: ${input.target_markets.join(", ")}` : "Markets not specified"} ·{" "}
                  {input.use_cases.length ? `Use cases: ${input.use_cases.join(", ")}` : "Use cases not specified"}
                </p>
              </div>
              <div style={{ minWidth: "260px", flex: 1 }}>
                <p style={{ margin: "0 0 0.4rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Top 3 urgent actions
                </p>
                {actionPlan.topUrgentActions.length > 0 ? (
                  <div className="stack">
                    {actionPlan.topUrgentActions.map((action) => (
                      <div key={action.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem" }}>
                        <span style={{ width: "1.25rem", fontWeight: 700, color: "var(--navy)" }}>•</span>
                        <span style={{ color: "var(--navy)" }}>{action.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>No action items were generated from this assessment.</p>
                )}
              </div>
            </div>
          </div>

          <div className="content-card">
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Trust scorecard
            </p>
            <h2 style={{ margin: "0 0 0.35rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
              {trustScorecard.overall}/100 overall
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
              {trustScorecard.band === "green"
                ? "Your evidence, execution, and source posture are in a strong state."
                : trustScorecard.band === "amber"
                  ? "You have a workable baseline, but some trust dimensions still need operating proof."
                  : "This profile needs stronger evidence, tracking, and control coverage before external reliance."}
            </p>
            <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.95rem" }}>
              {trustScorecard.dimensions.map((dimension) => (
                <div key={dimension.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--navy)" }}>{dimension.label}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{dimension.score}</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "rgba(16,32,48,0.08)", overflow: "hidden" }}>
                    <div style={{ width: `${dimension.score}%`, height: "100%", background: dimension.score >= 80 ? "var(--green)" : dimension.score >= 60 ? "#f4a261" : "var(--red)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
          {deltaSummary ? (
            <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                What changed since your last assessment
              </p>
              <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.94rem", lineHeight: 1.6 }}>{deltaSummary.summary}</p>
            </div>
          ) : null}
          {checklist ? (
            <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Resume from where you left off
              </p>
              <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.94rem", lineHeight: 1.6 }}>
                Your checklist is {checklistPercent}% complete. Continue the remaining {pendingChecklistCount} task{pendingChecklistCount === 1 ? "" : "s"}.
              </p>
              <button className="button" style={{ marginTop: "0.85rem" }} onClick={() => setActiveTab("checklist")}>
                Open checklist
              </button>
            </div>
          ) : null}
          <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Drift-triggered reassessment
            </p>
            <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.94rem", lineHeight: 1.6 }}>
              {driftTriggers.length > 0
                ? `${driftTriggers.length} trigger${driftTriggers.length === 1 ? "" : "s"} currently suggest this profile should be rerun or reviewed.`
                : "No active drift triggers right now. This assessment is relatively stable."}
            </p>
            <button className="button" style={{ marginTop: "0.85rem" }} onClick={() => setActiveTab("simulate")}>
              Run what-if simulation
            </button>
          </div>
        </div>

        {weeklyPriorityQueue.length > 0 ? (
          <div className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.15rem" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Operator queue
            </p>
            <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
              What to do this week
            </h2>
            <div className="stack" style={{ marginTop: "0.9rem" }}>
              {weeklyPriorityQueue.slice(0, 5).map((item) => (
                <div key={item.id} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                    <strong style={{ color: "var(--navy)" }}>{item.title}</strong>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: "999px", background: item.urgency === "high" ? "rgba(230,57,70,0.1)" : item.urgency === "medium" ? "rgba(244,162,97,0.14)" : "rgba(42,123,98,0.12)", color: item.urgency === "high" ? "var(--red)" : item.urgency === "medium" ? "#915a1e" : "var(--green)" }}>
                      {item.urgency}
                    </span>
                  </div>
                  <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{item.reason}</p>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.8rem" }}>Owner: {item.owner}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {driftTriggers.length > 0 ? (
          <div className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.15rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Drift engine
            </p>
            <div className="stack">
              {driftTriggers.map((trigger) => (
                <div key={`${trigger.title}-${trigger.reason}`} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                    <Pill label={trigger.severity} color={trigger.severity === "high" ? "var(--red)" : trigger.severity === "medium" ? "#915a1e" : "var(--green)"} />
                    <strong style={{ color: "var(--navy)" }}>{trigger.title}</strong>
                  </div>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>{trigger.reason}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(changeImpactBriefs.length > 0 || regulatoryUpdateBriefs.length > 0) ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="content-card" style={{ padding: "1rem 1.15rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Continuous monitoring
              </p>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
                Change impact briefs
              </h2>
              <div className="stack" style={{ marginTop: "0.9rem" }}>
                {changeImpactBriefs.slice(0, 4).map((brief) => (
                  <div key={brief.id} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--navy)" }}>{brief.headline}</strong>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: "999px", background: brief.severity === "high" ? "rgba(230,57,70,0.1)" : brief.severity === "medium" ? "rgba(244,162,97,0.14)" : "rgba(42,123,98,0.12)", color: brief.severity === "high" ? "var(--red)" : brief.severity === "medium" ? "#915a1e" : "var(--green)" }}>
                        {brief.severity}
                      </span>
                    </div>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{brief.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-card" style={{ padding: "1rem 1.15rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Jurisdiction updates
              </p>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
                What changed and what to update
              </h2>
              <div className="stack" style={{ marginTop: "0.9rem" }}>
                {regulatoryUpdateBriefs.length > 0 ? regulatoryUpdateBriefs.slice(0, 4).map((brief) => (
                  <div key={brief.id} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                    <strong style={{ color: "var(--navy)", display: "block" }}>{brief.headline}</strong>
                    <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{brief.whyItMatters}</p>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--navy)", fontSize: "0.82rem" }}>{brief.nextStep}</p>
                  </div>
                )) : <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>No tracked law updates are currently in scope for this assessment.</p>}
              </div>
            </div>
          </div>
        ) : null}

        <div className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.15rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Trust and limits
              </p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55, maxWidth: "60ch" }}>
                This assessment is a first-pass compliance triage for startups and SMBs. It prioritizes likely law exposure and next actions,
                but it is not legal advice and should be reviewed before high-stakes launch or procurement decisions.
              </p>
            </div>
            <Link href="/methodology" className="button">
              Read methodology
            </Link>
          </div>
          <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid rgba(16,32,48,0.08)" }}>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>
              Need something you can hand to counsel, procurement, or a customer reviewer? Export the evidence package to capture matched laws,
              clause coverage, actions, checklist state, sources, trust posture, drift triggers, and attestation metadata in one file.
            </p>
            {isGuestAssessment ? (
              <p style={{ margin: "0.6rem 0 0", color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                This run is currently stored as a guest assessment on this device. Sign in before your next run if you want dashboard history, shared workspaces, and saved checklist progress.
              </p>
            ) : null}
          </div>
        </div>

        <div className="subnav" style={{ marginBottom: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button className={`button ${activeTab === "verdict" ? "button--primary" : ""}`} onClick={() => setActiveTab("verdict")}>
            Executive verdict
          </button>
          <button className={`button ${activeTab === "results" ? "button--primary" : ""}`} onClick={() => setActiveTab("results")}>
            Results ({enriched.length})
          </button>
          <button className={`button ${activeTab === "actions" ? "button--primary" : ""}`} onClick={() => setActiveTab("actions")}>
            Action Plan ({actionPlan.allActions.length})
          </button>
          {previousResults ? (
            <button className={`button ${activeTab === "compare" ? "button--primary" : ""}`} onClick={() => setActiveTab("compare")}>
              Compare ({assessmentDiff.length})
            </button>
          ) : null}
          <button className={`button ${activeTab === "gaps" ? "button--primary" : ""}`} onClick={() => setActiveTab("gaps")}>
            Gap report ({clauseGapReport.totals.gaps + clauseGapReport.totals.notGenerated})
          </button>
          <button className={`button ${activeTab === "simulate" ? "button--primary" : ""}`} onClick={() => setActiveTab("simulate")}>
            What-if simulator
          </button>
          <button
            className={`button ${activeTab === "checklist" ? "button--primary" : ""}`}
            onClick={() => {
              if (isGuestAssessment) {
                return;
              }
              if (!checklist) {
                generateChecklist();
              } else {
                setActiveTab("checklist");
              }
            }}
            disabled={loadingChecklist || isGuestAssessment}
          >
            {isGuestAssessment ? "Sign in to save checklist" : loadingChecklist ? "Generating..." : checklist ? `Checklist (${checklist.items.length})` : "Generate checklist"}
          </button>
        </div>

        {activeTab === "verdict" ? (
          <ExecutiveVerdictView
            verdict={executiveVerdict}
            applicable={applicable}
            mayApply={mayApply}
            actionPlan={actionPlan}
            recommendedControls={recommendedControls}
            onRunAssessment={() => {
              if (input) sessionStorage.setItem("assessment-draft", JSON.stringify(input));
              router.push("/assess");
            }}
          />
        ) : null}

        {activeTab === "results" ? (
          <div className="stack">
            {enriched.map((result) => {
              const config = STATUS_CONFIG[result.applicability_status];
              const law = getLawBySlug(result.law_slug);
              const lawCoverage = clauseGapReport.entries.filter((entry) => entry.lawSlug === result.law_slug);
              const lawCovered = lawCoverage.filter((entry) => entry.status === "covered").length;
              const freshnessStyles =
                result.freshnessTone === "fresh"
                  ? { background: "rgba(42,123,98,0.12)", color: "var(--green)" }
                  : result.freshnessTone === "aging"
                    ? { background: "rgba(244,162,97,0.18)", color: "#915a1e" }
                    : { background: "rgba(230,57,70,0.1)", color: "var(--red)" };

              return (
                <div key={result.law_id} className="content-card">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                        <span className="micro">{result.jurisdiction}</span>
                        <span style={{ display: "inline-flex", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, background: config.bg, color: config.color }}>
                          {config.label}
                        </span>
                        <span style={{ display: "inline-flex", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, ...freshnessStyles }}>
                          Last reviewed {result.lastReviewed}
                        </span>
                        {lawCoverage.length > 0 ? (
                          <span style={{ display: "inline-flex", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, background: "rgba(16,32,48,0.06)", color: "var(--navy)" }}>
                            Clause coverage {lawCovered}/{lawCoverage.length}
                          </span>
                        ) : null}
                      </div>
                      <h3 style={{ margin: "0.5rem 0 0.35rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
                        {result.law_short_title}
                      </h3>
                      <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                        {founderMode ? result.founderSummary : result.plainSummary}
                      </p>

                      {result.applicability_status !== "unlikely" ? (
                        <>
                          <div style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
                            <ResultLabel title="Why this matters this week" body={result.whyThisMattersThisWeek} />
                            <ResultLabel title="Who this applies to" body={result.whoThisAppliesTo} />
                            <ResultLabel title={founderMode ? "Why it matched" : "Why you matched"} body={result.whyYouMatched} />
                            <ResultLabel title={founderMode ? "First move" : "What to do first"} body={result.whatToDoFirst} />
                          </div>
                          <p style={{ margin: "0.8rem 0 0", color: "var(--muted)", fontSize: "0.84rem" }}>{result.freshnessLabel}</p>
                          {lawCoverage.length > 0 ? (
                            <div style={{ marginTop: "0.9rem", padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                              <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                                Clause-level gap view
                              </p>
                              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                                {lawCovered} covered, {lawCoverage.filter((entry) => entry.status === "in_progress").length} in progress,{" "}
                                {lawCoverage.filter((entry) => entry.status === "gap" || entry.status === "not_generated").length} still need tracking or evidence.
                              </p>
                            </div>
                          ) : null}
                          <details style={{ marginTop: "1rem" }}>
                            <summary style={{ cursor: "pointer", color: "var(--navy)", fontWeight: 700 }}>Show legal details</summary>
                            <div style={{ marginTop: "0.75rem", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                              <p style={{ marginTop: 0 }}>{result.legalDetails}</p>
                              {result.triggered_obligations.length > 0 ? (
                                <div className="stack">
                                  {result.triggered_obligations.slice(0, 3).map((obligation) => (
                                    <div key={obligation.id} style={{ padding: "0.75rem 0.9rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: "999px", background: `${PRIORITY_COLORS[obligation.priority]}22`, color: PRIORITY_COLORS[obligation.priority] }}>
                                          {obligation.priority}
                                        </span>
                                        <span style={{ fontSize: "0.78rem" }}>{obligation.category}</span>
                                        <span style={{ fontSize: "0.78rem", marginLeft: "auto" }}>{obligation.citation}</span>
                                      </div>
                                      <strong style={{ color: "var(--navy)" }}>{obligation.title}</strong>
                                      <p style={{ marginBottom: 0 }}>{obligation.action_required}</p>
                                      {obligation.spanforge_controls && obligation.spanforge_controls.length > 0 ? (
                                        <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                          {obligation.spanforge_controls.map((ctrl) => (
                                            <span key={ctrl} style={{ fontSize: "0.7rem", padding: "0.12rem 0.45rem", borderRadius: "999px", background: "var(--primary-light, #e8f0fe)", color: "var(--navy)", border: "1px solid var(--primary, #1a56db)", fontWeight: 600 }}>
                                              {ctrl}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </details>
                          {/* WS11: Evaluation trace panel */}
                          {(() => {
                            const trace = results?.find((r) => r.law_slug === result.law_slug)?.evaluation_trace;
                            if (!trace) return null;
                            const matchedRules = trace.rules.filter((r) => r.matched);
                            const missedRules = trace.rules.filter((r) => !r.matched);
                            const pct = Math.round(trace.scoreBreakdown.weightedPercentage ?? 0);
                            return (
                              <details style={{ marginTop: "0.6rem" }}>
                                <summary style={{ cursor: "pointer", color: "var(--muted)", fontWeight: 600, fontSize: "0.9rem" }}>
                                  Scoring trace · {pct}% match · v{trace.rulesEngineVersion}
                                </summary>
                                <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", lineHeight: 1.6 }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.65rem", marginBottom: "0.8rem" }}>
                                    <TraceMetric label="Matched weight" value={`${trace.matchedWeight}/${trace.totalWeight}`} />
                                    <TraceMetric label="Matched rules" value={`${trace.scoreBreakdown.matchedRuleCount}/${trace.scoreBreakdown.totalRuleCount}`} />
                                    <TraceMetric label="Weighted score" value={`${Math.round(trace.score * 100)}%`} />
                                  </div>
                                  {matchedRules.length > 0 && (
                                    <div style={{ marginBottom: "0.6rem" }}>
                                      <p style={{ margin: "0 0 0.35rem", fontWeight: 700, color: "var(--green)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        ✓ Matched rules ({matchedRules.length})
                                      </p>
                                      <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--navy)" }}>
                                        {matchedRules.map((r) => (
                                          <li key={r.ruleId}>{r.ruleId.replace(/_/g, " ")} <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>(weight {r.weight})</span></li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {missedRules.length > 0 && (
                                    <div>
                                      <p style={{ margin: "0 0 0.35rem", fontWeight: 700, color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        — Not matched ({missedRules.length})
                                      </p>
                                      <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--muted)" }}>
                                        {missedRules.map((r) => (
                                          <li key={r.ruleId}>{r.ruleId.replace(/_/g, " ")} <span style={{ fontSize: "0.78rem" }}>(weight {r.weight})</span></li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.78rem" }}>
                                    Weighted score: {trace.score.toFixed(2)} / {trace.totalWeight} · {pct}%
                                  </p>
                                </div>
                              </details>
                            );
                          })()}
                        </>
                      ) : (
                        <p style={{ margin: "0.9rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{result.rationale}</p>
                      )}

                      <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                        <Link href={`/laws/${result.law_slug}`} className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}>
                          View law
                        </Link>
                        {law?.official_url ? (
                          <a href={law.official_url} target="_blank" rel="noopener noreferrer" className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem", textDecoration: "none" }}>
                            Official source
                          </a>
                        ) : null}
                        <button className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }} onClick={() => router.push("/assess")}>
                          Reassess this profile
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: "60px" }}>
                      <strong style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "var(--navy)", lineHeight: 1 }}>
                        {Math.round(result.relevance_score * 100)}%
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>relevance</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="content-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                    Template library
                  </p>
                  <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>Download starter templates for your team</h3>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                    Policies, notices, and checklists to help you operationalize the next steps.
                  </p>
                </div>
                <Link href="/templates" className="button button--primary">
                  Open templates
                </Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                {TEMPLATE_LIBRARY.slice(0, 3).map((template) => (
                  <div key={template.slug} style={{ padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.08)" }}>
                    <strong style={{ color: "var(--navy)" }}>{template.title}</strong>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>{template.useCase}</p>
                    <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", fontSize: "0.78rem" }}>Last reviewed {template.lastReviewed}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "actions" ? <ActionPlanView actions={actionPlan.allActions} evidenceRecommendations={evidenceRecommendations} /> : null}
        {activeTab === "compare" ? <AssessmentComparisonView deltaSummary={deltaSummary} diffEntries={assessmentDiff} /> : null}
        {activeTab === "gaps" ? <GapReportView report={clauseGapReport} /> : null}
        {activeTab === "simulate" ? (
          <SimulationView input={simulationInput} delta={simulationDelta} onChangeField={updateSimulationField} onToggleValue={toggleSimulationValue} />
        ) : null}
        {activeTab === "checklist" && checklist ? (
          <ChecklistView checklist={checklist} itemStatuses={itemStatuses} onUpdateStatus={updateItemStatus} onAssignAssignee={updateItemAssignee} assignableMembers={assignableMembers} />
        ) : null}
      </div>
    </main>
  );
}

function TraceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.6rem 0.7rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <p style={{ margin: "0 0 0.18rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: "var(--navy)", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function ResultLabel({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "0.8rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
        {title}
      </p>
      <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem", lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

function ExecutiveVerdictView({
  verdict,
  applicable,
  mayApply,
  actionPlan,
  recommendedControls,
  onRunAssessment,
}: {
  verdict: ExecutiveVerdict;
  applicable: ReturnType<typeof enrichAssessmentResults>;
  mayApply: ReturnType<typeof enrichAssessmentResults>;
  actionPlan: ReturnType<typeof buildActionPlan>;
  recommendedControls: ReturnType<typeof buildRecommendedControls>;
  onRunAssessment: () => void;
}) {
  const verdictColor =
    verdict.status === "proceed" ? "var(--green)" :
    verdict.status === "action_required" ? "#915a1e" :
    "var(--red)";
  const verdictBg =
    verdict.status === "proceed" ? "rgba(42,123,98,0.07)" :
    verdict.status === "action_required" ? "rgba(244,162,97,0.08)" :
    "rgba(230,57,70,0.07)";

  return (
    <div className="stack">
      <div className="content-card" style={{ background: verdictBg, border: `1px solid ${verdictColor}33` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "0.2rem 0.6rem", borderRadius: "999px", background: `${verdictColor}22`, color: verdictColor }}>
                {verdict.label}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Executive verdict</span>
            </div>
            <h2 style={{ margin: "0 0 0.6rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem", lineHeight: 1.15 }}>
              {verdict.headline}
            </h2>
            <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.95rem", lineHeight: 1.65, maxWidth: "72ch" }}>
              {verdict.summary}
            </p>
          </div>
          <button className="button" onClick={onRunAssessment} style={{ flexShrink: 0 }}>
            Re-run assessment
          </button>
        </div>

        {verdict.ownerRecommendation ? (
          <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: `1px solid ${verdictColor}22` }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Recommended owner
            </span>
            <p style={{ margin: "0.2rem 0 0", color: "var(--navy)", fontSize: "0.92rem", fontWeight: 600 }}>
              {verdict.ownerRecommendation}
            </p>
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        <div className="content-card">
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Top risks identified
          </p>
          {verdict.topRisks.length > 0 ? (
            <div className="stack">
              {verdict.topRisks.map((risk, index) => (
                <div key={index} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                  <span style={{ width: "1.4rem", height: "1.4rem", borderRadius: "999px", background: "rgba(230,57,70,0.1)", color: "var(--red)", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.05rem" }}>{index + 1}</span>
                  <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem", lineHeight: 1.5 }}>{risk}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>No significant risks identified for this profile.</p>
          )}
        </div>

        <div className="content-card">
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Immediate actions required
          </p>
          {verdict.immediateActions.length > 0 ? (
            <div className="stack">
              {verdict.immediateActions.map((action, index) => (
                <div key={index} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                  <span style={{ width: "1.4rem", height: "1.4rem", borderRadius: "999px", background: "rgba(244,162,97,0.12)", color: "#915a1e", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.05rem" }}>{index + 1}</span>
                  <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem", lineHeight: 1.5 }}>{action}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>No immediate actions flagged for this profile.</p>
          )}
        </div>
      </div>

      {applicable.length > 0 ? (
        <div className="content-card">
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Applicable regimes — why they apply
          </p>
          <div className="stack">
            {applicable.concat(mayApply).slice(0, 5).map((result) => (
              <div key={result.law_id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "start", padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.03)", border: "1px solid rgba(16,32,48,0.07)" }}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", background: result.applicability_status === "likely_applies" ? "rgba(230,57,70,0.1)" : "rgba(244,162,97,0.12)", color: result.applicability_status === "likely_applies" ? "var(--red)" : "#915a1e" }}>
                      {result.applicability_status === "likely_applies" ? "Likely applies" : "May apply"}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{result.jurisdiction}</span>
                  </div>
                  <strong style={{ color: "var(--navy)", fontSize: "0.95rem" }}>{result.law_short_title}</strong>
                  <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{result.whyYouMatched}</p>
                  {result.triggered_obligations.slice(0, 2).map((ob) => (
                    <div key={ob.id} style={{ marginTop: "0.5rem", display: "flex", gap: "0.45rem", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: PRIORITY_COLORS[ob.priority] ?? "var(--navy)" }}>{ob.priority.toUpperCase()}</span>
                      <span style={{ fontSize: "0.84rem", color: "var(--navy)" }}>{ob.title}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginLeft: "auto" }}>{getObligationDueDateSuggestion(ob.priority)}</span>
                    </div>
                  ))}
                </div>
                <strong style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--navy)", textAlign: "right" }}>
                  {Math.round(result.relevance_score * 100)}%
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recommendedControls.length > 0 ? (
        <div className="content-card">
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Recommended technical controls
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.85rem" }}>
            {recommendedControls.map((group) => (
              <div key={group.category} style={{ padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.08)" }}>
                <p style={{ margin: "0 0 0.45rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {group.category}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {group.controls.map((control) => (
                    <div key={control} style={{ display: "flex", gap: "0.45rem", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--green)", fontWeight: 700, lineHeight: 1.4 }}>✓</span>
                      <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.88rem", lineHeight: 1.45 }}>{control}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="content-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "var(--navy)" }}>Ready to hand this to procurement or counsel?</p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Export the evidence package to get matched laws, clause coverage, trust posture, drift triggers, and attestation metadata in one file.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/templates" className="button">Browse export templates</Link>
        </div>
      </div>
    </div>
  );
}

function AssessmentComparisonView({
  deltaSummary,
  diffEntries,
}: {
  deltaSummary: ReturnType<typeof buildAssessmentDeltaSummary> | null;
  diffEntries: ReturnType<typeof buildAssessmentDiff>;
}) {
  const tone = (changeType: ReturnType<typeof buildAssessmentDiff>[number]["changeType"]) => {
    if (changeType === "new" || changeType === "increased") {
      return { color: "var(--red)", background: "rgba(230,57,70,0.1)", label: changeType === "new" ? "New" : "Increased" };
    }
    return { color: "var(--green)", background: "rgba(42,123,98,0.12)", label: changeType === "reduced" ? "Removed" : "Decreased" };
  };

  if (!deltaSummary && diffEntries.length === 0) {
    return (
      <div className="content-card">
        <p style={{ margin: 0, color: "var(--muted)" }}>No previous assessment is available for comparison yet.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {deltaSummary ? (
        <div className="content-card">
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Comparison summary
          </p>
          <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.95rem", lineHeight: 1.6 }}>{deltaSummary.summary}</p>
        </div>
      ) : null}

      <div className="content-card">
        <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
          Law-by-law diff
        </p>
        {diffEntries.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>No material law shifts were detected against the previous saved assessment.</p>
        ) : (
          <div className="stack">
            {diffEntries.map((entry) => {
              const config = tone(entry.changeType);
              return (
                <div key={entry.lawSlug} style={{ padding: "0.9rem 1rem", borderRadius: "14px", border: "1px solid rgba(16,32,48,0.08)", background: "rgba(16,32,48,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                    <strong style={{ color: "var(--navy)" }}>{entry.lawShortTitle}</strong>
                    <span style={{ display: "inline-flex", padding: "0.22rem 0.6rem", borderRadius: "999px", fontSize: "0.76rem", fontWeight: 700, color: config.color, background: config.background }}>
                      {config.label}
                    </span>
                  </div>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>
                    Status moved from {entry.previousStatus.replace(/_/g, " ")} to {entry.currentStatus.replace(/_/g, " ")}.
                    Score changed from {Math.round(entry.previousScore * 100)}% to {Math.round(entry.currentScore * 100)}%.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getSuggestedActionDueDate(timeline: ActionPlanItem["timeline"]) {
  if (timeline === "this_week") return "Within 7 days";
  if (timeline === "this_month") return "Within 30 days";
  return "Next quarter";
}

function ActionPlanView({ actions, evidenceRecommendations }: { actions: ActionPlanItem[]; evidenceRecommendations: EvidenceRecommendation[] }) {
  if (actions.length === 0) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
        <p>No action plan items were generated for this assessment.</p>
      </div>
    );
  }

  const grouped = TIMELINE_ORDER.reduce<Record<string, ActionPlanItem[]>>((accumulator, timeline) => {
    const matching = actions.filter((action) => action.timeline === timeline);
    if (matching.length > 0) {
      accumulator[timeline] = matching;
    }
    return accumulator;
  }, {});

  return (
    <div className="stack">
      {TIMELINE_ORDER.map((timeline) => {
        const items = grouped[timeline];
        if (!items) return null;

        return (
          <section key={timeline}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>{getActionTimelineLabel(timeline)}</h2>
              <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{items.length} action{items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="stack">
              {items.map((action) => (
                <div key={action.id} className="content-card" style={{ padding: "1rem 1.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                        <Pill label={action.owner} />
                        <Pill label={action.urgency} color={action.urgency === "urgent" ? "var(--red)" : action.urgency === "soon" ? "#915a1e" : "var(--green)"} />
                        <Pill label={`${action.effort} effort`} />
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", alignSelf: "center" }}>{action.lawShortTitle}</span>
                      </div>
                      <strong style={{ color: "var(--navy)", fontSize: "1rem" }}>{action.title}</strong>
                      <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{action.whyItMatters}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem", marginTop: "0.8rem" }}>
                        <ActionMeta label="Suggested owner" value={action.owner} />
                        <ActionMeta label="Target date" value={getSuggestedActionDueDate(action.timeline)} />
                        <ActionMeta
                          label="Evidence to attach"
                          value={evidenceRecommendations.find((entry) => entry.lawShortTitle === action.lawShortTitle)?.artifactType ?? "Checklist completion note or supporting policy evidence"}
                        />
                      </div>
                    </div>
                    {action.citation ? <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{action.citation}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ActionMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.65rem 0.75rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <p style={{ margin: "0 0 0.15rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.84rem", lineHeight: 1.45 }}>{value}</p>
    </div>
  );
}

function GapReportView({ report }: { report: ReturnType<typeof buildClauseGapReport> }) {
  return (
    <div className="stack">
      <div className="content-card">
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
          Clause-level coverage summary
        </p>
        <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>Gap report</h2>
        <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{report.summary}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
          <MiniMetric label="Covered" value={report.totals.covered} color="var(--green)" />
          <MiniMetric label="In progress" value={report.totals.inProgress} color="#915a1e" />
          <MiniMetric label="Open gaps" value={report.totals.gaps} color="var(--red)" />
          <MiniMetric label="Not tracked" value={report.totals.notGenerated} color="#2b6cb0" />
        </div>
      </div>

      {report.entries.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
          <p>No clause-level obligations were generated for this assessment.</p>
        </div>
      ) : (
        report.entries.map((entry) => (
          <div key={`${entry.lawSlug}-${entry.obligationTitle}-${entry.citation}`} className="content-card" style={{ padding: "1rem 1.1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                  <Pill label={entry.status.replace("_", " ")} color={toneColor(entry.status)} />
                  <Pill label={entry.priority} color={PRIORITY_COLORS[entry.priority] ?? "var(--navy)"} />
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{entry.lawShortTitle}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{entry.category}</span>
                </div>
                <strong style={{ color: "var(--navy)" }}>{entry.obligationTitle}</strong>
                <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>{entry.whyItMatters}</p>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{entry.citation}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SimulationView({
  input,
  delta,
  onChangeField,
  onToggleValue,
}: {
  input: AssessmentInput | null;
  delta: ReturnType<typeof buildSimulationDeltaFromResults> | null;
  onChangeField: <K extends keyof AssessmentInput>(field: K, value: AssessmentInput[K]) => void;
  onToggleValue: (field: "target_markets" | "use_cases", value: string) => void;
}) {
  if (!input || !delta) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
        <p>Simulation is not available yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: "1rem" }}>
      <div className="content-card">
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
          What-if simulation
        </p>
        <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>Model a product change</h2>
        <p style={{ margin: "0.45rem 0 1rem", color: "var(--muted)", lineHeight: 1.6 }}>
          Simulate market expansion, use-case changes, or higher automation to see how legal scope shifts before you launch it.
        </p>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>Target markets</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {TARGET_MARKETS.map((market) => (
                <button
                  key={market.code}
                  type="button"
                  className={`button ${input.target_markets.includes(market.code) ? "button--primary" : ""}`}
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => onToggleValue("target_markets", market.code)}
                >
                  {market.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>Use cases</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {USE_CASE_OPTIONS.map((useCase) => (
                <button
                  key={useCase.value}
                  type="button"
                  className={`button ${input.use_cases.includes(useCase.value) ? "button--primary" : ""}`}
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => onToggleValue("use_cases", useCase.value)}
                >
                  {useCase.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>Deployment</span>
              <select value={input.deployment_context} onChange={(event) => onChangeField("deployment_context", event.target.value)}>
                <option value="public">Public (B2C)</option>
                <option value="enterprise">Enterprise (B2B)</option>
                <option value="consumer">Consumer App</option>
                <option value="government">Government / Public Sector</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>Risk self-assessment</span>
              <select value={input.risk_self_assessment ?? "limited"} onChange={(event) => onChangeField("risk_self_assessment", event.target.value)}>
                <option value="minimal">Minimal risk</option>
                <option value="limited">Limited risk</option>
                <option value="high">High risk</option>
                <option value="unacceptable">Potentially unacceptable risk</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <BooleanToggle label="Automated decisions" value={input.automated_decisions} onChange={(value) => onChangeField("automated_decisions", value)} />
            <BooleanToggle label="Processes EU personal data" value={input.processes_eu_personal_data} onChange={(value) => onChangeField("processes_eu_personal_data", value)} />
            <BooleanToggle label="Uses biometric data" value={input.uses_biometric_data} onChange={(value) => onChangeField("uses_biometric_data", value)} />
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="content-card">
          <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Simulation delta
          </p>
          <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>Scope change</h2>
          <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{delta.summary}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
            <MiniMetric label="Current likely laws" value={delta.currentLikely} color="var(--navy)" />
            <MiniMetric label="Candidate likely laws" value={delta.candidateLikely} color={delta.candidateLikely > delta.currentLikely ? "var(--red)" : "var(--green)"} />
          </div>
        </div>

        <div className="content-card">
          <p style={{ margin: "0 0 0.45rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            New likely-applicable laws
          </p>
          {delta.newLikelyApplies.length > 0 ? (
            <div className="stack">
              {delta.newLikelyApplies.map((law) => (
                <div key={law.lawSlug} style={{ padding: "0.8rem 0.9rem", borderRadius: "12px", background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.15)" }}>
                  <strong style={{ color: "var(--navy)" }}>{law.lawShortTitle}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--muted)" }}>No new likely-applicable laws would be introduced.</p>
          )}
        </div>

        <div className="content-card">
          <p style={{ margin: "0 0 0.45rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Status changes
          </p>
          {delta.changedStatuses.length > 0 ? (
            <div className="stack">
              {delta.changedStatuses.slice(0, 6).map((entry) => (
                <div key={entry.lawSlug} style={{ padding: "0.8rem 0.9rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <strong style={{ color: "var(--navy)" }}>{entry.lawShortTitle}</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
                    {entry.from} to {entry.to}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--muted)" }}>No law status changes in this scenario.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "0.2rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 700,
        background: color ? `${color}22` : "rgba(16,32,48,0.07)",
        color: color ?? "var(--navy)",
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <strong style={{ display: "block", color: color, fontFamily: "var(--font-heading)", fontSize: "1.5rem", lineHeight: 1 }}>{value}</strong>
      <span style={{ color: "var(--muted)", fontSize: "0.84rem" }}>{label}</span>
    </div>
  );
}

function BooleanToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>{label}</p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className={`button ${value ? "button--primary" : ""}`} style={{ fontSize: "0.8rem" }} onClick={() => onChange(true)}>
          Yes
        </button>
        <button type="button" className={`button ${!value ? "button--primary" : ""}`} style={{ fontSize: "0.8rem" }} onClick={() => onChange(false)}>
          No
        </button>
      </div>
    </div>
  );
}

function ChecklistView({
  checklist,
  itemStatuses,
  onUpdateStatus,
  onAssignAssignee,
  assignableMembers,
}: {
  checklist: Checklist;
  itemStatuses: Record<string, ChecklistItem["status"]>;
  onUpdateStatus: (id: string, status: ChecklistItem["status"]) => void;
  onAssignAssignee: (id: string, assigneeId: string) => void;
  assignableMembers: AssignableMember[];
}) {
  const byLaw = checklist.items.reduce<Record<string, ChecklistItem[]>>((accumulator, item) => {
    const law = item.lawSlug ? getLawBySlug(item.lawSlug) : null;
    const key = law?.short_title ?? item.lawSlug ?? "Other";
    (accumulator[key] ??= []).push(item);
    return accumulator;
  }, {});

  const total = checklist.items.length;
  const completed = checklist.items.filter((item) => (itemStatuses[item.id] ?? item.status) === "completed").length;

  return (
    <div>
      <div className="content-card" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 0.4rem", fontWeight: 700, color: "var(--navy)" }}>
            {completed} / {total} tasks completed
          </p>
          <div style={{ height: "8px", borderRadius: "999px", background: "rgba(16,32,48,0.1)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? (completed / total) * 100 : 0}%`, background: "var(--green)", borderRadius: "999px", transition: "width 0.3s ease" }} />
          </div>
        </div>
        <strong style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--navy)" }}>{total ? Math.round((completed / total) * 100) : 0}%</strong>
      </div>

      {Object.entries(byLaw).map(([lawTitle, items]) => (
        <div key={lawTitle} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem", margin: "0 0 0.75rem" }}>{lawTitle}</h3>
          <div className="stack">
            {items.map((item) => {
              const status = itemStatuses[item.id] ?? item.status;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: "1rem 1.1rem",
                    borderRadius: "18px",
                    background: status === "completed" ? "rgba(42,123,98,0.07)" : "rgba(255,255,255,0.82)",
                    border: `1px solid ${status === "completed" ? "rgba(42,123,98,0.25)" : "rgba(16,32,48,0.09)"}`,
                    boxShadow: "0 4px 16px rgba(10,22,40,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <strong style={{ color: status === "completed" ? "var(--green)" : "var(--navy)", fontSize: "0.98rem" }}>{item.title}</strong>
                        {item.priority ? (
                          <span style={{ display: "inline-flex", padding: "0.2rem 0.55rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: `${PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.low}22`, color: PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.low }}>
                            {item.priority}
                          </span>
                        ) : null}
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{item.category}</span>
                        {item.dueDate ? <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Due {new Date(item.dueDate).toLocaleDateString("en-US")}</span> : null}
                        {item.assignee ? <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Owner {item.assignee.name ?? item.assignee.email}</span> : null}
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{item.evidenceArtifacts?.length ?? 0} evidence</span>
                      </div>
                      <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{item.description}</p>
                      {item.citation ? <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.78rem" }}>{item.citation}</p> : null}
                    </div>
                    <div style={{ display: "grid", gap: "0.45rem", minWidth: "190px" }}>
                      <select
                        value={item.assigneeId ?? ""}
                        onChange={(event) => onAssignAssignee(item.id, event.target.value)}
                        style={{ fontSize: "0.82rem", padding: "0.35rem 0.65rem", minHeight: "auto", borderRadius: "10px" }}
                      >
                        <option value="">Assign owner</option>
                        {assignableMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {(member.name ?? member.email ?? "Member") + ` (${member.role})`}
                          </option>
                        ))}
                      </select>
                      <select
                        value={status}
                        onChange={(event) => onUpdateStatus(item.id, event.target.value as ChecklistItem["status"])}
                        style={{ fontSize: "0.82rem", padding: "0.35rem 0.65rem", minHeight: "auto", borderRadius: "10px" }}
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
