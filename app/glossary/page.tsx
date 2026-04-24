import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Law Glossary",
  description: "Plain-English definitions of key terms in AI regulation — from High-Risk AI and GPAI to DPIA, Automated Decision-Making, and more.",
};

type GlossaryEntry = {
  term: string;
  shortDef: string;
  detail: string;
  lawRefs?: string[];  // which laws reference this concept
  category: string;
};

const ENTRIES: GlossaryEntry[] = [
  // ── Core AI Concepts ──────────────────────────────────────
  {
    category: "Core AI Concepts",
    term: "AI System",
    shortDef: "A machine-based system that produces outputs — predictions, recommendations, decisions — from a given set of objectives.",
    detail:
      "The EU AI Act defines an AI system as a 'machine-based system designed to operate with varying levels of autonomy, that may exhibit adaptiveness after deployment, and that, for explicit or implicit objectives, infers from inputs how to generate outputs such as predictions, content, recommendations, or decisions that can influence physical or virtual environments.' Not all software is an AI system — it must produce inferred outputs, not just follow fixed rules.",
    lawRefs: ["EU AI Act", "OECD AI Principles", "NIST AI RMF"],
  },
  {
    category: "Core AI Concepts",
    term: "General Purpose AI (GPAI)",
    shortDef: "A foundation model (like GPT-4, Claude, Gemini) trained on large datasets that can be applied to many tasks.",
    detail:
      "GPAI models are trained at scale and can be fine-tuned or prompted for diverse purposes — text, code, images, and more. The EU AI Act imposes specific obligations on GPAI providers: technical documentation, transparency to downstream users, and, for the most capable models, systemic risk assessments and security red-teaming. GPAI with systemic risk (exceeding 10^25 FLOPs training compute) faces additional obligations.",
    lawRefs: ["EU AI Act", "US AI Executive Order"],
  },
  {
    category: "Core AI Concepts",
    term: "High-Risk AI System",
    shortDef: "An AI system that poses significant risk to health, safety, or fundamental rights — subject to the strictest compliance obligations.",
    detail:
      "The EU AI Act defines high-risk AI systems in Annex III. Examples: AI used in recruitment, credit scoring, education, law enforcement, migration, access to essential services, biometric identification, and medical devices. High-risk systems must undergo a conformity assessment, maintain technical documentation, implement risk management, ensure human oversight, achieve high accuracy/robustness, and be logged for auditability.",
    lawRefs: ["EU AI Act", "Colorado AI Act", "NIST AI RMF"],
  },
  {
    category: "Core AI Concepts",
    term: "Foundation Model",
    shortDef: "A large AI model trained on vast data that serves as the base for building many downstream applications.",
    detail:
      "Foundation models (also called base models or frontier models) are trained on diverse datasets using self-supervised learning. They develop emergent capabilities not explicitly programmed. GPT-4, Llama, Gemini, and Claude are examples. Regulatory focus is increasing: providers may bear obligations even when they don't directly deploy the final application, because their model capabilities flow into downstream products.",
    lawRefs: ["EU AI Act", "US AI Executive Order"],
  },

  // ── Risk & Classification ──────────────────────────────────
  {
    category: "Risk & Classification",
    term: "Risk Classification",
    shortDef: "The process of categorising an AI system by the level of risk it poses, which determines its compliance obligations.",
    detail:
      "The EU AI Act uses a four-tier pyramid: (1) Unacceptable risk — banned outright (e.g., social scoring, real-time biometric surveillance in public). (2) High-risk — Annex III list with extensive obligations. (3) Limited risk — transparency duties only (e.g., chatbots must identify themselves as AI). (4) Minimal/no risk — no mandatory obligations. Understanding your system's classification is the first step in any compliance programme.",
    lawRefs: ["EU AI Act", "Colorado AI Act"],
  },
  {
    category: "Risk & Classification",
    term: "Prohibited AI Practices",
    shortDef: "Uses of AI that are banned outright because their risks to fundamental rights are unacceptable.",
    detail:
      "Under the EU AI Act Art. 5, prohibited uses include: subliminal manipulation that harms people; exploitation of vulnerabilities (age, disability, social situation); social scoring by public authorities; real-time remote biometric identification in public spaces (with narrow law enforcement exceptions); emotion recognition in workplaces or education; biometric categorisation inferring race, religion, sexual orientation; predictive policing based on profiling alone. Violations carry the highest fine tier (€35M or 7% of turnover).",
    lawRefs: ["EU AI Act"],
  },
  {
    category: "Risk & Classification",
    term: "Conformity Assessment",
    shortDef: "A process by which a high-risk AI system is verified to meet legal requirements before being placed on the market.",
    detail:
      "For most high-risk AI systems, the developer can self-assess conformity against harmonised standards. For certain systems (biometric identification, safety components of critical infrastructure), third-party notified body review is required. The assessment covers: technical documentation, quality management system, data governance, transparency, human oversight, accuracy, robustness, and cybersecurity.",
    lawRefs: ["EU AI Act"],
  },

  // ── Data Rights & Privacy ──────────────────────────────────
  {
    category: "Data Rights & Privacy",
    term: "Automated Decision-Making (ADM)",
    shortDef: "A decision made wholly by an algorithm — without human review — that has a legal or similarly significant effect on a person.",
    detail:
      "GDPR Article 22 gives individuals the right not to be subject to solely automated decisions that produce legal or similarly significant effects. This includes credit decisions, insurance pricing, recruitment filtering, or benefits eligibility. Controllers must provide meaningful information about the logic involved, allow individuals to request human review, and allow individuals to contest decisions. Similar rights exist in Brazil's LGPD, California's CCPA, and the EU AI Act.",
    lawRefs: ["EU GDPR", "Brazil LGPD", "California CCPA", "EU AI Act"],
  },
  {
    category: "Data Rights & Privacy",
    term: "Data Protection Impact Assessment (DPIA)",
    shortDef: "A systematic analysis of the privacy risks of a new processing activity — required before deploying high-risk data processing.",
    detail:
      "GDPR Article 35 mandates a DPIA when processing is likely to result in high risk — including systematic profiling, large-scale processing of special category data, or systematic monitoring of public spaces. A DPIA must describe the processing, assess necessity and proportionality, identify and assess risks to data subjects, and document measures to mitigate those risks. Many AI systems require a DPIA before deployment.",
    lawRefs: ["EU GDPR"],
  },
  {
    category: "Data Rights & Privacy",
    term: "Special Category Data",
    shortDef: "Sensitive personal data (race, health, religion, sexual orientation, biometrics) that receives the strongest protections under GDPR.",
    detail:
      "GDPR Art. 9 defines special categories: racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data (for unique identification), health data, sex life/sexual orientation. Processing requires explicit consent or another narrow lawful basis. AI systems trained on or making inferences from special category data face the highest data protection obligations.",
    lawRefs: ["EU GDPR", "India DPDP Act"],
  },
  {
    category: "Data Rights & Privacy",
    term: "Biometric Data",
    shortDef: "Physical or behavioural characteristics (face, fingerprint, voice, gait) processed to uniquely identify a person.",
    detail:
      "Biometric data is special category data under GDPR, requiring explicit consent for processing. Under the EU AI Act, real-time remote biometric identification in public spaces is prohibited (with narrow exceptions for law enforcement). Biometric categorisation systems that infer race, sexual orientation, or political opinions are banned. Many US states (Illinois BIPA, Texas, Washington) also regulate biometric data collection.",
    lawRefs: ["EU AI Act", "EU GDPR", "Illinois AI Video Interview Act"],
  },

  // ── Transparency & Accountability ──────────────────────────
  {
    category: "Transparency & Accountability",
    term: "Algorithmic Transparency",
    shortDef: "The obligation to explain, disclose, or make understandable how an AI system reaches its outputs.",
    detail:
      "Transparency obligations vary by law. At minimum, many laws require: disclosing that AI is being used, explaining the main factors influencing a decision, and providing intelligible information (not raw model weights). The EU AI Act requires technical documentation, EU database registration, and instructions for use for high-risk systems. GDPR Art. 13/14 requires information about automated decision logic. NYC LL 144 requires public bias audit summaries.",
    lawRefs: ["EU AI Act", "EU GDPR", "NYC Local Law 144"],
  },
  {
    category: "Transparency & Accountability",
    term: "Explainability",
    shortDef: "The capacity to explain in human-understandable terms why an AI system produced a particular output.",
    detail:
      "Explainability differs from transparency: transparency relates to disclosure, explainability to comprehensibility. For high-risk AI decisions, individuals must receive a meaningful explanation — not just 'an algorithm decided.' Techniques include: LIME (local interpretable model-agnostic explanations), SHAP values, attention maps, and counterfactual explanations. The EU AI Act requires high-risk systems to be interpretable to their human overseers.",
    lawRefs: ["EU AI Act", "NIST AI RMF", "EU GDPR"],
  },
  {
    category: "Transparency & Accountability",
    term: "Algorithmic Accountability",
    shortDef: "The principle that organisations deploying AI are responsible for the outcomes and impacts of their systems.",
    detail:
      "Accountability requires that someone is responsible when AI systems cause harm. This includes: designating a responsible person or function; maintaining records of AI decision-making; logging system performance; conducting audits; and having remediation processes. The EU AI Act requires a quality management system and post-market monitoring for high-risk systems. The NIST AI RMF structures accountability through its GOVERN function.",
    lawRefs: ["EU AI Act", "NIST AI RMF", "OECD AI Principles"],
  },
  {
    category: "Transparency & Accountability",
    term: "Human Oversight",
    shortDef: "Mechanisms that allow humans to monitor, intervene in, and override AI system outputs.",
    detail:
      "The EU AI Act requires that high-risk AI systems be designed so that humans can understand their capabilities and limitations, monitor them during operation, and, if necessary, override or shut them down. This is not merely human-in-the-loop — it requires meaningful oversight, not rubber-stamping. Automation bias (over-reliance on AI) is itself a risk that oversight mechanisms must guard against.",
    lawRefs: ["EU AI Act", "NIST AI RMF"],
  },

  // ── Data Governance ────────────────────────────────────────
  {
    category: "Data Governance",
    term: "Data Governance",
    shortDef: "Policies and practices for managing data quality, security, and appropriate use across the data lifecycle.",
    detail:
      "For AI systems, data governance covers: data collection (lawful, fair, adequate); training data quality (representativeness, accuracy, completeness); data lineage (provenance tracking); data minimisation (using only what is needed); data retention and deletion; and data security. The EU AI Act requires high-risk systems to have training, validation, and testing data sets that meet quality criteria and are not infected with errors that could bias outcomes.",
    lawRefs: ["EU AI Act", "EU GDPR", "NIST AI RMF"],
  },
  {
    category: "Data Governance",
    term: "Data Minimisation",
    shortDef: "The principle that only data necessary for a specific purpose should be collected and processed.",
    detail:
      "GDPR Art. 5(1)(c) requires that personal data be 'adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed.' For AI, this means: don't collect data fields that aren't needed to train the model; don't retain training data longer than necessary; use synthetic data or anonymised data where possible instead of personal data.",
    lawRefs: ["EU GDPR", "India DPDP Act"],
  },
  {
    category: "Data Governance",
    term: "Data Principal",
    shortDef: "The individual to whom personal data relates — called a 'data subject' in GDPR, 'consumer' in CCPA.",
    detail:
      "India's DPDP Act uses 'Data Principal' for the individual. Other jurisdictions use 'Data Subject' (GDPR/UK GDPR), 'Consumer' (CCPA), or 'Affected Person.' All share common rights: access, correction, deletion, portability, and the right to object to automated decisions. Under India's DPDP Act, Data Principals can consent to use of their data and withdraw that consent.",
    lawRefs: ["India DPDP Act", "EU GDPR", "Brazil LGPD"],
  },

  // ── Emerging Concepts ──────────────────────────────────────
  {
    category: "Emerging Concepts",
    term: "Deepfake",
    shortDef: "AI-generated or manipulated synthetic media — images, video, or audio — that depicts real people or events that didn't occur.",
    detail:
      "Deepfakes are generated using generative adversarial networks (GANs) or diffusion models. They range from harmless entertainment to election interference and non-consensual intimate imagery. Regulation is rapidly evolving: China requires watermarking of AI-generated content. The EU AI Act requires disclosure of synthetic media. Several US states criminalise non-consensual deepfake intimate images. The US AI Executive Order directed NIST to develop deepfake standards.",
    lawRefs: ["EU AI Act", "China AI Regulation", "US AI Executive Order"],
  },
  {
    category: "Emerging Concepts",
    term: "Systemic Risk",
    shortDef: "Risk arising from the most powerful GPAI models — their capabilities may have widespread societal impact if misused.",
    detail:
      "The EU AI Act designates GPAI models as posing systemic risk if they exceed 10^25 FLOPs training compute (the approximate threshold for current frontier models like GPT-4). Providers of such models face additional obligations: adversarial testing (red-teaming), incident reporting to the EU AI Office, cybersecurity measures, and energy efficiency reporting. The list of systemic-risk models is determined by the EU AI Office.",
    lawRefs: ["EU AI Act"],
  },
  {
    category: "Emerging Concepts",
    term: "AI Sandboxing / Regulatory Sandbox",
    shortDef: "A supervised testing environment where innovators can trial AI products under regulatory supervision before full market release.",
    detail:
      "The EU AI Act mandates that Member States establish AI regulatory sandboxes by 2026. These allow startups and SMEs to test high-risk AI systems in a controlled environment with relaxed compliance obligations under regulatory oversight. Sandboxes must be free of charge, run for up to 12 months (extendable), and cover systems intended for use in sectors like health, energy, and transport.",
    lawRefs: ["EU AI Act"],
  },
  {
    category: "Emerging Concepts",
    term: "Algorithmic Discrimination",
    shortDef: "When an AI system produces outputs that systematically disadvantage individuals based on protected characteristics.",
    detail:
      "Discrimination may be direct (using a protected attribute as an input) or indirect (using a proxy variable that correlates with a protected characteristic). A hiring model trained on historical data may perpetuate historical biases. Colorado's AI Act, NYC LL 144, and the EU AI Act all prohibit or require mitigation of algorithmic discrimination. Bias audits — comparing model outcomes across demographic groups — are the primary detection mechanism.",
    lawRefs: ["EU AI Act", "Colorado AI Act", "NYC Local Law 144"],
  },
  {
    category: "Emerging Concepts",
    term: "AI Literacy",
    shortDef: "The ability to understand AI systems well enough to use them appropriately, identify risks, and make informed decisions.",
    detail:
      "The EU AI Act imposes an AI literacy obligation on providers and deployers: they must ensure their staff have sufficient AI literacy to fulfil their roles. This doesn't mean everyone must understand neural networks — it means users of AI systems should understand their purpose, limitations, and when to escalate to human judgment. AI literacy training is increasingly a compliance requirement, not just an HR initiative.",
    lawRefs: ["EU AI Act"],
  },
];

const CATEGORIES = [...new Set(ENTRIES.map((e) => e.category))];

export default function GlossaryPage() {
  const byCategory: Record<string, GlossaryEntry[]> = {};
  for (const entry of ENTRIES) {
    (byCategory[entry.category] ??= []).push(entry);
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="kicker">Reference</p>
          <h1 style={{ margin: "0.4rem 0 0.5rem", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            AI Law Glossary
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "55ch" }}>
            Plain-English definitions of key terms in AI regulation. {ENTRIES.length} terms across {CATEGORIES.length} categories.
          </p>
        </div>

        {/* Category nav */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "2.5rem" }}>
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`#cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="chip"
            >
              {cat}
            </a>
          ))}
        </div>

        {/* Entries by category */}
        {CATEGORIES.map((cat) => (
          <section key={cat} id={`cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} style={{ marginBottom: "3rem", scrollMarginTop: "5rem" }}>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--line)" }}>
              {cat}
            </h2>
            <div className="stack">
              {(byCategory[cat] ?? []).map((entry) => (
                <GlossaryCard key={entry.term} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function GlossaryCard({ entry }: { entry: GlossaryEntry }) {
  return (
    <div className="content-card" style={{ padding: "1.15rem 1.25rem" }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.3rem" }}>
        {entry.term}
      </h3>
      <p style={{ margin: "0 0 0.75rem", fontWeight: 500, lineHeight: 1.5, fontSize: "0.95rem" }}>
        {entry.shortDef}
      </p>
      <p style={{ margin: "0 0 0.75rem", color: "var(--muted)", lineHeight: 1.7, fontSize: "0.875rem" }}>
        {entry.detail}
      </p>
      {entry.lawRefs && entry.lawRefs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", alignSelf: "center", marginRight: "0.25rem" }}>Referenced in:</span>
          {entry.lawRefs.map((ref) => (
            <span key={ref} className="tag">
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
