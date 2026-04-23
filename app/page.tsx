import Link from "next/link";
import { laws } from "@/lib/lexforge-data";

export const metadata = {
  title: "AI Laws Explorer — LexForge",
  description:
    "Track, compare, and assess compliance across global AI regulations. Your central hub for AI law intelligence.",
};

export default function HomePage() {
  const recentLaws = laws.slice(0, 4);
  const enacted = laws.filter((l) => l.status === "in_force" || l.status === "enacted").length;
  const proposed = laws.filter((l) => l.status === "proposed" || l.status === "draft").length;

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <p className="kicker">Dashboard</p>
        <h1
          style={{
            margin: "0.4rem 0 0.5rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          AI Law Intelligence Hub
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Your central view of the global AI regulatory landscape.
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
        </div>

        {/* Quick actions */}
        <div className="section-heading">
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              color: "var(--navy)",
              fontSize: "1.45rem",
            }}
          >
            Quick actions
          </h2>
        </div>
        <div className="card-grid" style={{ marginBottom: "2.5rem" }}>
          <ActionCard
            icon="🔍"
            title="Explore laws"
            body="Search and filter the full library of AI regulations by jurisdiction, topic, and status."
            href="/explore"
            cta="Open explorer"
          />
          <ActionCard
            icon="📋"
            title="Run compliance assessment"
            body="Answer 3 short sections and get a prioritized compliance checklist for your product."
            href="/assess"
            cta="Start assessment"
            primary
          />
          <ActionCard
            icon="⚖️"
            title="Compare regulations"
            body="Select up to 4 laws and compare them side-by-side across key dimensions."
            href="/compare"
            cta="Open comparison"
          />
        </div>

        {/* Featured laws */}
        <div className="section-heading">
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              color: "var(--navy)",
              fontSize: "1.45rem",
            }}
          >
            Featured regulations
          </h2>
          <Link href="/explore" style={{ fontSize: "0.9rem", color: "var(--blue)" }}>
            View all →
          </Link>
        </div>
        <div className="card-grid">
          {recentLaws.map((law) => (
            <div key={law.id} className="content-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="micro">{law.jurisdiction}</span>
                <span
                  className="tag"
                  style={{ fontSize: "0.75rem", textTransform: "capitalize" }}
                >
                  {law.status.replace(/_/g, " ")}
                </span>
              </div>
              <h3 style={{ margin: "0.55rem 0 0.4rem", fontSize: "1.2rem" }}>
                <Link href={`/laws/${law.slug}`} style={{ color: "var(--navy)" }}>
                  {law.short_title}
                </Link>
              </h3>
              <p style={{ color: "var(--muted)", fontSize: "0.92rem", margin: 0 }}>
                {law.summary_short.slice(0, 120)}…
              </p>
              <Link
                href={`/laws/${law.slug}`}
                className="button"
                style={{ marginTop: "1rem", fontSize: "0.88rem", padding: "0.5rem 0.9rem" }}
              >
                View law →
              </Link>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div
          className="cta-banner"
          style={{
            marginTop: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.25rem",
            padding: "1.75rem 2rem",
          }}
        >
          <div>
            <p className="eyebrow">Compliance Wizard</p>
            <h2 style={{ margin: "0.4rem 0 0.5rem", fontSize: "1.6rem" }}>
              Get your compliance checklist
            </h2>
            <p>
              Our rules engine analyzes 10+ AI laws against your product profile in under 60
              seconds.
            </p>
          </div>
          <Link href="/assess" className="button button--primary" style={{ whiteSpace: "nowrap" }}>
            Start assessment →
          </Link>
        </div>
      </div>
    </main>
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
      <span style={{ fontSize: "1.75rem" }}>{icon}</span>
      <h3 style={{ margin: "0.65rem 0 0.4rem", fontSize: "1.25rem" }}>{title}</h3>
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

