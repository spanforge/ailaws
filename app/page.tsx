import Link from "next/link";
import { laws } from "@/lib/lexforge-data";
import { TEMPLATE_LIBRARY } from "@/lib/smb";

export const metadata = {
  title: "AI Law Evidence-Readiness Workspace for B2B SaaS Teams - Spanforge Compass",
  description:
    "Compass is a free beta workspace for B2B SaaS teams shipping AI into enterprise procurement to assess applicability, produce evidence, and stay current as regulation changes.",
};

const coreJobs = [
  {
    icon: "📋",
    number: "01",
    title: "Run your first applicability check fast",
    body: "Answer the workflow once and get a concrete law map, top obligations, and next actions before an enterprise buyer or counsel asks for proof.",
  },
  {
    icon: "🤝",
    number: "02",
    title: "Turn answers into reusable evidence",
    body: "Export a regulatory applicability memo, evidence checklist, and trust packet your team can reuse in procurement reviews, questionnaires, and internal signoff.",
  },
  {
    icon: "🔄",
    number: "03",
    title: "Come back when laws or products change",
    body: "Track what changed, see which conclusions are stale, and rerun targeted reassessments instead of rebuilding the whole analysis every time.",
  },
];

const trustPoints = [
  { icon: "🔗", label: "Deterministic", point: "Rules engine with source-linked results — not LLM guesses" },
  { icon: "📖", label: "Inspectable", point: "Confidence levels, review states, and citations stay visible in the working surface" },
  { icon: "📦", label: "Evidence-ready", point: "Export evidence packages with sources, checklist state, and attestation metadata" },
  { icon: "🔄", label: "Drift-aware", point: "Reassessment triggers fire when tracked laws change or assessments go stale" },
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <p className="eyebrow" style={{ margin: 0 }}>Legal intelligence for AI teams</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(42,123,98,0.12)", color: "var(--green)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                Free beta
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                Part of SpanForge
              </span>
            </div>
            <h1
              style={{
                margin: "0 0 0.75rem",
                color: "var(--navy)",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2rem, 5vw, 4rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                maxWidth: "16ch",
              }}
            >
              Find which AI laws apply and leave with evidence your team can use
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: "56ch", lineHeight: 1.6, margin: 0 }}>
              Compass is a free beta for B2B teams shipping AI into enterprise procurement. Run an assessment, save the laws that matter, export evidence, and come back when regulation or product scope changes.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
              <Link href="/assess" className="button button--primary" style={{ fontSize: "0.95rem", padding: "0.75rem 1.2rem" }}>
                Run free assessment →
              </Link>
              <Link href="/explore" className="button" style={{ fontSize: "0.95rem", padding: "0.75rem 1.2rem" }}>
                Explore tracked laws
              </Link>
            </div>
            <p style={{ margin: "0.8rem 0 0", color: "var(--muted)", fontSize: "0.84rem", lineHeight: 1.5 }}>
              Best for founders, compliance owners, and product teams preparing for enterprise reviews or launch signoff.
            </p>
          </div>
          <div className="content-card" style={{ padding: "1.2rem 1.25rem", alignSelf: "stretch" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              First-session outcome
            </p>
            <p style={{ margin: "0 0 0.85rem", color: "var(--navy)", fontSize: "0.92rem", fontWeight: 600, lineHeight: 1.45 }}>
              In one pass, a serious user should know which laws to care about, what evidence to prepare, and what to revisit later.
            </p>
            <div className="stack">
              <SnapshotItem title="1. Assess" body="Determine which AI laws apply before launch or a customer questionnaire arrives." />
              <SnapshotItem title="2. Save and export" body="Capture the laws you care about and produce evidence packages with sources and checklist state." />
              <SnapshotItem title="3. Reassess later" body="Come back when tracked laws change or your product scope shifts." />
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
            <strong style={{ color: "var(--amber)" }}>{proposed}</strong>
            <span>Proposed / draft</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--navy)" }}>{TEMPLATE_LIBRARY.length}</strong>
            <span>Starter templates</span>
          </div>
        </div>

        <section style={{ marginBottom: "2.5rem" }}>
          <p className="kicker" style={{ color: "var(--primary)", marginBottom: "0.55rem" }}>01 &middot; Core jobs</p>
          <div className="section-heading">
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.45rem" }}>
              Three jobs Compass is built to do
            </h2>
          </div>
          <div className="card-grid">
            {coreJobs.map((item) => (
              <div key={item.title} className="content-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.number}</span>
                </div>
                <h3 style={{ margin: "0 0 0.45rem", fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.3 }}>{item.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.94rem", margin: 0, lineHeight: 1.55 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <p className="kicker" style={{ color: "var(--green)", marginBottom: "0.55rem" }}>02 &middot; Why trust it</p>
          <div className="section-heading">
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.45rem" }}>
              Why teams trust the output
            </h2>
            <Link href="/methodology" className="text-link" style={{ fontSize: "0.9rem" }}>
              Read methodology →
            </Link>
          </div>
          <div className="card-grid">
            {trustPoints.map((tp) => (
              <div key={tp.point} className="content-card" style={{ padding: "1.1rem 1.2rem", display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>{tp.icon}</span>
                <div>
                  <p className="kicker" style={{ marginBottom: "0.25rem" }}>{tp.label}</p>
                  <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.45 }}>{tp.point}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <p className="kicker" style={{ color: "var(--amber)", marginBottom: "0.55rem" }}>03 &middot; Get started</p>
          <div className="section-heading">
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.45rem" }}>
              The adoption path is simple
            </h2>
          </div>
          <div className="card-grid">
            <ActionCard
              icon="📋"
              title="Run the first assessment"
              body="Answer a short workflow and get an executive verdict, top obligations, and a prioritized action plan in one pass."
              href="/assess"
              cta="Run assessment"
              primary
            />
            <ActionCard
              icon="📄"
              title="Export something useful"
              body="Generate an AI governance summary, applicability memo, or evidence packet your team can immediately reuse."
              href="/templates"
              cta="Browse templates"
            />
            <ActionCard
              icon="🔖"
              title="Save the laws that matter"
              body="Track only the jurisdictions and laws relevant to your product so updates and reassessments stay focused."
              href="/explore"
              cta="Open explorer"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function SnapshotItem({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "0.85rem 0.95rem", borderRadius: "var(--radius-xs)", background: "var(--surface-alt)", border: "1px solid var(--line)" }}>
      <p style={{ margin: "0 0 0.25rem", fontSize: "0.92rem", fontWeight: 700 }}>{title}</p>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  body,
  href,
  cta,
  primary,
}: {
  icon: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div className="content-card">
      <span style={{ fontSize: "1.75rem", lineHeight: 1, display: "block", marginBottom: "0.75rem" }}>{icon}</span>
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.15rem", color: "var(--navy)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.93rem", margin: 0 }}>{body}</p>
      <Link
        href={href}
        className={`button ${primary ? "button--primary" : ""}`}
        style={{ marginTop: "1rem", fontSize: "0.9rem", padding: "0.6rem 1.1rem" }}
      >
        {cta} →
      </Link>
    </div>
  );
}
