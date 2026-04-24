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
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
        <p className="kicker">Plans</p>
        <h1 style={{ margin: "0.35rem 0 0.5rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.05 }}>
          Clear packaging for solo, team, and enterprise use
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "760px" }}>
          Public research stays open. Saved work, shared operations, and production-grade deployment controls scale with your team.
        </p>

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
      </div>
    </main>
  );
}