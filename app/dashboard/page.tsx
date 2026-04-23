"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { laws, getLawBySlug } from "@/lib/lexforge-data";

type Assessment = {
  id: string;
  name: string | null;
  createdAt: string;
  results: { applicabilityStatus: string }[];
};

type SavedEntry = { lawSlug: string; createdAt: string };

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const enacted = laws.filter((l) => l.status === "in_force" || l.status === "enacted").length;
  const proposed = laws.filter((l) => l.status === "proposed" || l.status === "draft").length;

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/assessments").then((r) => r.json()),
      fetch("/api/saved-laws").then((r) => r.json()),
    ]).then(([a, s]) => {
      setAssessments(a.data ?? []);
      setSavedSlugs(s.data ?? []);
      setLoading(false);
    });
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading dashboard…</p>
        </div>
      </main>
    );
  }

  const savedLaws = savedSlugs
    .map((s) => ({ ...s, law: getLawBySlug(s.lawSlug) }))
    .filter((s) => s.law != null);

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <p className="kicker">Dashboard</p>
        <h1 style={{ margin: "0.4rem 0 0.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Your AI compliance intelligence hub.
        </p>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: "2.5rem" }}>
          <div className="stat-card">
            <strong>{laws.length}</strong>
            <span>Laws tracked</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--green)" }}>{enacted}</strong>
            <span>In force / enacted</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "#915a1e" }}>{proposed}</strong>
            <span>Proposed / draft</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--navy)" }}>{assessments.length}</strong>
            <span>Assessments run</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--red)" }}>{savedSlugs.length}</strong>
            <span>Laws saved</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem" }}>
          {/* Recent Assessments */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--navy)", margin: 0 }}>Recent Assessments</h2>
              <Link href="/assess" style={{ fontSize: "0.85rem", color: "var(--navy)", textDecoration: "underline" }}>Run new →</Link>
            </div>
            {assessments.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>No assessments yet.</p>
                <Link href="/assess" className="button button--primary">Run your first assessment</Link>
              </div>
            ) : (
              <div className="stack">
                {assessments.slice(0, 5).map((a) => {
                  const applicable = a.results.filter((r) => r.applicabilityStatus === "likely_applies").length;
                  const mayApply = a.results.filter((r) => r.applicabilityStatus === "may_apply").length;
                  return (
                    <div key={a.id} className="content-card" style={{ padding: "1rem 1.1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>
                            {a.name ?? `Assessment ${new Date(a.createdAt).toLocaleDateString()}`}
                          </p>
                          <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                            {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(230,57,70,0.1)", color: "var(--red)", fontWeight: 700 }}>
                              {applicable} applies
                            </span>
                            {mayApply > 0 && (
                              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(244,162,97,0.15)", color: "#915a1e", fontWeight: 700 }}>
                                {mayApply} may apply
                              </span>
                            )}
                          </div>
                        </div>
                        <Link href={`/assess/results/${a.id}`} className="button" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", whiteSpace: "nowrap" }}>
                          View →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Saved Laws Watchlist */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--navy)", margin: 0 }}>Watchlist</h2>
              <Link href="/explore" style={{ fontSize: "0.85rem", color: "var(--navy)", textDecoration: "underline" }}>Browse laws →</Link>
            </div>
            {savedLaws.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>No saved laws yet.</p>
                <Link href="/explore" className="button">Browse laws</Link>
              </div>
            ) : (
              <div className="stack">
                {savedLaws.map(({ law, lawSlug }) => (
                  <div key={lawSlug} className="content-card" style={{ padding: "1rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.92rem" }}>{law!.short_title}</p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>{law!.jurisdiction}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "999px", background: law!.status === "in_force" ? "rgba(42,123,98,0.12)" : "rgba(244,162,97,0.15)", color: law!.status === "in_force" ? "var(--green)" : "#915a1e", fontWeight: 700, textTransform: "capitalize" }}>
                        {law!.status?.replace(/_/g, " ")}
                      </span>
                      <Link href={`/laws/${lawSlug}`} className="button" style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}>View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: "2.5rem", borderTop: "1px solid var(--line)", paddingTop: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--navy)", margin: "0 0 1rem" }}>Quick actions</h2>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/assess" className="button button--primary">Run compliance assessment</Link>
            <Link href="/explore" className="button">Browse all laws</Link>
            <Link href="/compare" className="button">Compare regulations</Link>
            <Link href="/alerts" className="button">🔔 Regulatory alerts</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
