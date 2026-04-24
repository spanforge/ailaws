import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Spanforge Compass handles account, product, and operational data.",
};

const sections = [
  {
    title: "What we collect",
    body: "We collect account details such as name, email address, authentication metadata, and workspace membership. When you use assessments, templates, watchlists, or evidence exports, we store the content you enter and the outputs the product generates so your team can return to them later.",
  },
  {
    title: "How we use it",
    body: "We use your data to authenticate users, save assessments, generate evidence packages, route alerts, support collaboration, and monitor service health. We do not sell customer data or use private workspace content to train public models.",
  },
  {
    title: "Subprocessors and delivery",
    body: "Operational emails such as account verification and regulatory notifications may be sent through our email provider when configured. Error telemetry may be processed by monitoring providers to help us detect incidents and resolve failures.",
  },
  {
    title: "Retention and deletion",
    body: "Account and workspace records are retained while the account is active. Users can request deletion of their workspace data, subject to any legal or contractual retention requirements that apply to audit and security records.",
  },
  {
    title: "Security",
    body: "We apply access controls, authentication checks, rate limits, and audit logging around administrative workflows. Customers remain responsible for reviewing exported evidence, templates, and legal analyses before external reliance.",
  },
  {
    title: "Contact",
    body: "For privacy requests, security concerns, or data deletion questions, contact your Spanforge Compass administrator or the operator of your deployment using the support address published for that environment.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "860px" }}>
        <p className="kicker">Trust</p>
        <h1 style={{ margin: "0.35rem 0 0.5rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.05 }}>
          Privacy Policy
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7 }}>
          This policy explains how Spanforge Compass handles account, collaboration, and compliance-workspace data.
        </p>

        <div className="stack" style={{ marginTop: "2rem" }}>
          {sections.map((section) => (
            <section key={section.title} className="content-card" style={{ padding: "1.25rem 1.4rem" }}>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                {section.title}
              </h2>
              <p style={{ margin: "0.65rem 0 0", color: "var(--muted)", fontSize: "0.97rem", lineHeight: 1.7 }}>
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}