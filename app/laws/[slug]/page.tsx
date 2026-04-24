import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getLawBySlug, laws, type Law, type Obligation } from "@/lib/lexforge-data";
import { SaveLawButton } from "@/components/save-law-button";
import { getFreshnessLabel, getFreshnessTone, getLawLastReviewed } from "@/lib/smb";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return laws.map((law) => ({ slug: law.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const law = getLawBySlug(slug);
  if (!law) return { title: "Law Not Found" };
  return {
    title: law.short_title,
    description: law.summary_short,
  };
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#e63946",
  high: "#f4a261",
  medium: "#2b6cb0",
  low: "#2a7b62",
};

const STATUS_LABEL: Record<string, string> = {
  in_force: "In Force",
  enacted: "Enacted",
  proposed: "Proposed",
  draft: "Draft",
  repealed: "Repealed",
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  regulation: "Regulation",
  directive: "Directive",
  act: "Act",
  executive_order: "Executive Order",
  framework: "Framework",
  guideline: "Guideline",
};

export default async function LawDetailPage({ params }: Props) {
  const { slug } = await params;
  const law = getLawBySlug(slug);
  if (!law) notFound();
  const lastReviewed = getLawLastReviewed(law.slug);
  const freshnessTone = getFreshnessTone(lastReviewed);
  const freshnessLabel = getFreshnessLabel(lastReviewed);
  const freshnessColor =
    freshnessTone === "fresh" ? "var(--green)" : freshnessTone === "aging" ? "#915a1e" : "var(--red)";

  // Group obligations by category
  const byCategory = law.obligations.reduce<Record<string, Obligation[]>>((acc, ob) => {
    (acc[ob.category] ??= []).push(ob);
    return acc;
  }, {});

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        {/* Back */}
        <Link href="/explore" className="text-link" style={{ fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          ← Back to explorer
        </Link>

        {/* Article layout */}
        <div className="article-layout" style={{ marginTop: "1.75rem" }}>
          {/* Main content */}
          <div>
            <p className="kicker">{law.jurisdiction} · {CONTENT_TYPE_LABEL[law.content_type] ?? law.content_type}</p>
            <h1 style={{ margin: "0.4rem 0 0", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 3rem)", lineHeight: 1.08, letterSpacing: "-0.025em" }}>
              {law.title}
            </h1>

            {/* Meta row */}
            <div className="metadata-row">
              <span>Status: {STATUS_LABEL[law.status] ?? law.status}</span>
              {law.effective_date && <span>Effective: {law.effective_date}</span>}
              {law.adopted_date && <span>Adopted: {law.adopted_date}</span>}
              <span>Last reviewed: {lastReviewed}</span>
              {law.issuing_body && <span>{law.issuing_body}</span>}
            </div>

            {/* Topics */}
            <ul className="tag-list">
              {law.topics.map((t) => <li key={t} className="tag">{t}</li>)}
            </ul>

            {/* Summary */}
            <div className="article-body" style={{ marginTop: "1.5rem" }}>
              <section>
                <h2>Overview</h2>
                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{law.summary_long}</p>
              </section>

              <section style={{ marginTop: "1.5rem" }}>
                <h2>Trust and Source Freshness</h2>
                <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                  <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "0.24rem 0.6rem",
                        borderRadius: "999px",
                        background: `${freshnessColor}22`,
                        color: freshnessColor,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {freshnessTone === "fresh" ? "Recently reviewed" : freshnessTone === "aging" ? "Review aging" : "Refresh recommended"}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>{freshnessLabel}</span>
                  </div>
                  <p style={{ margin: "0.85rem 0 0", color: "var(--navy)", fontSize: "0.94rem", lineHeight: 1.6 }}>
                    Use the official source before relying on a requirement for launch, procurement, or regulated customer commitments.
                    If your product scope changed since your last review, rerun the assessment before shipping.
                  </p>
                </div>
              </section>

              {/* Obligations */}
              <section style={{ marginTop: "2rem" }}>
                <h2>Key Obligations</h2>
                {Object.entries(byCategory).map(([category, obligations]) => (
                  <div key={category} style={{ marginTop: "1.25rem" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--navy)", margin: "0 0 0.75rem" }}>{category}</h3>
                    <div className="stack">
                      {obligations.map((ob) => (
                        <ObligationCard key={ob.id} obligation={ob} />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="stack">
            {/* Quick facts */}
            <div className="sidebar-card">
              <h3>Quick Facts</h3>
              <dl style={{ display: "grid", gap: "0.6rem", margin: "0.75rem 0 0" }}>
                <Fact label="Jurisdiction" value={law.jurisdiction} />
                <Fact label="Issuing Body" value={law.issuing_body} />
                <Fact label="Type" value={CONTENT_TYPE_LABEL[law.content_type] ?? law.content_type} />
                <Fact label="Status" value={STATUS_LABEL[law.status] ?? law.status} />
                {law.adopted_date && <Fact label="Adopted" value={law.adopted_date} />}
                {law.effective_date && <Fact label="Effective" value={law.effective_date} />}
                <Fact label="Last reviewed" value={lastReviewed} />
                <Fact label="Obligations" value={`${law.obligations.length} documented`} />
              </dl>
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <SaveLawButton lawSlug={law.slug} />
                {law.official_url && (
                  <a
                    href={law.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.9rem" }}
                  >
                    Official source ↗
                  </a>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="sidebar-card sidebar-card--strong">
              <p className="kicker">Compliance Check</p>
              <h3>Does {law.short_title} apply to you?</h3>
              <p>Run the assessment wizard to see whether this law is a current launch issue and what to do this week.</p>
              <Link
                href="/assess"
                className="button button--primary"
                style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
              >
                Start assessment →
              </Link>
            </div>

            {/* Compare */}
            <div className="sidebar-card">
              <h3>Compare this law</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                See how {law.short_title} compares to other AI regulations.
              </p>
              <Link
                href={`/compare?add=${law.slug}`}
                className="button"
                style={{ marginTop: "1rem", width: "100%", justifyContent: "center", fontSize: "0.9rem" }}
              >
                Open comparison →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ObligationCard({ obligation }: { obligation: Obligation }) {
  return (
    <div style={{ padding: "1rem 1.15rem", borderRadius: "18px", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(16,32,48,0.09)", boxShadow: "0 4px 20px rgba(10,22,40,0.06)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <strong style={{ color: "var(--navy)", fontSize: "1rem", lineHeight: 1.3 }}>{obligation.title}</strong>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: `${PRIORITY_COLOR[obligation.priority]}22`, color: PRIORITY_COLOR[obligation.priority], whiteSpace: "nowrap" }}>
          {obligation.priority}
        </span>
      </div>
      <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", fontSize: "0.93rem" }}>{obligation.description}</p>
      {obligation.action_required && (
        <div className="callout" style={{ marginTop: "0.75rem" }}>
          <p style={{ fontSize: "0.88rem", color: "var(--navy)", fontWeight: 600, margin: 0 }}>Action required</p>
          <p style={{ fontSize: "0.88rem", margin: "0.25rem 0 0" }}>{obligation.action_required}</p>
        </div>
      )}
      {obligation.citation && (
        <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontSize: "0.8rem" }}>
          Citation: <em>{obligation.citation}</em>
        </p>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem" }}>
      <dt style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: "0.9rem", color: "var(--navy)", fontWeight: 500 }}>{value}</dd>
    </div>
  );
}
