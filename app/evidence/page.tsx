"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getLawBySlug, laws } from "@/lib/lexforge-data";
import { runRulesEngine, type AssessmentInput, type AssessmentResult } from "@/lib/rules-engine";
import { buildClauseGapReport, type ClauseGapEntry } from "@/lib/workspace-intelligence";
import { getLawLastReviewed } from "@/lib/smb";

type EvidenceStatus = "covered" | "in_progress" | "gap" | "not_generated";

type EvidenceRow = ClauseGapEntry & {
  evidenceType: string;
  proofSource: string;
  lastReviewed: string;
  suggestedOwner: string;
  dueDateHint: string;
};

const EVIDENCE_TYPE_MAP: Record<string, string> = {
  "Risk Management": "Risk assessment documentation",
  "Documentation": "Technical documentation / audit record",
  "Compliance": "Conformity assessment / certification",
  "Transparency": "Disclosure notice / policy document",
  "Human Oversight": "Process documentation / escalation SOP",
  "Data Governance": "Privacy policy / data-processing records",
  "Security": "Pen-test report / security assessment",
  "Monitoring": "Post-deployment monitoring logs",
  "General": "Internal review record",
};

const PROOF_SOURCE_MAP: Record<string, string> = {
  "Risk Management": "Internal risk register or risk classification memo",
  "Documentation": "Technical design doc or architecture writeup",
  "Compliance": "Third-party audit report or self-assessment checklist",
  "Transparency": "Published privacy notice or AI disclosure statement",
  "Human Oversight": "Escalation SOP or human review process document",
  "Data Governance": "Data-processing agreement or DPIA",
  "Security": "Security policy or penetration test output",
  "Monitoring": "Telemetry dashboard, alert log, or drift report",
  "General": "Internal memo or evidence artifact",
};

const OWNER_MAP: Record<string, string> = {
  "Risk Management": "Legal / Compliance",
  "Documentation": "Engineering",
  "Compliance": "Legal / Compliance",
  "Transparency": "Product",
  "Human Oversight": "Product / Operations",
  "Data Governance": "Privacy / Legal",
  "Security": "Engineering / Security",
  "Monitoring": "Engineering / Operations",
  "General": "Founder / Operations",
};

const DUE_DATE_MAP: Record<string, string> = {
  critical: "Before launch",
  high: "Within 30 days",
  medium: "Within 90 days",
  low: "Next quarter",
};

const STATUS_LABELS: Record<EvidenceStatus, { label: string; color: string; bg: string }> = {
  covered: { label: "Evidence on file", color: "var(--green)", bg: "rgba(42,123,98,0.1)" },
  in_progress: { label: "In progress", color: "#915a1e", bg: "rgba(244,162,97,0.12)" },
  gap: { label: "Evidence gap", color: "var(--red)", bg: "rgba(230,57,70,0.08)" },
  not_generated: { label: "Not tracked", color: "#2b6cb0", bg: "rgba(43,108,176,0.1)" },
};

function enrichWithEvidence(entries: ClauseGapEntry[]): EvidenceRow[] {
  return entries.map((entry) => {
    const category = entry.category || "General";
    const law = getLawBySlug(entry.lawSlug);
    return {
      ...entry,
      evidenceType: EVIDENCE_TYPE_MAP[category] ?? EVIDENCE_TYPE_MAP["General"],
      proofSource: PROOF_SOURCE_MAP[category] ?? PROOF_SOURCE_MAP["General"],
      lastReviewed: getLawLastReviewed(entry.lawSlug),
      suggestedOwner: OWNER_MAP[category] ?? OWNER_MAP["General"],
      dueDateHint: DUE_DATE_MAP[entry.priority] ?? DUE_DATE_MAP["low"],
    };
  });
}

type AssessmentSummary = {
  id: string;
  name: string | null;
  createdAt: string;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  checklists?: Array<{
    id: string;
    items: Array<{
      id: string;
      lawSlug: string | null;
      title: string;
      category: string | null;
      priority: string | null;
      status: string;
    }>;
  }>;
};

export default function EvidencePage() {
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [checklistItems, setChecklistItems] = useState<Array<{
    id: string;
    lawSlug: string | null;
    title: string;
    citation?: string | null;
    category: string | null;
    priority: string | null;
    status: string;
  }>>([]);
  const [filterStatus, setFilterStatus] = useState<EvidenceStatus | "all">("all");
  const [filterLaw, setFilterLaw] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] }))
      .then((data) => {
        const records = (data?.data ?? []) as AssessmentSummary[];
        setAssessments(records);
        if (records.length > 0) {
          selectAssessment(records[0]);
        }
        setLoading(false);
      });
  }, []);

  function selectAssessment(record: AssessmentSummary) {
    setSelectedId(record.id);
    const input: AssessmentInput = {
      ...JSON.parse(record.companyProfile ?? "{}"),
      ...JSON.parse(record.productProfile ?? "{}"),
      ...JSON.parse(record.technicalProfile ?? "{}"),
    };
    const runResults = runRulesEngine(laws, input);
    setResults(runResults);

    const items = (record.checklists?.[0]?.items ?? []).map((item) => ({
      id: item.id,
      lawSlug: item.lawSlug,
      title: item.title,
      citation: null,
      category: item.category,
      priority: item.priority,
      status: item.status,
    }));
    setChecklistItems(items);
  }

  const gapReport = buildClauseGapReport(results, checklistItems);
  const enrichedRows = enrichWithEvidence(gapReport.entries);

  const laws_in_scope = [...new Set(enrichedRows.map((row) => row.lawSlug))];
  const filteredRows = enrichedRows.filter((row) => {
    const statusMatch = filterStatus === "all" || row.status === filterStatus;
    const lawMatch = filterLaw === "all" || row.lawSlug === filterLaw;
    return statusMatch && lawMatch;
  });

  const gapCount = enrichedRows.filter((r) => r.status === "gap").length;
  const coveredCount = enrichedRows.filter((r) => r.status === "covered").length;
  const inProgressCount = enrichedRows.filter((r) => r.status === "in_progress").length;

  if (loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading evidence workspace...</p>
        </div>
      </main>
    );
  }

  if (assessments.length === 0) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", color: "var(--navy)", marginBottom: "0.75rem" }}>Evidence workspace</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            Run an assessment first to see evidence gaps across your applicable laws.
          </p>
          <Link href="/assess" className="button button--primary">Start assessment</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <Link href="/dashboard" className="text-link" style={{ fontSize: "0.9rem" }}>
          ← Back to dashboard
        </Link>

        <h1
          style={{
            margin: "1rem 0 0.35rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          Evidence mapping workspace
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.75rem", maxWidth: "68ch", lineHeight: 1.6 }}>
          For every obligation triggered by your assessment: what proof is required, what you already have, and what is still missing.
        </p>

        {assessments.length > 1 ? (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.4rem" }}>
              Assessment
            </label>
            <select
              value={selectedId ?? ""}
              onChange={(e) => {
                const record = assessments.find((a) => a.id === e.target.value);
                if (record) selectAssessment(record);
              }}
              style={{ fontSize: "0.9rem" }}
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? `Assessment from ${new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <strong style={{ color: "var(--navy)" }}>{enrichedRows.length}</strong>
            <span>Total obligations</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--green)" }}>{coveredCount}</strong>
            <span>Evidence on file</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "#915a1e" }}>{inProgressCount}</strong>
            <span>In progress</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--red)" }}>{gapCount}</strong>
            <span>Evidence gaps</span>
          </div>
        </div>

        {gapCount > 0 ? (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "1rem 1.15rem",
              borderRadius: "var(--radius)",
              background: "rgba(230,57,70,0.07)",
              border: "1px solid rgba(230,57,70,0.18)",
            }}
          >
            <p style={{ margin: "0 0 0.2rem", fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>
              {gapCount} evidence gap{gapCount !== 1 ? "s" : ""} — proof required but not yet tracked
            </p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
              These obligations have no matching evidence artifact. Generate a checklist from your assessment to start tracking them.
            </p>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Filter by status
            </label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {(["all", "gap", "in_progress", "covered", "not_generated"] as const).map((s) => (
                <button
                  key={s}
                  className={`button ${filterStatus === s ? "button--primary" : ""}`}
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Filter by law
            </label>
            <select value={filterLaw} onChange={(e) => setFilterLaw(e.target.value)} style={{ fontSize: "0.85rem" }}>
              <option value="all">All laws</option>
              {laws_in_scope.map((slug) => {
                const law = getLawBySlug(slug);
                return (
                  <option key={slug} value={slug}>
                    {law?.short_title ?? slug}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="content-card" style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
            <p>No obligations match the current filter.</p>
          </div>
        ) : (
          <div className="stack">
            {filteredRows.map((row) => {
              const statusConfig = STATUS_LABELS[row.status as EvidenceStatus] ?? STATUS_LABELS.gap;
              const law = getLawBySlug(row.lawSlug);
              return (
                <div key={`${row.lawSlug}-${row.obligationTitle}-${row.citation}`} className="content-card" style={{ padding: "1.1rem 1.2rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "start" }}>
                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", background: statusConfig.bg, color: statusConfig.color }}>
                          {statusConfig.label}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", background: "rgba(16,32,48,0.06)", color: "var(--navy)" }}>
                          {row.priority}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{row.lawShortTitle}</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{row.category}</span>
                      </div>

                      <h3 style={{ margin: "0 0 0.35rem", color: "var(--navy)", fontSize: "1rem", fontWeight: 700 }}>
                        {row.obligationTitle}
                      </h3>
                      <p style={{ margin: "0 0 0.75rem", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                        {row.whyItMatters}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.6rem" }}>
                        <EvidenceField label="Required proof type" value={row.evidenceType} />
                        <EvidenceField label="Suggested proof source" value={row.proofSource} />
                        <EvidenceField label="Suggested owner" value={row.suggestedOwner} />
                        <EvidenceField label="Target date" value={row.dueDateHint} />
                        <EvidenceField label="Law last reviewed" value={row.lastReviewed} />
                        {row.citation ? <EvidenceField label="Legal citation" value={row.citation} /> : null}
                      </div>
                    </div>
                    {law?.official_url ? (
                      <a
                        href={law.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button"
                        style={{ fontSize: "0.78rem", textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        Official source ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="content-card" style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "var(--navy)" }}>Need to close these gaps?</p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              Generate a checklist from your assessment to start tracking evidence readiness obligation by obligation.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {selectedId ? (
              <Link href={`/assess/results/${selectedId}`} className="button button--primary">
                Open assessment →
              </Link>
            ) : (
              <Link href="/assess" className="button button--primary">Run assessment →</Link>
            )}
            <Link href="/templates" className="button">Browse templates</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.6rem 0.8rem", borderRadius: "10px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <p style={{ margin: "0 0 0.15rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.85rem", fontWeight: 600 }}>{value}</p>
    </div>
  );
}
