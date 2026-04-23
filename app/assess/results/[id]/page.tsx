"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLawBySlug, laws } from "@/lib/lexforge-data";
import { runRulesEngine, type AssessmentInput, type AssessmentResult } from "@/lib/rules-engine";
import {
  TEMPLATE_LIBRARY,
  buildActionPlan,
  enrichAssessmentResults,
  getActionTimelineLabel,
  getProductPresetById,
  type ActionPlanItem,
} from "@/lib/smb";

type ChecklistItem = {
  id: string;
  lawSlug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: "not_started" | "in_progress" | "completed";
};

type Checklist = {
  id: string;
  assessmentId: string;
  items: ChecklistItem[];
};

type AssessmentRecord = {
  id: string;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  results: Array<{
    lawSlug: string;
    relevanceScore: number;
    applicabilityStatus: string;
    rationale: string;
  }>;
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
    };
  });
}

function exportResultsCsv(results: ReturnType<typeof enrichAssessmentResults>, assessmentId: string) {
  const header = ["Law", "Status", "Summary", "Who this applies to", "Why you matched", "What to do first"];
  const rows = results.map((result) => [
    result.law_short_title,
    result.applicability_status,
    result.plainSummary,
    result.whoThisAppliesTo,
    result.whyYouMatched,
    result.whatToDoFirst,
  ]);

  downloadCsv(`lexforge-results-${assessmentId}.csv`, [header, ...rows]);
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

  downloadCsv(`lexforge-action-plan-${assessmentId}.csv`, [header, ...rows]);
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [input, setInput] = useState<AssessmentInput | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ChecklistItem["status"]>>({});
  const [activeTab, setActiveTab] = useState<"results" | "actions" | "checklist">("results");

  useEffect(() => {
    const storedResults = sessionStorage.getItem(`assessment-${id}`);
    const storedInput = sessionStorage.getItem(`assessment-input-${id}`) ?? sessionStorage.getItem("assessment-draft");

    if (storedInput) {
      const parsedInput = JSON.parse(storedInput) as AssessmentInput;
      setInput(parsedInput);
      setResults(runRulesEngine(laws, parsedInput));
      return;
    }

    if (storedResults) {
      setResults(JSON.parse(storedResults) as AssessmentResult[]);
    }

    fetch("/api/assessments")
      .then((response) => response.json())
      .then((data) => {
        const match = (data.data ?? []).find((assessment: AssessmentRecord) => assessment.id === id) as AssessmentRecord | undefined;
        if (!match) {
          window.location.href = "/assess";
          return;
        }

        const parsedInput = parseAssessmentInput(match);
        setInput(parsedInput);
        setResults(runRulesEngine(laws, parsedInput));
      })
      .catch(() => {
        window.location.href = "/assess";
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
    setActiveTab("checklist");
    setLoadingChecklist(false);
  }

  function updateItemStatus(itemId: string, status: ChecklistItem["status"]) {
    setItemStatuses((current) => ({ ...current, [itemId]: status }));

    if (!checklist) return;

    fetch(`/api/checklists/${checklist.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => undefined);
  }

  if (!results) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading results...</p>
        </div>
      </main>
    );
  }

  const enriched = enrichAssessmentResults(results, input ?? undefined);
  const applicable = enriched.filter((result) => result.applicability_status === "likely_applies");
  const mayApply = enriched.filter((result) => result.applicability_status === "may_apply");
  const unlikely = enriched.filter((result) => result.applicability_status === "unlikely");
  const actionPlan = buildActionPlan(results);
  const preset = getProductPresetById(input?.product_preset);

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
            ← New assessment
          </button>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="button" style={{ fontSize: "0.85rem" }} onClick={() => exportResultsCsv(enriched, id)}>
              ↓ Results CSV
            </button>
            <button
              className="button"
              style={{ fontSize: "0.85rem" }}
              onClick={() => exportActionPlanCsv(actionPlan.allActions, id)}
              disabled={actionPlan.allActions.length === 0}
            >
              ↓ Action Plan CSV
            </button>
            <a href={`/assess/results/${id}/print`} target="_blank" rel="noopener noreferrer" className="button" style={{ fontSize: "0.85rem", textDecoration: "none" }}>
              Export PDF
            </a>
            <button className="button" style={{ fontSize: "0.875rem" }} onClick={() => router.push("/assess")}>
              Edit and re-run
            </button>
          </div>
        </div>

        <h1
          style={{
            margin: "1rem 0 0.4rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          Your compliance analysis
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
          Top matches in plain English, plus the next actions a founder or small team can actually take.
        </p>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "1.25rem" }}>
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
            <strong style={{ color: "var(--green)" }}>{unlikely.length}</strong>
            <span>Unlikely</span>
          </div>
        </div>

        <div className="content-card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Assessment snapshot
              </p>
              <h2 style={{ margin: "0.45rem 0 0.2rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                {preset?.title ?? "Custom assessment"}
              </h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                {input?.target_markets?.length ? `Markets: ${input.target_markets.join(", ")}` : "Markets not specified"} ·{" "}
                {input?.use_cases?.length ? `Use cases: ${input.use_cases.join(", ")}` : "Use cases not specified"}
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
              Read methodology →
            </Link>
          </div>
        </div>

        <div className="subnav" style={{ marginBottom: "1.25rem" }}>
          <button className={`button ${activeTab === "results" ? "button--primary" : ""}`} onClick={() => setActiveTab("results")}>
            Results ({enriched.length})
          </button>
          <button className={`button ${activeTab === "actions" ? "button--primary" : ""}`} onClick={() => setActiveTab("actions")}>
            Action Plan ({actionPlan.allActions.length})
          </button>
          <button
            className={`button ${activeTab === "checklist" ? "button--primary" : ""}`}
            onClick={() => {
              if (!checklist) {
                generateChecklist();
              } else {
                setActiveTab("checklist");
              }
            }}
            disabled={loadingChecklist}
          >
            {loadingChecklist ? "Generating..." : checklist ? `Checklist (${checklist.items.length})` : "Generate Checklist"}
          </button>
        </div>

        {activeTab === "results" ? (
          <div className="stack">
            {enriched.map((result) => {
              const config = STATUS_CONFIG[result.applicability_status];
              const law = getLawBySlug(result.law_slug);

              return (
                <div key={result.law_id} className="content-card">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                        <span className="micro">{result.jurisdiction}</span>
                        <span style={{ display: "inline-flex", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, background: config.bg, color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                      <h3 style={{ margin: "0.5rem 0 0.35rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
                        {result.law_short_title}
                      </h3>
                      <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.95rem", lineHeight: 1.6 }}>{result.plainSummary}</p>

                      {result.applicability_status !== "unlikely" ? (
                        <>
                          <div style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
                            <ResultLabel title="Who this applies to" body={result.whoThisAppliesTo} />
                            <ResultLabel title="Why you matched" body={result.whyYouMatched} />
                            <ResultLabel title="What to do first" body={result.whatToDoFirst} />
                          </div>
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
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </details>
                        </>
                      ) : (
                        <p style={{ margin: "0.9rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{result.rationale}</p>
                      )}

                      <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                        <Link href={`/laws/${result.law_slug}`} className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}>
                          View law →
                        </Link>
                        {law?.official_url ? (
                          <a href={law.official_url} target="_blank" rel="noopener noreferrer" className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem", textDecoration: "none" }}>
                            Official source
                          </a>
                        ) : null}
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
                    Template Library
                  </p>
                  <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>Download starter templates for your team</h3>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                    Policies, notices, and checklists to help you operationalize the next steps.
                  </p>
                </div>
                <Link href="/templates" className="button button--primary">
                  Open templates →
                </Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                {TEMPLATE_LIBRARY.slice(0, 3).map((template) => (
                  <div key={template.slug} style={{ padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.08)" }}>
                    <strong style={{ color: "var(--navy)" }}>{template.title}</strong>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>{template.useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "actions" ? <ActionPlanView actions={actionPlan.allActions} /> : null}
        {activeTab === "checklist" && checklist ? (
          <ChecklistView checklist={checklist} itemStatuses={itemStatuses} onUpdateStatus={updateItemStatus} />
        ) : null}
      </div>
    </main>
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

function ActionPlanView({ actions }: { actions: ActionPlanItem[] }) {
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

function ChecklistView({
  checklist,
  itemStatuses,
  onUpdateStatus,
}: {
  checklist: Checklist;
  itemStatuses: Record<string, ChecklistItem["status"]>;
  onUpdateStatus: (id: string, status: ChecklistItem["status"]) => void;
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
                      </div>
                      <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{item.description}</p>
                    </div>
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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
