"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

type ReviewQueueLaw = {
  id: string;
  slug: string;
  shortTitle: string | null;
  jurisdiction: string | null;
  reviewStatus: string;
  confidenceLevel: string;
  sourceKind: string | null;
  sourceAuthority: string | null;
  sourceCitationFull: string | null;
  editorNotes: string | null;
  sourceHealthStatus?: string | null;
  overdueDays: number;
  reasons: string[];
  riskScore: number;
  affectedUsers: number;
  recentAuditEntries?: AuditEntry[];
};

type ReviewQueueObligation = {
  id: string;
  title: string;
  category: string | null;
  priority: string | null;
  reviewStatus: string;
  confidenceLevel: string;
  sourceKind: string | null;
  sourceCitationFull: string | null;
  sourceExcerpt: string | null;
  verifiedAt: string | null;
  riskScore: number;
  reasons: string[];
  recentAuditEntries?: AuditEntry[];
  law: {
    slug: string;
    shortTitle: string | null;
    jurisdiction: string | null;
    sourceHealthStatus: string | null;
  };
};

type AuditEntry = {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeReason: string | null;
  createdAt: string;
  eventType?: "edit" | "revert";
  actor?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type ReviewQueueSummary = {
  totalLawsNeedingReview: number;
  totalObligationsNeedingReview: number;
  totalPendingApprovals: number;
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "var(--green)",
  medium: "#915a1e",
  low: "var(--red)",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  needs_review: "Needs Review",
  verified: "Verified",
  superseded: "Superseded",
  archived: "Archived",
};

export default function EditorialReviewQueuePage() {
  const [laws, setLaws] = useState<ReviewQueueLaw[]>([]);
  const [obligations, setObligations] = useState<ReviewQueueObligation[]>([]);
  const [summary, setSummary] = useState<ReviewQueueSummary | null>(null);
  const [sortBy, setSortBy] = useState("risk");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [revertingAuditId, setRevertingAuditId] = useState<string | null>(null);
  const [revertReasons, setRevertReasons] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/editorial/review-queue?sortBy=${sortBy}`);
      const data = await response.json();
      setLaws(data.laws ?? []);
      setObligations(data.obligations ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setError("Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, [sortBy]);

  async function handleApprove(entityType: "law" | "obligation", entityId: string, newStatus: "verified" | "needs_review") {
    setApproving(entityId);
    const changeReason = newStatus === "verified" ? "Manually verified by admin" : "Returned for additional review";
    const fieldDrafts = drafts[entityId] ?? {};
    const fieldEdits = Object.fromEntries(
      Object.entries(fieldDrafts).filter(([, value]) => value !== "__unchanged__"),
    );
    await fetch("/api/admin/editorial/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, newStatus, changeReason, fieldEdits }),
    });

    if (entityType === "law") {
      setLaws((prev) => prev.filter((item) => item.id !== entityId));
    } else {
      setObligations((prev) => prev.filter((item) => item.id !== entityId));
    }
    setApproving(null);
  }

  async function handleRevert(auditLogId: string) {
    setRevertingAuditId(auditLogId);
    setError(null);
    try {
      const response = await fetch("/api/admin/editorial/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditLogId,
          changeReason: revertReasons[auditLogId]?.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to revert change.");
        return;
      }
      setRevertReasons((current) => {
        const next = { ...current };
        delete next[auditLogId];
        return next;
      });
      await loadQueue();
    } catch {
      setError("Failed to revert change.");
    } finally {
      setRevertingAuditId(null);
    }
  }

  function setDraft(entityId: string, field: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [entityId]: {
        ...current[entityId],
        [field]: value,
      },
    }));
  }

  function setRevertReason(auditLogId: string, value: string) {
    setRevertReasons((current) => ({
      ...current,
      [auditLogId]: value,
    }));
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.8rem", color: "var(--navy)" }}>
              Editorial Review Queue
            </h1>
            <p style={{ margin: "0.4rem 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Laws and obligations requiring editorial review before publication.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Link href="/admin/sources" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Source Health
            </Link>
            <Link href="/admin/editorial/audit-log" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              View Audit Log
            </Link>
            <Link href="/api/admin/editorial/audit-log?format=csv" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Export CSV
            </Link>
          </div>
        </div>

        {summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Laws Needing Review", value: summary.totalLawsNeedingReview, color: summary.totalLawsNeedingReview > 0 ? "var(--red)" : "var(--green)" },
              { label: "Obligations Needing Review", value: summary.totalObligationsNeedingReview, color: summary.totalObligationsNeedingReview > 0 ? "#915a1e" : "var(--green)" },
              { label: "Pending Approvals", value: summary.totalPendingApprovals, color: "var(--navy)" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", alignSelf: "center" }}>Sort by:</span>
          {["risk", "overdue", "affected"].map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: sortBy === s ? "var(--navy)" : "transparent",
                color: sortBy === s ? "#fff" : "var(--text)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {s === "risk" ? "Risk Score" : s === "overdue" ? "Overdue Days" : "Affected Users"}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color: "var(--text-muted)" }}>Loading review queue...</p> : null}
        {error ? <p style={{ color: "var(--red)" }}>{error}</p> : null}

        {!loading && !error && laws.length === 0 && obligations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>OK</div>
            <p>No laws or obligations need review right now.</p>
          </div>
        ) : null}

        {!loading && laws.length > 0 ? (
          <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.2rem" }}>Laws</h2>
            {laws.map((law) => (
              <div
                key={law.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <Link href={`/laws/${law.slug}`} style={{ fontWeight: 600, color: "var(--navy)", fontSize: "1rem" }}>
                      {law.shortTitle ?? law.slug}
                    </Link>
                    <StatusChip status={law.reviewStatus} />
                    <MetaChip label={`${law.confidenceLevel} confidence`} color={CONFIDENCE_COLOR[law.confidenceLevel] ?? "var(--text-muted)"} />
                    {law.sourceKind ? <MetaChip label={law.sourceKind.replace(/_/g, " ")} color="var(--text-muted)" /> : null}
                    {law.sourceHealthStatus ? <MetaChip label={`source ${law.sourceHealthStatus}`} color={law.sourceHealthStatus === "broken" ? "var(--red)" : law.sourceHealthStatus === "redirect" ? "#915a1e" : "var(--text-muted)"} /> : null}
                    <MetaChip label={`Risk ${law.riskScore}`} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    {law.jurisdiction} · {law.overdueDays > 9000 ? "Never reviewed" : `${law.overdueDays} days since last review`} · {law.affectedUsers} users tracking
                  </div>
                  {law.sourceCitationFull ? (
                    <p style={{ margin: "0 0 0.45rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Citation: {law.sourceCitationFull}
                    </p>
                  ) : null}
                  <ReasonRow reasons={law.reasons} />
                  <details style={{ marginTop: "0.75rem" }}>
                    <summary style={{ cursor: "pointer", color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem" }}>
                      Edit provenance fields
                    </summary>
                    <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.75rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.6rem" }}>
                        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Source kind
                          <select defaultValue="__unchanged__" onChange={(event) => setDraft(law.id, "sourceKind", event.target.value)}>
                            <option value="__unchanged__">Keep source kind</option>
                            <option value="primary_law">Primary law</option>
                            <option value="regulator_guidance">Regulator guidance</option>
                            <option value="standard">Standard</option>
                            <option value="proposal">Proposal</option>
                            <option value="policy">Policy</option>
                            <option value="editorial_summary">Editorial summary</option>
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Confidence level
                          <select defaultValue="__unchanged__" onChange={(event) => setDraft(law.id, "confidenceLevel", event.target.value)}>
                            <option value="__unchanged__">Keep confidence</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </label>
                      </div>
                      <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Source authority
                        <input aria-label={`Source authority for ${law.shortTitle}`} placeholder={`Authority (${law.sourceAuthority ?? "none"})`} onChange={(event) => setDraft(law.id, "sourceAuthority", event.target.value)} />
                      </label>
                      <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Full citation
                        <textarea aria-label={`Full citation for ${law.shortTitle}`} placeholder={`Full citation (${law.sourceCitationFull ?? "none"})`} rows={3} onChange={(event) => setDraft(law.id, "sourceCitationFull", event.target.value)} />
                      </label>
                      <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Editor notes
                        <textarea aria-label={`Editor notes for ${law.shortTitle}`} placeholder={`Editor notes (${law.editorNotes ?? "none"})`} rows={2} onChange={(event) => setDraft(law.id, "editorNotes", event.target.value)} />
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link href={`/api/admin/editorial/audit-log?entityType=law&entityId=${law.id}`} style={viewLinkStyle}>
                          Audit log
                        </Link>
                      </div>
                    </div>
                  </details>
                  {law.recentAuditEntries && law.recentAuditEntries.length > 0 ? (
                    <details style={{ marginTop: "0.75rem" }}>
                      <summary style={{ cursor: "pointer", color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem" }}>
                        Recent change history
                      </summary>
                      <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.75rem" }}>
                        {law.recentAuditEntries.map((entry) => (
                          <AuditEntryCard
                            key={entry.id}
                            entry={entry}
                            onRevert={handleRevert}
                            reverting={revertingAuditId === entry.id}
                            revertReason={revertReasons[entry.id] ?? ""}
                            onRevertReasonChange={setRevertReason}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove("law", law.id, "verified")}
                    disabled={approving === law.id}
                    style={approveButtonStyle(approving === law.id)}
                  >
                    Verify
                  </button>
                  <Link href={`/laws/${law.slug}`} style={viewLinkStyle}>
                    View
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {!loading && obligations.length > 0 ? (
          <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.2rem" }}>Obligations</h2>
            {obligations.map((obligation) => (
              <div
                key={obligation.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--navy)", fontSize: "1rem" }}>{obligation.title}</strong>
                    <StatusChip status={obligation.reviewStatus} />
                    <MetaChip label={`${obligation.confidenceLevel} confidence`} color={CONFIDENCE_COLOR[obligation.confidenceLevel] ?? "var(--text-muted)"} />
                    {obligation.sourceKind ? <MetaChip label={obligation.sourceKind.replace(/_/g, " ")} color="var(--text-muted)" /> : null}
                    {obligation.priority ? <MetaChip label={`${obligation.priority} priority`} color={obligation.priority === "critical" ? "var(--red)" : obligation.priority === "high" ? "#915a1e" : "var(--text-muted)"} /> : null}
                    <MetaChip label={`Risk ${obligation.riskScore}`} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    {obligation.law.shortTitle ?? obligation.law.slug}{obligation.law.jurisdiction ? ` · ${obligation.law.jurisdiction}` : ""}{obligation.category ? ` · ${obligation.category}` : ""}
                  </div>
                  {obligation.sourceCitationFull ? (
                    <p style={{ margin: "0 0 0.35rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Citation: {obligation.sourceCitationFull}
                    </p>
                  ) : null}
                  {obligation.sourceExcerpt ? (
                    <p style={{ margin: "0 0 0.5rem", color: "var(--navy)", fontSize: "0.84rem", lineHeight: 1.55 }}>
                      Source note: {obligation.sourceExcerpt}
                    </p>
                  ) : null}
                  <ReasonRow reasons={obligation.reasons} />
                  <details style={{ marginTop: "0.75rem" }}>
                    <summary style={{ cursor: "pointer", color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem" }}>
                      Edit provenance fields
                    </summary>
                    <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.75rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.6rem" }}>
                        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Source kind
                          <select defaultValue="__unchanged__" onChange={(event) => setDraft(obligation.id, "sourceKind", event.target.value)}>
                            <option value="__unchanged__">Keep source kind</option>
                            <option value="primary_law">Primary law</option>
                            <option value="regulator_guidance">Regulator guidance</option>
                            <option value="standard">Standard</option>
                            <option value="proposal">Proposal</option>
                            <option value="policy">Policy</option>
                            <option value="editorial_summary">Editorial summary</option>
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Confidence level
                          <select defaultValue="__unchanged__" onChange={(event) => setDraft(obligation.id, "confidenceLevel", event.target.value)}>
                            <option value="__unchanged__">Keep confidence</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </label>
                      </div>
                      <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Full citation
                        <textarea aria-label={`Full citation for ${obligation.title}`} placeholder={`Full citation (${obligation.sourceCitationFull ?? "none"})`} rows={3} onChange={(event) => setDraft(obligation.id, "sourceCitationFull", event.target.value)} />
                      </label>
                      <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Source note
                        <textarea aria-label={`Source note for ${obligation.title}`} placeholder={`Source note (${obligation.sourceExcerpt ?? "none"})`} rows={3} onChange={(event) => setDraft(obligation.id, "sourceExcerpt", event.target.value)} />
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link href={`/api/admin/editorial/audit-log?entityType=obligation&entityId=${obligation.id}`} style={viewLinkStyle}>
                          Audit log
                        </Link>
                      </div>
                    </div>
                  </details>
                  {obligation.recentAuditEntries && obligation.recentAuditEntries.length > 0 ? (
                    <details style={{ marginTop: "0.75rem" }}>
                      <summary style={{ cursor: "pointer", color: "var(--navy)", fontWeight: 600, fontSize: "0.85rem" }}>
                        Recent change history
                      </summary>
                      <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.75rem" }}>
                        {obligation.recentAuditEntries.map((entry) => (
                          <AuditEntryCard
                            key={entry.id}
                            entry={entry}
                            onRevert={handleRevert}
                            reverting={revertingAuditId === entry.id}
                            revertReason={revertReasons[entry.id] ?? ""}
                            onRevertReasonChange={setRevertReason}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove("obligation", obligation.id, "verified")}
                    disabled={approving === obligation.id}
                    style={approveButtonStyle(approving === obligation.id)}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleApprove("obligation", obligation.id, "needs_review")}
                    disabled={approving === obligation.id}
                    style={secondaryButtonStyle(approving === obligation.id)}
                  >
                    Keep in review
                  </button>
                  <Link href={`/laws/${obligation.law.slug}`} style={viewLinkStyle}>
                    View law
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: "0.72rem",
        fontWeight: 600,
        textTransform: "uppercase",
        padding: "0.15rem 0.5rem",
        borderRadius: "4px",
        background: status === "verified" ? "rgba(42,123,98,0.12)" : "rgba(244,162,97,0.2)",
        color: status === "verified" ? "var(--green)" : "#915a1e",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function MetaChip({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: "0.72rem", color, fontWeight: 600 }}>{label}</span>;
}

function ReasonRow({ reasons }: { reasons: string[] }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
      {reasons.map((reason, i) => (
        <span
          key={i}
          style={{
            fontSize: "0.72rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "4px",
            background: "rgba(230,57,70,0.1)",
            color: "var(--red)",
          }}
        >
          {reason}
        </span>
      ))}
    </div>
  );
}

function approveButtonStyle(disabled: boolean) {
  return {
    padding: "0.4rem 0.875rem",
    borderRadius: "6px",
    border: "none",
    background: "var(--green)",
    color: "#fff",
    fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
  } satisfies CSSProperties;
}

function secondaryButtonStyle(disabled: boolean) {
  return {
    padding: "0.4rem 0.875rem",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--navy)",
    fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
  } satisfies CSSProperties;
}

const viewLinkStyle = {
  padding: "0.4rem 0.875rem",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--navy)",
  fontSize: "0.85rem",
  textDecoration: "none",
} satisfies CSSProperties;

function AuditEntryCard({
  entry,
  onRevert,
  reverting,
  revertReason,
  onRevertReasonChange,
}: {
  entry: AuditEntry;
  onRevert: (auditLogId: string) => Promise<void>;
  reverting: boolean;
  revertReason: string;
  onRevertReasonChange: (auditLogId: string, value: string) => void;
}) {
  const eventType = entry.eventType ?? (entry.changeReason?.toLowerCase().includes("reverted") ? "revert" : "edit");

  return (
    <div style={{
      padding: "0.7rem 0.8rem",
      borderRadius: "10px",
      background: eventType === "revert" ? "rgba(230,57,70,0.05)" : "rgba(16,32,48,0.04)",
      border: eventType === "revert" ? "1px solid rgba(230,57,70,0.18)" : "1px solid rgba(16,32,48,0.07)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
        <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ color: "var(--navy)", fontSize: "0.84rem" }}>{entry.fieldName}</strong>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: eventType === "revert" ? "var(--red)" : "var(--green)" }}>
            {eventType === "revert" ? "Rollback" : "Edit"}
          </span>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>
          {new Date(entry.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
        </span>
      </div>
      <p style={{ margin: "0 0 0.25rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        <strong>From:</strong> {entry.oldValue || "empty"} <strong>To:</strong> {entry.newValue || "empty"}
      </p>
      {entry.changeReason ? (
        <p style={{ margin: "0 0 0.25rem", color: "var(--navy)", fontSize: "0.8rem" }}>
          Reason: {entry.changeReason}
        </p>
      ) : null}
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.78rem" }}>
        {entry.actor?.name ?? entry.actor?.email ?? "Unknown actor"}
      </p>
      <div style={{ marginTop: "0.55rem", display: "grid", gap: "0.45rem" }}>
        <label htmlFor={`revert-reason-${entry.id}`} style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Rollback reason
        </label>
        <input
          id={`revert-reason-${entry.id}`}
          value={revertReason}
          placeholder="Rollback reason"
          onChange={(event) => onRevertReasonChange(entry.id, event.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => void onRevert(entry.id)}
          disabled={reverting}
          style={secondaryButtonStyle(reverting)}
        >
          {reverting ? "Reverting..." : "Revert"}
        </button>
        </div>
      </div>
    </div>
  );
}
