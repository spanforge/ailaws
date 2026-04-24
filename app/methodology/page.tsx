import Link from "next/link";

export const metadata = {
  title: "Methodology - Spanforge Compass",
  description: "How Spanforge Compass evaluates AI law exposure, what outputs mean, and how evidence packages are assembled.",
};

const principles = [
  "Clarity over legal depth for first-pass SMB decisions",
  "Deterministic rules over opaque scoring",
  "Actionable outputs over passive law research",
  "Visible source links, review dates, limitations, and evidence exports",
];

const workflow = [
  {
    title: "1. Product profile intake",
    body: "The assessment captures market exposure, use cases, deployment context, data handling, automated decision signals, and risk cues.",
  },
  {
    title: "2. Rule-based law matching",
    body: "Each law has explicit applicability rules. Spanforge Compass scores laws by matched rule weight, then classifies them as likely applies, may apply, or unlikely.",
  },
  {
    title: "3. Founder-first output enrichment",
    body: "Likely and may-apply results are translated into plain-English summaries, weekly priorities, owner hints, and checklist-ready actions for small teams.",
  },
  {
    title: "4. Evidence packaging",
    body: "Assessment outputs can be exported as a structured evidence package containing results, checklist state, sources, and attestation metadata for review or diligence workflows.",
  },
  {
    title: "5. Human review",
    body: "Founders, product leads, operations, or counsel should review likely-applicable laws before launch, expansion, procurement, or customer commitments.",
  },
];

const limitations = [
  "Spanforge Compass is not a law firm and does not provide legal advice.",
  "The assessment is only as good as the facts entered into the wizard.",
  "Many laws depend on implementation detail, contract structure, sector rules, and geography beyond a first-pass questionnaire.",
  "Outputs should be used to prioritize review, not replace qualified counsel in high-stakes situations.",
];

export default function MethodologyPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem", maxWidth: "900px" }}>
        <p className="kicker">Methodology</p>
        <h1
          style={{
            margin: "0.4rem 0 0.5rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.9rem, 4vw, 3rem)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
          }}
        >
          How Spanforge Compass evaluates AI compliance exposure
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem", fontSize: "1rem", lineHeight: 1.6, maxWidth: "62ch" }}>
          Spanforge Compass is built for individuals, startups, and SMB teams that need a fast, credible first pass on AI law exposure
          without buying heavyweight enterprise governance tooling first.
        </p>

        <section className="content-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.8rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
            Product principles
          </h2>
          <div className="stack">
            {principles.map((principle) => (
              <div key={principle} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                <span style={{ color: "var(--navy)", fontWeight: 700 }}>•</span>
                <p style={{ margin: 0, color: "var(--navy)", lineHeight: 1.55 }}>{principle}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.8rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
            Assessment workflow
          </h2>
          <div className="stack">
            {workflow.map((step) => (
              <div key={step.title} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                <p style={{ margin: "0 0 0.25rem", color: "var(--navy)", fontWeight: 700 }}>{step.title}</p>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.8rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
            What the results mean
          </h2>
          <div className="stack">
            <MeaningRow label="Likely applies" body="The product profile strongly matches the law's scope and you should assign an owner immediately." />
            <MeaningRow label="May apply" body="There is meaningful exposure, but implementation detail or commercial setup likely determines final applicability." />
            <MeaningRow label="Unlikely" body="The current profile does not strongly match the law, but this is not a guarantee and can change with product evolution." />
          </div>
        </section>

        <section className="content-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.8rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
            Evidence package model
          </h2>
          <p style={{ margin: "0 0 0.8rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Evidence exports are generated from the current assessment profile, matched laws, action plan, checklist state,
            source links, review timestamps, and attestation metadata. They are intended to support internal review and
            diligence workflows, not to claim legal certification.
          </p>
        </section>

        <section className="content-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.8rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
            Limitations and review expectations
          </h2>
          <div className="stack">
            {limitations.map((item) => (
              <div key={item} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                <span style={{ color: "var(--red)", fontWeight: 700 }}>•</span>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card">
          <h2 style={{ margin: "0 0 0.8rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
            Review freshness
          </h2>
          <p style={{ margin: "0 0 0.8rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Law pages, templates, and key results should surface source links and review dates. Results should be treated as a
            practical starting point and revisited when your product, market, or law landscape changes.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/assess" className="button button--primary">
              Run assessment {"->"}
            </Link>
            <Link href="/templates" className="button">
              Open templates {"->"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MeaningRow({ label, body }: { label: string; body: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid rgba(16,32,48,0.08)" }}>
      <strong style={{ color: "var(--navy)" }}>{label}</strong>
      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}
