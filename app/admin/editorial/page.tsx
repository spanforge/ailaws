"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReviewQueueLaw = {
  id: string;
  slug: string;
  shortTitle: string | null;
  jurisdiction: string | null;
  reviewStatus: string;
  confidenceLevel: string;
  sourceKind: string | null;
  overdueDays: number;
  reasons: string[];
  riskScore: number;
  affectedUsers: number;
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
  const [summary, setSummary] = useState<ReviewQueueSummary | null>(null);
  const [sortBy, setSortBy] = useState("risk");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/editorial/review-queue?sortBy=${sortBy}`)
      .then((r) => r.json())
      .then((data) => {
        setLaws(data.laws ?? []);
        setSummary(data.summary ?? null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load review queue.");
        setLoading(false);
      });
  }, [sortBy]);

  async function handleApprove(lawId: string, newStatus: "verified" | "needs_review") {
    setApproving(lawId);
    const changeReason = newStatus === "verified"
      ? "Manually verified by admin"
      : "Returned for additional review";
    await fetch("/api/admin/editorial/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "law", entityId: lawId, newStatus, changeReason }),
    });
    setLaws((prev) => prev.filter((l) => l.id !== lawId));
    setApproving(null);
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
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
            <Link href="/api/admin/editorial/audit-log" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              View Audit Log
            </Link>
            <Link href="/api/admin/editorial/audit-log?format=csv" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Export CSV
            </Link>
          </div>
        </div>

        {summary && (
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
        )}

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
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

        {loading && <p style={{ color: "var(--text-muted)" }}>Loading review queue…</p>}
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}

        {!loading && !error && laws.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
            <p>No laws need review right now.</p>
          </div>
        )}

        {!loading && laws.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      background: law.reviewStatus === "verified" ? "rgba(42,123,98,0.12)" : "rgba(244,162,97,0.2)",
                      color: law.reviewStatus === "verified" ? "var(--green)" : "#915a1e",
                    }}>
                      {STATUS_LABEL[law.reviewStatus] ?? law.reviewStatus}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: CONFIDENCE_COLOR[law.confidenceLevel] ?? "var(--text-muted)", fontWeight: 600 }}>
                      {law.confidenceLevel} confidence
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Risk: {law.riskScore}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    {law.jurisdiction} · {law.overdueDays > 9000 ? "Never reviewed" : `${law.overdueDays} days since last review`} · {law.affectedUsers} users tracking
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {law.reasons.map((reason, i) => (
                      <span key={i} style={{
                        fontSize: "0.72rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        background: "rgba(230,57,70,0.1)",
                        color: "var(--red)",
                      }}>
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove(law.id, "verified")}
                    disabled={approving === law.id}
                    style={{
                      padding: "0.4rem 0.875rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--green)",
                      color: "#fff",
                      fontSize: "0.85rem",
                      cursor: approving === law.id ? "not-allowed" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Verify
                  </button>
                  <Link
                    href={`/laws/${law.slug}`}
                    style={{
                      padding: "0.4rem 0.875rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--navy)",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                    }}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
