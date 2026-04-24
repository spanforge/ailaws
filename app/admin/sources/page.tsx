"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SourceHealthPayload = {
  summary: {
    totalLaws: number;
    staleLaws: number;
    brokenSources: number;
    blockedSources: number;
    alertDeliveryConfigured: boolean;
  };
  staleLaws: Array<{
    slug: string;
    title: string;
    jurisdiction: string | null;
    sourceHealthStatus: string | null;
    sourceCheckedAt: string | null;
    reviewStatus: string;
    overdueDays: number;
  }>;
  latestChecks: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    checkedAt: string;
    httpStatus: number | null;
    responseTimeMs: number | null;
    redirectUrl: string | null;
    errorMessage: string | null;
  }>;
  rateLimitMetrics: Array<{
    label: string;
    attempts: number;
    blocked: number;
    lastSeenAt: string;
    maxLimit: number;
    windowMs: number;
  }>;
};

export default function AdminSourcesPage() {
  const [data, setData] = useState<SourceHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/source-health")
      .then((response) => response.json())
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading source health…</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--red)" }}>Unable to load source-health data.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div>
            <p className="kicker">Admin</p>
            <h1 style={{ margin: "0.35rem 0 0.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "2rem" }}>
              Source health and trust ops
            </h1>
            <p style={{ margin: 0, color: "var(--muted)", maxWidth: "760px" }}>
              Monitor stale laws, recent source checks, alert-delivery readiness, and rate-limit pressure in one place.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Link href="/admin/editorial" className="button">Editorial queue</Link>
            <code style={{ padding: "0.55rem 0.8rem", borderRadius: "10px", background: "var(--surface-alt)", border: "1px solid var(--border)" }}>npm run source:validate</code>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card"><strong>{data.summary.totalLaws}</strong><span>Laws in catalog</span></div>
          <div className="stat-card"><strong style={{ color: "var(--amber)" }}>{data.summary.staleLaws}</strong><span>Stale laws</span></div>
          <div className="stat-card"><strong style={{ color: "var(--red)" }}>{data.summary.brokenSources}</strong><span>Broken or timed-out sources</span></div>
          <div className="stat-card"><strong style={{ color: data.summary.alertDeliveryConfigured ? "var(--green)" : "var(--amber)" }}>{data.summary.alertDeliveryConfigured ? "Ready" : "Needs config"}</strong><span>Alert delivery</span></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: "1.25rem", alignItems: "start" }}>
          <section className="content-card" style={{ padding: "1.1rem 1.2rem" }}>
            <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>Laws past freshness SLA</h2>
            <div className="stack" style={{ marginTop: "1rem" }}>
              {data.staleLaws.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)" }}>No stale laws right now.</p>
              ) : data.staleLaws.map((law) => (
                <div key={law.slug} style={{ padding: "0.9rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{law.title}</p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.84rem", color: "var(--muted)" }}>
                        {law.jurisdiction ?? "Unknown jurisdiction"} · {law.overdueDays}d overdue · source {law.sourceHealthStatus ?? "unknown"}
                      </p>
                    </div>
                    <Link href={`/laws/${law.slug}`} className="button">Open law</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="stack">
            <section className="content-card" style={{ padding: "1.1rem 1.2rem" }}>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>Recent source checks</h2>
              <div className="stack" style={{ marginTop: "1rem" }}>
                {data.latestChecks.map((check) => (
                  <div key={check.id} style={{ paddingBottom: "0.85rem", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{check.title}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                      {check.status} · {new Date(check.checkedAt).toLocaleString()} {check.httpStatus ? `· HTTP ${check.httpStatus}` : ""}
                    </p>
                    {check.errorMessage ? <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--red)" }}>{check.errorMessage}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="content-card" style={{ padding: "1.1rem 1.2rem" }}>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>Rate-limit visibility</h2>
              <div className="stack" style={{ marginTop: "1rem" }}>
                {data.rateLimitMetrics.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted)" }}>No rate-limit activity recorded since this process started.</p>
                ) : data.rateLimitMetrics.map((metric) => (
                  <div key={metric.label} style={{ paddingBottom: "0.85rem", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{metric.label}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                      {metric.attempts} attempts · {metric.blocked} blocked · window {Math.round(metric.windowMs / 60000)}m · last seen {new Date(metric.lastSeenAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}