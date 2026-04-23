"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentResult, TriggeredObligation } from "@/lib/rules-engine";
import { getLawBySlug } from "@/lib/lexforge-data";

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

const STATUS_CONFIG = {
  likely_applies: { label: "Likely Applies", color: "var(--red)", bg: "rgba(230,57,70,0.1)" },
  may_apply: { label: "May Apply", color: "#915a1e", bg: "rgba(244,162,97,0.18)" },
  unlikely: { label: "Unlikely", color: "var(--green)", bg: "rgba(42,123,98,0.12)" },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#e63946",
  high: "#f4a261",
  medium: "#2b6cb0",
  low: "#2a7b62",
};

const ITEM_STATUS_OPTIONS = ["not_started", "in_progress", "completed"] as const;

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(v: string | number | undefined | null): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const content = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportResultsCsv(results: AssessmentResult[], assessmentId: string) {
  const header = ["Law", "Short Title", "Jurisdiction", "Status", "Relevance %", "Rationale"];
  const rows = results.map((r) => [
    r.law_title,
    r.law_short_title,
    r.jurisdiction,
    r.applicability_status,
    String(Math.round(r.relevance_score * 100)),
    r.rationale,
  ]);
  downloadCsv(`lexforge-results-${assessmentId}.csv`, [header, ...rows]);
}

function exportObligationsCsv(
  obligations: Array<TriggeredObligation & { lawShortTitle: string }>,
  assessmentId: string,
) {
  const header = ["Priority", "Category", "Law", "Obligation", "Description", "Citation", "Action Required"];
  const rows = obligations.map((o) => [
    o.priority,
    o.category,
    o.lawShortTitle,
    o.title,
    o.description,
    o.citation,
    o.action_required,
  ]);
  downloadCsv(`lexforge-obligations-${assessmentId}.csv`, [header, ...rows]);
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [activeTab, setActiveTab] = useState<"results" | "checklist" | "actions">("results");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ChecklistItem["status"]>>({});

  // Results stored in sessionStorage after direct assessment, or fetch from DB
  useEffect(() => {
    const stored = sessionStorage.getItem(`assessment-${id}`);
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      // Fallback: load from API (e.g. linked from dashboard)
      fetch("/api/assessments")
        .then((r) => r.json())
        .then((data) => {
          const match = (data.data ?? []).find((a: { id: string; results: { lawSlug: string; relevanceScore: number; applicabilityStatus: string; rationale: string }[] }) => a.id === id);
          if (match) {
            const mapped = match.results.map((r: { lawSlug: string; relevanceScore: number; applicabilityStatus: string; rationale: string }) => {
              const law = getLawBySlug(r.lawSlug);
              return {
                law_id: r.lawSlug,
                law_slug: r.lawSlug,
                law_title: law?.title ?? r.lawSlug,
                law_short_title: law?.short_title ?? r.lawSlug,
                jurisdiction: law?.jurisdiction ?? "",
                jurisdiction_code: law?.jurisdiction_code ?? "",
                relevance_score: r.relevanceScore,
                applicability_status: r.applicabilityStatus as AssessmentResult["applicability_status"],
                rationale: r.rationale,
                triggered_rules: [],
                triggered_obligations: [],
              };
            });
            setResults(mapped);
          } else {
            window.location.href = "/assess";
          }
        })
        .catch(() => { window.location.href = "/assess"; });
    }
  }, [id]);

  async function generateChecklist() {
    if (!results) return;
    setLoadingChecklist(true);
    const res = await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: id }),
    });
    const data = await res.json();
    setChecklist(data);
    setActiveTab("checklist");
    setLoadingChecklist(false);
  }

  function updateItemStatus(itemId: string, status: ChecklistItem["status"]) {
    setItemStatuses((prev) => ({ ...prev, [itemId]: status }));
    // Persist to server — fire-and-forget (V1 in-memory)
    if (checklist) {
      fetch(`/api/checklists/${checklist.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => {/* silent — in-memory resets on server restart anyway */});
    }
  }

  if (!results) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading results…</p>
        </div>
      </main>
    );
  }

  const applicable = results.filter((r) => r.applicability_status === "likely_applies");
  const mayApply = results.filter((r) => r.applicability_status === "may_apply");
  const unlikely = results.filter((r) => r.applicability_status === "unlikely");

  // Collect all triggered obligations from applicable/may-apply laws
  const allObligations: Array<TriggeredObligation & { lawShortTitle: string; lawSlug: string }> = [
    ...applicable, ...mayApply
  ].flatMap((r) =>
    (r.triggered_obligations ?? []).map((o) => ({ ...o, lawShortTitle: r.law_short_title, lawSlug: r.law_slug }))
  );
  const criticalCount = allObligations.filter((o) => o.priority === "critical").length;

  // Jurisdiction exposure
  const jxCounts: Record<string, number> = {};
  [...applicable, ...mayApply].forEach((r) => {
    jxCounts[r.jurisdiction_code] = (jxCounts[r.jurisdiction_code] ?? 0) + 1;
  });
  const topJx = Object.entries(jxCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  function toggleCard(id: string) {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
            <button
              className="button"
              style={{ fontSize: "0.85rem" }}
              onClick={() => exportResultsCsv(results, id)}
              title="Download results as CSV"
            >
              ↓ Results CSV
            </button>
            <button
              className="button"
              style={{ fontSize: "0.85rem" }}
              onClick={() => exportObligationsCsv(allObligations, id)}
              disabled={allObligations.length === 0}
              title="Download obligations as CSV"
            >
              ↓ Obligations CSV
            </button>
            <a
              href={`/assess/results/${id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
              style={{ fontSize: "0.85rem", textDecoration: "none" }}
              title="Open printable PDF report"
            >
              ⎙ Export PDF
            </a>
            <button
              className="button"
              style={{ fontSize: "0.875rem" }}
              onClick={() => router.push("/assess")}
            >
              Edit &amp; re-run
            </button>
          </div>
        </div>

        <h1 style={{ margin: "1rem 0 0.4rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
          Your compliance analysis
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
          Based on your product profile, here are the AI regulations most relevant to you.
        </p>

        {/* Summary stats */}
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
            <strong style={{ color: "var(--green)" }}>{unlikely.length}</strong>
            <span>Unlikely</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--red)" }}>{criticalCount}</strong>
            <span>Critical actions</span>
          </div>
        </div>

        {/* Jurisdiction exposure */}
        {topJx.length > 0 && (
          <div className="content-card" style={{ padding: "0.9rem 1.25rem", marginBottom: "1.25rem" }}>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Jurisdiction exposure</p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {topJx.map(([code, count]) => (
                <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700, background: "rgba(16,32,48,0.07)", color: "var(--navy)" }}>
                  {code} <span style={{ fontWeight: 400, color: "var(--muted)" }}>· {count} law{count > 1 ? "s" : ""}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="subnav" style={{ marginBottom: "1.25rem" }}>
          <button
            className={`button ${activeTab === "results" ? "button--primary" : ""}`}
            style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
            onClick={() => setActiveTab("results")}
          >
            Results ({results.length})
          </button>
          <button
            className={`button ${activeTab === "actions" ? "button--primary" : ""}`}
            style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
            onClick={() => setActiveTab("actions")}
          >
            Key Actions {allObligations.length > 0 && `(${allObligations.length})`}
          </button>
          <button
            className={`button ${activeTab === "checklist" ? "button--primary" : ""}`}
            style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
            onClick={() => {
              if (!checklist) generateChecklist();
              else setActiveTab("checklist");
            }}
            disabled={loadingChecklist}
          >
            {loadingChecklist ? "Generating…" : checklist ? `Checklist (${checklist.items.length})` : "Generate Checklist"}
          </button>
        </div>

        {/* Results tab */}
        {activeTab === "results" && (
          <div className="stack">
            {results.map((result) => {
              const cfg = STATUS_CONFIG[result.applicability_status];
              const obligations = result.triggered_obligations ?? [];
              const isExpanded = expandedCards[result.law_id];
              const showToggle = obligations.length > 0;
              return (
                <div key={result.law_id} className="content-card">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                        <span className="micro">{result.jurisdiction}</span>
                        <span style={{ display: "inline-flex", padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {obligations.filter(o => o.priority === "critical").length > 0 && (
                          <span style={{ fontSize: "0.75rem", color: "var(--red)", fontWeight: 700 }}>
                            {obligations.filter(o => o.priority === "critical").length} critical
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: "0.5rem 0 0.35rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
                        {result.law_short_title}
                      </h3>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.93rem" }}>{result.rationale}</p>
                      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                        <Link href={`/laws/${result.law_slug}`} className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}>
                          View law →
                        </Link>
                        {showToggle && (
                          <button
                            className="button"
                            style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
                            onClick={() => toggleCard(result.law_id)}
                          >
                            {isExpanded ? "Hide" : `${obligations.length} obligation${obligations.length !== 1 ? "s" : ""} ↓`}
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: "60px" }}>
                      <strong style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "var(--navy)", lineHeight: 1 }}>
                        {Math.round(result.relevance_score * 100)}%
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>relevance</span>
                    </div>
                  </div>

                  {/* Expanded obligations */}
                  {isExpanded && obligations.length > 0 && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(16,32,48,0.08)" }}>
                      <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Key obligations</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        {obligations.map((obl) => (
                          <div key={obl.id} style={{ padding: "0.75rem 1rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: "999px", background: `${PRIORITY_COLOR[obl.priority]}22`, color: PRIORITY_COLOR[obl.priority] }}>
                                {obl.priority}
                              </span>
                              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{obl.category}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "auto" }}>{obl.citation}</span>
                            </div>
                            <strong style={{ fontSize: "0.9rem", color: "var(--navy)" }}>{obl.title}</strong>
                            {obl.action_required && (
                              <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                                <span style={{ fontWeight: 600, color: "var(--navy)" }}>Action: </span>{obl.action_required}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Key Actions tab */}
        {activeTab === "actions" && (
          <KeyActionsView obligations={allObligations} />
        )}

        {/* Checklist tab */}
        {activeTab === "checklist" && checklist && (
          <ChecklistView checklist={checklist} itemStatuses={itemStatuses} onUpdateStatus={updateItemStatus} />
        )}
      </div>
    </main>
  );
}

function KeyActionsView({ obligations }: {
  obligations: Array<TriggeredObligation & { lawShortTitle: string; lawSlug: string }>;
}) {
  const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

  if (obligations.length === 0) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
        <p>No obligations surfaced. Run a new assessment with more detail to see key actions.</p>
      </div>
    );
  }

  const grouped = PRIORITY_ORDER.reduce<Record<string, typeof obligations>>((acc, p) => {
    const items = obligations.filter((o) => o.priority === p);
    if (items.length) acc[p] = items;
    return acc;
  }, {});

  const PRIORITY_LABEL: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return (
    <div>
      <div className="content-card" style={{ padding: "0.9rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {PRIORITY_ORDER.filter((p) => grouped[p]).map((p) => (
          <span key={p} style={{ fontSize: "0.9rem" }}>
            <span style={{ fontWeight: 700, color: PRIORITY_COLOR[p] }}>{grouped[p].length}</span>
            {" "}<span style={{ color: "var(--muted)" }}>{PRIORITY_LABEL[p]}</span>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--muted)" }}>{obligations.length} total obligations</span>
      </div>

      {PRIORITY_ORDER.filter((p) => grouped[p]).map((priority) => (
        <div key={priority} style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ display: "inline-flex", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, background: `${PRIORITY_COLOR[priority]}22`, color: PRIORITY_COLOR[priority] }}>
              {PRIORITY_LABEL[priority]}
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{grouped[priority].length} action{grouped[priority].length !== 1 ? "s" : ""}</span>
          </div>
          <div className="stack">
            {grouped[priority].map((obl) => (
              <div key={`${obl.lawSlug}-${obl.id}`} className="content-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", background: "rgba(16,32,48,0.07)", padding: "0.2rem 0.55rem", borderRadius: "999px" }}>
                        {obl.category}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>·</span>
                      <Link href={`/laws/${obl.lawSlug}`} style={{ fontSize: "0.78rem", color: "var(--blue)", textDecoration: "none" }}>
                        {obl.lawShortTitle}
                      </Link>
                      {obl.citation && (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "auto" }}>{obl.citation}</span>
                      )}
                    </div>
                    <strong style={{ fontSize: "1rem", color: "var(--navy)" }}>{obl.title}</strong>
                    <p style={{ margin: "0.3rem 0 0.6rem", color: "var(--muted)", fontSize: "0.88rem" }}>{obl.description}</p>
                    {obl.action_required && (
                      <div style={{ padding: "0.65rem 0.9rem", borderRadius: "10px", background: "rgba(42,123,98,0.08)", borderLeft: "3px solid var(--green)" }}>
                        <p style={{ margin: 0, fontSize: "0.87rem", color: "var(--navy)" }}>
                          <span style={{ fontWeight: 700 }}>Action: </span>{obl.action_required}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistView({ checklist, itemStatuses, onUpdateStatus }: {
  checklist: Checklist;
  itemStatuses: Record<string, ChecklistItem["status"]>;
  onUpdateStatus: (id: string, status: ChecklistItem["status"]) => void;
}) {
  // Group by law
  const byLaw = checklist.items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const law = item.lawSlug ? getLawBySlug(item.lawSlug) : null;
    const key = law?.short_title ?? item.lawSlug ?? "Other";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  const total = checklist.items.length;
  const completed = checklist.items.filter((i) => (itemStatuses[i.id] ?? i.status) === "completed").length;

  return (
    <div>
      {/* Progress */}
      <div className="content-card" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 0.4rem", fontWeight: 700, color: "var(--navy)" }}>
            {completed} / {total} tasks completed
          </p>
          <div style={{ height: "8px", borderRadius: "999px", background: "rgba(16,32,48,0.1)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? (completed / total) * 100 : 0}%`, background: "var(--green)", borderRadius: "999px", transition: "width 0.3s ease" }} />
          </div>
        </div>
        <strong style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--navy)" }}>
          {total ? Math.round((completed / total) * 100) : 0}%
        </strong>
      </div>

      {Object.entries(byLaw).map(([lawTitle, items]) => (
        <div key={lawTitle} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
            {lawTitle}
          </h3>
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
                        <strong style={{ color: status === "completed" ? "var(--green)" : "var(--navy)", fontSize: "0.98rem" }}>
                          {item.title}
                        </strong>
                        <span style={{ display: "inline-flex", padding: "0.2rem 0.55rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: `${PRIORITY_COLOR[item.priority ?? "low"]}22`, color: PRIORITY_COLOR[item.priority ?? "low"] }}>
                          {item.priority}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{item.category}</span>
                      </div>
                      <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{item.description}</p>
                    </div>
                    <select
                      value={status}
                      onChange={(e) => onUpdateStatus(item.id, e.target.value as ChecklistItem["status"])}
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
