import Link from "next/link";
import { laws } from "@/lib/lexforge-data";
import { TEMPLATE_LIBRARY } from "@/lib/smb";

export const metadata = {
  title: "AI Compliance Evidence Workspace for Startups and SMBs - Spanforge Compass",
  description:
    "Find which AI laws apply to your product, what to do next, and what evidence package your team can export today.",
};

const useCases = [
  {
    title: "AI SaaS selling into the EU",
    body: "Figure out whether the EU AI Act, GDPR, and product-liability rules matter before a customer asks.",
  },
  {
    title: "Hiring or healthcare workflows",
    body: "Spot higher-risk use cases early, assign owners, and leave with a concrete remediation list instead of raw citations.",
  },
  {
    title: "Founder-led launch readiness",
    body: "Turn one assessment into a founder-ready PDF, a prioritized action plan, and an exportable evidence package.",
  },
];

const trustPoints = [
  "Deterministic rules engine with source-linked results",
  "Founder-readable summaries before legal detail",
  "Evidence package export for counsel, buyers, and internal review",
  "Review dates and freshness cues surfaced across key pages",
];

export default function HomePage() {
  const enacted = laws.filter((law) => law.status === "in_force" || law.status === "enacted").length;
  const proposed = laws.filter((law) => law.status === "proposed" || law.status === "draft").length;

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <section
          className="cta-banner"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
            gap: "1.5rem",
            alignItems: "stretch",
            padding: "2rem",
          }}
        >
          <div>
            <p className="eyebrow">For founders, startups, and SMB teams</p>
            <h1
              style={{
                margin: "0.3rem 0 0.75rem",
                color: "var(--navy)",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2rem, 5vw, 4rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                maxWidth: "13ch",
              }}
            >
              AI compliance with evidence, not just answers
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: "58ch", lineHeight: 1.6, margin: 0 }}>
              Spanforge Compass helps small teams figure out which AI laws apply, what to do this week, and what evidence they can
              hand to customers, cofounders, counsel, or procurement reviewers.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
              <Link href="/assess" className="button button--primary" style={{ fontSize: "0.95rem", padding: "0.75rem 1.2rem" }}>
                Start free assessment {"->"}
              </Link>
              <Link href="/methodology" className="button" style={{ fontSize: "0.95rem", padding: "0.75rem 1.2rem" }}>
                View methodology
              </Link>
            </div>
          </div>
          <div className="content-card" style={{ padding: "1.2rem 1.25rem", alignSelf: "stretch" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              What you leave with
            </p>
            <div className="stack">
              <SnapshotItem title="Top laws" body="Likely-applicable and may-apply laws explained in plain English." />
              <SnapshotItem title="Action plan" body="Top urgent actions grouped by this week, this month, and later." />
              <SnapshotItem title="Evidence package" body="Structured export with sources, checklist status, and attestation metadata." />
            </div>
          </div>
        </section>

        <div className="stats-grid" style={{ margin: "2rem 0 2.5rem" }}>
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
            <strong style={{ color: "var(--navy)" }}>{TEMPLATE_LIBRARY.length}</strong>
            <span>Starter templates</span>
          </div>
        </div>

        <section style={{ marginBottom: "2.5rem" }}>
          <div className="section-heading">
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.45rem" }}>
              Built for high-intent SMB use cases
            </h2>
          </div>
          <div className="card-grid">
            {useCases.map((item) => (
              <div key={item.title} className="content-card">
                <h3 style={{ margin: "0 0 0.45rem", fontSize: "1.18rem", color: "var(--navy)" }}>{item.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.94rem", margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <div className="section-heading">
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.45rem" }}>
              Why teams trust the output
            </h2>
            <Link href="/methodology" style={{ fontSize: "0.9rem", color: "var(--blue)" }}>
              Read methodology {"->"}
            </Link>
          </div>
          <div className="card-grid">
            {trustPoints.map((point) => (
              <div key={point} className="content-card" style={{ padding: "1.1rem 1.2rem" }}>
                <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.95rem", fontWeight: 700 }}>{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <div className="section-heading">
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.45rem" }}>
              Start with action, not research
            </h2>
          </div>
          <div className="card-grid">
            <ActionCard
              title="Run the assessment"
              body="Answer a short wizard and get prioritized AI law exposure in plain English."
              href="/assess"
              cta="Start assessment"
              primary
            />
            <ActionCard
              title="Download templates"
              body="Get AI usage policies, transparency notices, diligence checklists, and launch-readiness docs."
              href="/templates"
              cta="Open templates"
            />
            <ActionCard
              title="Inspect methodology"
              body="See how Spanforge Compass evaluates exposure, where human review still matters, and how evidence exports are assembled."
              href="/methodology"
              cta="Review methodology"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function SnapshotItem({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
      <p style={{ margin: "0 0 0.25rem", color: "var(--navy)", fontSize: "0.92rem", fontWeight: 700 }}>{title}</p>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
  cta,
  primary,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div className="content-card">
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.25rem", color: "var(--navy)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.93rem", margin: 0 }}>{body}</p>
      <Link
        href={href}
        className={`button ${primary ? "button--primary" : ""}`}
        style={{ marginTop: "1rem", fontSize: "0.9rem", padding: "0.6rem 1.1rem" }}
      >
        {cta} {"->"}
      </Link>
    </div>
  );
}
