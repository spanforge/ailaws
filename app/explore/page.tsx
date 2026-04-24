"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { JURISDICTIONS, TOPICS, STATUSES, type Law } from "@/lib/lexforge-data";

const STATUS_COLORS: Record<string, string> = {
  in_force: "tag",
  enacted: "tag",
  proposed: "tag tag--neutral",
  draft: "tag tag--neutral",
};

export default function ExplorePage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const fetchLaws = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (jurisdiction !== "all") params.set("jurisdiction", jurisdiction);
    if (topic !== "all") params.set("topic", topic);
    if (status !== "all") params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    const res = await fetch(`/api/laws?${params}`);
    const json = await res.json();
    setLaws(json.data ?? []);
    setTotal(json.total ?? 0);
    setTotalPages(json.totalPages ?? 1);
    setLoading(false);
  }, [search, jurisdiction, topic, status, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, jurisdiction, topic, status]);

  useEffect(() => {
    const t = setTimeout(fetchLaws, 220);
    return () => clearTimeout(t);
  }, [fetchLaws]);

  return (
    <main className="page">
      {/* Hero */}
      <section className="shell" style={{ paddingTop: "2.5rem" }}>
        <p className="kicker">AI Laws Explorer</p>
        <h1 style={{ margin: "0.4rem 0 0.5rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
          Explore global AI regulations
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.08rem", maxWidth: "56ch", margin: 0 }}>
          Browse, search and filter AI laws and frameworks from every major jurisdiction. Click any law to view full details and obligations.
        </p>
      </section>

      {/* Search + Filters */}
      <section className="shell" style={{ marginTop: "1.75rem" }}>
        <div className="explore-controls">
          <div className="explore-search">
            <input
              type="search"
              placeholder="Search laws, jurisdictions, topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", fontSize: "1rem" }}
            />
          </div>
          <div className="explore-filters">
            <div className="field">
              <label>Jurisdiction</label>
              <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
                <option value="all">All jurisdictions</option>
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code}>{j.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Topic</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="all">All topics</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="shell" style={{ marginTop: "1.5rem" }}>
        {loading ? (
          <div className="explore-loading">
            <p style={{ color: "var(--muted)" }}>Loading laws…</p>
          </div>
        ) : laws.length === 0 ? (
          <div className="callout">
            <p>No laws match your filters. Try broadening your search.</p>
          </div>
        ) : (
          <>
            <p className="micro" style={{ marginBottom: "1rem" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} law{total !== 1 ? "s" : ""}
            </p>
            <div className="law-grid">
              {laws.map((law) => (
                <LawCard key={law.id} law={law} />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "2rem" }}>
                <button
                  className="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{ fontSize: "0.9rem", opacity: page <= 1 ? 0.4 : 1 }}
                >
                  ← Previous
                </button>
                <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ fontSize: "0.9rem", opacity: page >= totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA */}
      <section className="shell" style={{ marginTop: "3rem" }}>
        <div className="cta-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.25rem", padding: "1.75rem 2rem" }}>
          <div>
            <p className="eyebrow">Compliance Wizard</p>
            <h2 style={{ margin: "0.4rem 0 0.5rem", fontSize: "1.6rem" }}>Does this apply to your product?</h2>
            <p>Answer a few questions and get a personalized compliance checklist in under 2 minutes.</p>
          </div>
          <Link href="/assess" className="button button--primary" style={{ whiteSpace: "nowrap" }}>
            Run assessment →
          </Link>
        </div>
      </section>
    </main>
  );
}

function LawCard({ law }: { law: Law }) {
  const statusLabel = law.status.replace(/_/g, " ");
  const isStale = law.last_reviewed_at && law.freshness_sla_days
    ? (Date.now() - new Date(law.last_reviewed_at).getTime()) / 86_400_000 > law.freshness_sla_days
    : false;
  const isDraft = law.draft_status === "draft";

  return (
    <div className="law-card content-card" style={{ position: "relative" }}>
      {(isStale || isDraft) && (
        <div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {isStale && (
            <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "var(--amber-light, #fff7e6)", color: "var(--amber, #b45309)", border: "1px solid var(--amber, #b45309)", fontWeight: 600 }}>
              Needs review
            </span>
          )}
          {isDraft && (
            <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db", fontWeight: 600 }}>
              Draft
            </span>
          )}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <span className="micro">{law.jurisdiction}</span>
        <span className={STATUS_COLORS[law.status] ?? "tag"} style={{ fontSize: "0.75rem", textTransform: "capitalize" }}>
          {statusLabel}
        </span>
      </div>
      <h3 style={{ margin: "0.55rem 0 0.4rem" }}>
        <Link
          href={`/laws/${law.slug}`}
          style={{ color: "var(--navy)", textDecoration: "none" }}
          className="law-card__title-link"
        >
          {law.short_title}
        </Link>
      </h3>
      <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>
        {law.summary_short}
      </p>
      <ul className="tag-list" style={{ marginTop: "0.9rem" }}>
        {law.topics.slice(0, 3).map((t) => (
          <li key={t} className="tag">{t}</li>
        ))}
        {law.topics.length > 3 && (
          <li className="tag tag--neutral">+{law.topics.length - 3} more</li>
        )}
      </ul>
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem" }}>
        <Link href={`/laws/${law.slug}`} className="button" style={{ fontSize: "0.9rem", padding: "0.55rem 1rem" }}>
          View law →
        </Link>
        <Link href={`/compare?add=${law.slug}`} className="button" style={{ fontSize: "0.9rem", padding: "0.55rem 1rem" }}>
          Compare
        </Link>
      </div>
    </div>
  );
}
