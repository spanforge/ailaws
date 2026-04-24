import Link from "next/link";
import { laws } from "@/lib/lexforge-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sector AI Compliance Guides",
  description: "Industry-specific AI compliance guidance for Healthcare, HR, Financial Services, Public Sector, Legal Tech, and Media.",
};

type SectorGuide = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  summary: string;
  keyRisks: string[];
  /** Curated slugs — must match slugs in lib/lexforge-data.ts exactly */
  lawSlugs: string[];
  actionItems: string[];
};

const SECTOR_GUIDES: SectorGuide[] = [
  {
    id: "healthcare",
    name: "Healthcare & MedTech",
    icon: "⚕",
    tagline: "Clinical AI, diagnostics, patient data",
    summary:
      "AI systems used in clinical decision support, diagnostic imaging, drug discovery, or patient triage are classified as high-risk across multiple jurisdictions. Healthcare providers and MedTech companies face obligations around transparency, human oversight, risk management, and strict data governance under both AI-specific laws and health data regulations.",
    keyRisks: [
      "Deploying unvalidated AI diagnostic tools",
      "Automated clinical decisions without human oversight",
      "Training on patient data without adequate consent",
      "Failure to maintain AI system audit logs",
    ],
    lawSlugs: [
      "eu-ai-act",                    // clinical AI listed as Annex III high-risk
      "eu-gdpr-ai",                   // patient data, DPIA, Art. 22 automated decisions
      "nist-ai-rmf",                  // risk management framework widely adopted in health
      "us-ai-executive-order-14110",  // US health AI safety directives
      "eu-ai-liability-directive",    // liability for defective medical AI
      "iso-iec-42001",                // AI management system standard
      "australia-ai-safety-standard", // mandatory safety guardrails
    ],
    actionItems: [
      "Map every AI model to the EU AI Act Annex III high-risk categories",
      "Establish a technical documentation file for each clinical AI system",
      "Implement human oversight protocols before any automated clinical recommendation",
      "Conduct a Data Protection Impact Assessment (DPIA) under GDPR for patient AI processing",
    ],
  },
  {
    id: "hr",
    name: "HR & Recruiting",
    icon: "👥",
    tagline: "Hiring AI, video screening, salary models",
    summary:
      "AI-assisted hiring, resume screening, video interview analysis, and compensation modelling are high-risk uses under multiple laws. NYC Local Law 144 requires annual bias audits. Illinois prohibits AI video interview analysis without explicit consent. Colorado and the EU AI Act impose algorithmic discrimination obligations.",
    keyRisks: [
      "Automated resume screening with unaudited bias",
      "AI video interviews without consent or disclosure",
      "Salary prediction models that discriminate by protected class",
      "Promotion or performance scoring without explainability",
    ],
    lawSlugs: [
      "nyc-local-law-144",              // bias audits for automated employment decisions
      "illinois-ai-video-interview-act", // consent + disclosure for AI video interviews
      "colorado-ai-act",                // algorithmic discrimination in hiring
      "eu-ai-act",                      // employment decisions = Annex III high-risk
      "us-algorithmic-accountability-act", // impact assessments for hiring tools
      "eu-gdpr-ai",                     // profiling & Art. 22 automated decisions
    ],
    actionItems: [
      "Commission an annual bias audit for all automated employment tools (NYC LL 144 requirement)",
      "Obtain explicit written consent before using AI video analysis (Illinois requirement)",
      "Provide plain-language notice to all candidates that AI is used in hiring",
      "Build an appeals process for candidates rejected by automated systems",
    ],
  },
  {
    id: "financial-services",
    name: "Financial Services",
    icon: "🏦",
    tagline: "Credit scoring, fraud detection, robo-advice",
    summary:
      "Credit scoring, fraud detection, AML screening, and robo-advisors all involve automated decisions with significant impact on individuals. Financial services firms must comply with GDPR's profiling rules, consumer protection laws, and sector-specific guidance from regulators. The EU AI Act classifies credit scoring as high-risk.",
    keyRisks: [
      "Credit decisions made without explainability",
      "AML/fraud models with opaque false-positive rates",
      "Robo-advisors operating without required disclosures",
      "Biometric authentication without proper consent",
    ],
    lawSlugs: [
      "eu-ai-act",                       // credit scoring = Annex III high-risk
      "eu-gdpr-ai",                      // profiling, Art. 22 automated decisions
      "us-algorithmic-accountability-act", // automated financial decision accountability
      "nist-ai-rmf",                     // risk management widely used in financial sector
      "eu-ai-liability-directive",       // AI product liability for financial institutions
      "india-dpdp-act",                  // financial data protection in India
      "brazil-ai-bill",                  // Brazil AI regulation covers financial sector
    ],
    actionItems: [
      "Implement a 'right to explanation' for all automated credit or insurance decisions",
      "Document model performance metrics (accuracy, false positive rate) and review quarterly",
      "Conduct DPIA for all profiling activities under GDPR Art. 22",
      "Register high-risk AI systems with EU authorities where required",
    ],
  },
  {
    id: "public-sector",
    name: "Government & Public Sector",
    icon: "🏛",
    tagline: "Benefits, law enforcement, border control",
    summary:
      "AI deployed by or for government — benefits eligibility, predictive policing, border screening, or child welfare — faces the strictest rules globally. Many uses are outright prohibited under the EU AI Act. Human rights obligations attach under UN and G7 frameworks. Procurement of AI by public bodies triggers additional transparency duties.",
    keyRisks: [
      "Real-time biometric surveillance in public spaces (banned in EU)",
      "Predictive policing or profiling without oversight mechanisms",
      "Automated benefits denial without human review",
      "AI recruitment for civil service without bias audits",
    ],
    lawSlugs: [
      "eu-ai-act",                       // prohibited uses; law enforcement AI rules
      "us-ai-executive-order-14110",     // US federal government AI governance
      "nist-ai-rmf",                     // adopted by US federal agencies
      "us-algorithmic-accountability-act", // government automated decision accountability
      "canada-aida",                     // Canadian government AI systems
      "ontario-ai-ethics-framework",     // Canadian public sector AI ethics
      "un-ai-governance-framework",      // international government AI governance
    ],
    actionItems: [
      "Audit all AI tools for prohibited use cases under EU AI Act Art. 5 before deployment",
      "Establish an AI register: list every AI system used in public-facing decisions",
      "Mandate human review for any AI decision that determines access to public benefits",
      "Publish an AI transparency report annually",
    ],
  },
  {
    id: "legal-tech",
    name: "Legal Tech & RegTech",
    icon: "⚖",
    tagline: "Contract AI, legal research, compliance tools",
    summary:
      "AI used in legal advice, contract review, legal research, or compliance scoring must meet high standards of accuracy and explainability. Using AI to assist in legal proceedings is regulated under the EU AI Act. Law firms and RegTech vendors must ensure their tools do not constitute unlicensed legal practice and maintain audit trails.",
    keyRisks: [
      "AI contract review that misses jurisdiction-specific clauses",
      "Automated regulatory risk scoring without transparent methodology",
      "AI-generated legal documents without lawyer review",
      "Advising clients based on GPAI outputs without verification",
    ],
    lawSlugs: [
      "eu-ai-act",                   // legal proceedings AI = high-risk; GPAI Art. 53 obligations
      "eu-gdpr-ai",                  // data processing in legal and compliance work
      "eu-ai-liability-directive",   // liability framework that legal AI must track
      "eu-product-liability-directive", // defective AI product claims
      "nist-ai-rmf",                 // risk framework widely adopted in compliance tools
      "iso-iec-42001",               // AI management system standard
    ],
    actionItems: [
      "Label all AI-generated legal content clearly to avoid professional conduct issues",
      "Maintain version-controlled audit logs of AI models used in client work",
      "Implement human-in-the-loop review before any AI output is delivered to clients",
      "Review GPAI model providers' transparency obligations under EU AI Act Art. 53",
    ],
  },
  {
    id: "media",
    name: "Media, Content & Advertising",
    icon: "📡",
    tagline: "Deepfakes, recommendations, ad targeting",
    summary:
      "Generative AI for content creation, recommendation algorithms, deepfake generation, and AI-targeted advertising are under intense regulatory scrutiny. China requires watermarking of AI-generated content. The EU AI Act prohibits manipulative AI systems. Various national laws impose algorithmic transparency requirements on large platforms.",
    keyRisks: [
      "Generating deepfakes without disclosure (regulated in China, EU, Colorado)",
      "Recommendation algorithms that amplify harmful content",
      "Behavioural ad targeting that exploits psychological vulnerabilities",
      "AI-generated news without disclosure labels",
    ],
    lawSlugs: [
      "eu-ai-act",                    // synthetic media disclosure; manipulative AI banned
      "china-ai-regulations",         // deepfake watermarking; generative AI content labelling
      "us-ai-executive-order-14110",  // authentication standards for synthetic content
      "california-ab-2013",           // training data transparency for generative AI
      "colorado-ai-act",              // AI-generated political content rules
      "un-ai-governance-framework",   // international AI content standards
    ],
    actionItems: [
      "Add clear 'AI-generated' labels to all synthetic content before publication",
      "Implement content provenance tracking (C2PA standard recommended)",
      "Audit recommendation algorithms for amplification of illegal or harmful content",
      "Obtain explicit consent before using personal data to train generative AI models",
    ],
  },
];

const STATUS_LABEL: Record<string, string> = {
  in_force: "In Force",
  enacted: "Enacted",
  proposed: "Proposed",
  draft: "Draft",
  repealed: "Repealed",
};

const STATUS_COLOR: Record<string, string> = {
  in_force: "var(--green)",
  enacted: "var(--primary)",
  proposed: "var(--amber)",
  draft: "var(--muted)",
  repealed: "var(--red)",
};

const STATUS_BG: Record<string, string> = {
  in_force: "var(--green-light)",
  enacted: "var(--primary-light)",
  proposed: "var(--amber-light)",
  draft: "var(--surface-alt)",
  repealed: "var(--red-light)",
};

export default function GuidesPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="kicker">By industry</p>
          <h1 style={{ margin: "0.4rem 0 0.5rem", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            Sector Compliance Guides
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "55ch" }}>
            AI laws affect different industries differently. Use these guides to understand your obligations by sector, with the most relevant laws highlighted.
          </p>
        </div>

        {/* Sector jump-nav grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem", marginBottom: "3rem" }}>
          {SECTOR_GUIDES.map((g) => (
            <a key={g.id} href={`#${g.id}`} style={{ textDecoration: "none" }}>
              <div className="content-card" style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <span style={{ fontSize: "1.5rem" }}>{g.icon}</span>
                <div>
                  <strong style={{ color: "var(--navy)", fontSize: "0.95rem" }}>{g.name}</strong>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>{g.tagline}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Full sector guides */}
        {SECTOR_GUIDES.map((guide) => {
          // Build law list from curated slugs — preserves the defined order
          const relevantLaws = guide.lawSlugs
            .map((slug) => laws.find((l) => l.slug === slug))
            .filter((l): l is (typeof laws)[number] => l !== undefined);

          return (
            <section key={guide.id} id={guide.id} style={{ marginBottom: "3.5rem", scrollMarginTop: "5rem" }}>
              {/* Sector header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--line)" }}>
                <span style={{ fontSize: "2rem" }}>{guide.icon}</span>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>{guide.name}</h2>
                  <p style={{ margin: "0.1rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{guide.tagline}</p>
                </div>
              </div>

              <div className="article-layout">
                {/* Left col */}
                <div>
                  <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>{guide.summary}</p>

                  {/* Key risks */}
                  <div className="callout" style={{ marginBottom: "1.5rem" }}>
                    <strong style={{ color: "var(--navy)", fontSize: "0.9rem" }}>Key compliance risks</strong>
                    <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.2rem", display: "grid", gap: "0.4rem" }}>
                      {guide.keyRisks.map((r, i) => (
                        <li key={i} style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.5 }}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Action items */}
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>Priority action items</h3>
                  <div className="stack">
                    {guide.actionItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: "var(--surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--line)" }}>
                        <span style={{ flexShrink: 0, width: "1.4rem", height: "1.4rem", borderRadius: "50%", background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>
                          {i + 1}
                        </span>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.55 }}>{item}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1.5rem" }}>
                    <Link href="/assess" className="button button--primary">
                      Run compliance assessment →
                    </Link>
                  </div>
                </div>

                {/* Right col — relevant laws */}
                <aside>
                  <div className="sidebar-card">
                    <h3 style={{ marginBottom: "0.75rem" }}>Relevant laws ({relevantLaws.length})</h3>
                    <div className="stack">
                      {relevantLaws.map((law) => (
                        <Link key={law.slug} href={`/laws/${law.slug}`} style={{ textDecoration: "none" }}>
                          <div style={{ padding: "0.6rem 0.75rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--line)", cursor: "pointer", background: "var(--surface)", transition: "background 0.12s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem" }}>
                              <strong style={{ fontSize: "0.85rem", lineHeight: 1.3 }}>{law.short_title}</strong>
                              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: STATUS_COLOR[law.status] ?? "var(--muted)", background: STATUS_BG[law.status] ?? "var(--surface-alt)", padding: "0.1rem 0.4rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
                                {STATUS_LABEL[law.status] ?? law.status}
                              </span>
                            </div>
                            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>{law.jurisdiction}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link href="/compare" className="button" style={{ display: "block", marginTop: "0.75rem", textAlign: "center", textDecoration: "none" }}>
                      Compare these laws side-by-side →
                    </Link>
                  </div>
                </aside>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
