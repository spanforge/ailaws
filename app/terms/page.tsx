import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Core commercial and usage terms for Spanforge Compass.",
};

const terms = [
  {
    title: "Service scope",
    body: "Spanforge Compass provides regulatory intelligence, assessment workflows, evidence packaging, templates, watchlists, and collaboration tooling for AI compliance operations. It is a software product, not a law firm, and does not provide legal advice.",
  },
  {
    title: "Customer responsibilities",
    body: "Customers are responsible for the accuracy of the information they enter, the internal decisions they make from generated outputs, and obtaining legal review where required. You must not rely on the product as a substitute for qualified legal counsel.",
  },
  {
    title: "Acceptable use",
    body: "You may not use the service to break the law, abuse shared infrastructure, probe for vulnerabilities, or upload material you do not have the right to process. Access may be suspended if usage threatens system integrity or other customers.",
  },
  {
    title: "Plans and availability",
    body: "Product packaging, seat limits, and delivery channels may vary by deployment and plan. Features marked as beta, preview, or draft may change without notice as the regulatory dataset and workflows evolve.",
  },
  {
    title: "Data and exports",
    body: "Customers retain ownership of their workspace data. Exported evidence packages, templates, and audit artifacts are provided for operational use and should be reviewed before submission to regulators, customers, or auditors.",
  },
  {
    title: "Liability",
    body: "To the maximum extent permitted by law, the service is provided on an as-available basis and excludes implied warranties. Any specific commercial commitments should be documented in a separate order form or master services agreement.",
  },
];

export default function TermsPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "860px" }}>
        <p className="kicker">Trust</p>
        <h1 style={{ margin: "0.35rem 0 0.5rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.05 }}>
          Terms of Service
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "1rem", lineHeight: 1.7 }}>
          These terms govern access to Spanforge Compass and set the baseline responsibilities for operators and customers.
        </p>

        <div className="stack" style={{ marginTop: "2rem" }}>
          {terms.map((term) => (
            <section key={term.title} className="content-card" style={{ padding: "1.25rem 1.4rem" }}>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                {term.title}
              </h2>
              <p style={{ margin: "0.65rem 0 0", color: "var(--muted)", fontSize: "0.97rem", lineHeight: 1.7 }}>
                {term.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}