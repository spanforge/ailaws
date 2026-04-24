import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plan packaging for solo operators, team workspaces, and enterprise deployments.",
};

const plans = [
  {
    name: "Solo",
    price: "Free",
    kicker: "For founders and individual operators",
    featured: false,
    features: [
      "Unlimited public law exploration",
      "Guest assessments and exportable evidence previews",
      "One verified account",
      "Saved laws and personal watchlist",
      "Quick-start assessment and owner-ready action plan",
    ],
  },
  {
    name: "Team",
    price: "$49/mo",
    kicker: "For shared compliance workspaces",
    featured: true,
    features: [
      "Workspace invites and shared evidence review",
      "Email regulatory alerts when delivery is configured",
      "Checklist ownership and reassessment workflows",
      "Audit-log exports for editorial and admin surfaces",
      "Shared evidence collection for launch and buyer diligence",
    ],
  },
  {
    name: "Enterprise",
    price: "Contact us",
    kicker: "For SSO and governed deployments",
    featured: false,
    features: [
      "Google or Microsoft Entra SSO",
      "Dedicated deployment and database configuration",
      "Operational monitoring and trust reporting",
      "Custom onboarding and legal terms",
      "Advanced identity and rollout controls",
    ],
  },
];

const packagingPrinciples = [
  {
    title: "Start free when you are figuring things out",
    body: "The solo workflow is meant to help a founder, operator, or advisor understand applicability, generate actions, and begin collecting evidence without procurement friction.",
  },
  {
    title: "Upgrade when the work becomes shared",
    body: "The paid boundary starts when compliance work becomes collaborative: shared evidence review, workspace invites, role-based follow-up, and ongoing operational visibility.",
  },
  {
    title: "Use enterprise only when governance overhead is real",
    body: "Enterprise packaging is for customers who need deeper identity, deployment, and trust controls, not for small teams trying to get their first AI readiness workflow in place.",
  },
];

export default function PricingPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
        <p className="kicker">Plans</p>
        <h1 style={{ margin: "0.35rem 0 0.5rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.05 }}>
          Start solo, upgrade when compliance work becomes a team workflow
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "760px" }}>
          Compass is built to let a founder, product lead, or compliance generalist get real value before they need enterprise tooling. Public research stays open, solo workflows stay accessible, and shared operations scale with the team.
        </p>

        <div className="card-grid" style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
          {packagingPrinciples.map((item) => (
            <div key={item.title} className="content-card">
              <h2 style={{ margin: "0 0 0.45rem", color: "var(--navy)", fontSize: "1.05rem" }}>{item.title}</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.94rem", lineHeight: 1.6 }}>{item.body}</p>
            </div>
          ))}
        </div>

        <div className="pricing-grid" style={{ marginTop: "2rem" }}>
          {plans.map((plan) => (
            <section key={plan.name} className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}>
              <p className="kicker">{plan.kicker}</p>
              <h2>{plan.name}</h2>
              <p style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0.4rem 0 1rem" }}>{plan.price}</p>
              <ul className="pricing-feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link href={plan.name === "Solo" ? "/register" : "/login"} className="pricing-cta">
                {plan.name === "Solo" ? "Start free" : plan.name === "Team" ? "Open workspace" : "Talk to sales"}
              </Link>
            </section>
          ))}
        </div>

        <div className="content-card" style={{ marginTop: "2rem", padding: "1.15rem 1.25rem" }}>
          <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
            Best fit right now
          </p>
          <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
            Strongest value for startups, SMBs, and advisors shipping AI now
          </h2>
          <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", fontSize: "0.94rem", lineHeight: 1.6, maxWidth: "70ch" }}>
            If your team needs to understand which AI laws matter, turn that into actions, and keep evidence ready for launch or diligence, the Solo and Team plans are the main path. Enterprise is available for customers with heavier identity and deployment requirements.
          </p>
        </div>
      </div>
    </main>
  );
}