// ============================================================
//  LexForge — AI Laws Seed Data
// ============================================================

export type Obligation = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  citation: string;
  action_required: string;
  spanforge_controls?: string[];
};

export type ApplicabilityRule = {
  id: string;
  name: string;
  rule_json: RuleGroup;
  weight: number;
};

export type RuleCondition = {
  fact: string;
  operator: "contains" | "in" | "equals" | "gt" | "lt" | "gte" | "lte" | "not_equals";
  value: string | string[] | number | boolean;
};

export type RuleGroup = {
  any?: Array<RuleCondition | RuleGroup>;
  all?: Array<RuleCondition | RuleGroup>;
};

export type Law = {
  id: string;
  slug: string;
  title: string;
  short_title: string;
  jurisdiction: string;
  jurisdiction_code: string;
  issuing_body: string;
  status: "enacted" | "in_force" | "proposed" | "draft" | "repealed";
  content_type: "regulation" | "directive" | "act" | "executive_order" | "framework" | "guideline";
  summary_short: string;
  summary_long: string;
  official_url: string;
  adopted_date: string;
  effective_date: string;
  topics: string[];
  obligations: Obligation[];
  applicability_rules: ApplicabilityRule[];
  freshness_sla_days?: number;
  draft_status?: "draft" | "published";
  last_reviewed_at?: string; // ISO date string
};

export const laws: Law[] = [
  {
    id: "law-001",
    slug: "eu-ai-act",
    title: "EU Artificial Intelligence Act",
    short_title: "EU AI Act",
    jurisdiction: "European Union",
    jurisdiction_code: "EU",
    issuing_body: "European Parliament & Council",
    status: "in_force",
    content_type: "regulation",
    adopted_date: "2024-03-13",
    effective_date: "2024-08-01",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    topics: ["Risk Classification", "High-Risk AI", "GPAI", "Transparency", "Conformity Assessment"],
    summary_short: "The world's first comprehensive AI regulation, introducing a risk-based framework that classifies AI systems and imposes obligations proportional to risk.",
    summary_long: "The EU AI Act establishes a harmonized legal framework for AI across the EU. It takes a risk-based approach: unacceptable risk AI is banned outright (e.g. social scoring by governments, real-time biometric surveillance in public spaces). High-risk AI systems—used in critical infrastructure, education, employment, law enforcement, migration, administration of justice—must meet strict requirements including human oversight, transparency, accuracy, robustness, and conformity assessments before market placement. Limited-risk AI (like chatbots) must disclose AI interaction. Minimal-risk AI faces no mandatory obligations. General-purpose AI models above 10^25 FLOPs face additional systemic risk requirements.",
    obligations: [
      {
        id: "eu-ai-001",
        title: "Risk classification assessment",
        description: "Determine and document the risk category of your AI system using the EU AI Act classification framework before deployment.",
        category: "Risk Management",
        priority: "critical",
        citation: "Art. 6, Annex III",
        action_required: "Complete a formal risk classification analysis; document reasoning; update if system changes significantly.",
        spanforge_controls: ["SF-GOV-01: AI Risk Registry", "SF-GOV-02: System Classification Log"],
      },
      {
        id: "eu-ai-002",
        title: "Technical documentation (high-risk)",
        description: "Prepare and maintain comprehensive technical documentation covering system design, training data, performance metrics, and intended purpose.",
        category: "Documentation",
        priority: "critical",
        citation: "Art. 11, Annex IV",
        action_required: "Draft and maintain technical documentation before market placement. Update on material changes.",
        spanforge_controls: ["SF-DOC-01: Model Card Template", "SF-DOC-02: System Architecture Record"],
      },
      {
        id: "eu-ai-003",
        title: "Conformity assessment",
        description: "Conduct a conformity assessment (self-assessment or third-party) to verify compliance before placing on the EU market.",
        category: "Compliance",
        priority: "critical",
        citation: "Art. 43",
        action_required: "Complete conformity assessment; obtain CE marking; register in EU database for high-risk AI.",
        spanforge_controls: ["SF-COMP-01: Conformity Assessment Checklist", "SF-COMP-02: CE Registration Workflow"],
      },
      {
        id: "eu-ai-004",
        title: "Human oversight measures",
        description: "Implement effective human oversight mechanisms enabling operators to understand, monitor, and intervene in AI system outputs.",
        category: "Governance",
        priority: "high",
        citation: "Art. 14",
        action_required: "Design and implement human oversight interfaces; test and validate override capabilities; train operators.",
        spanforge_controls: ["SF-GOV-03: Human-in-the-Loop Policy", "SF-GOV-04: Operator Training Record"],
      },
      {
        id: "eu-ai-005",
        title: "Transparency obligations",
        description: "Disclose to users when they are interacting with an AI system (chatbots, deepfakes, emotion recognition).",
        category: "Transparency",
        priority: "high",
        citation: "Art. 50",
        action_required: "Add clear AI disclosure notices at point of interaction. For deepfake content, label output.",
        spanforge_controls: ["SF-TRANS-01: AI Disclosure Banner", "SF-TRANS-02: Deepfake Label Policy"],
      },
      {
        id: "eu-ai-006",
        title: "Data governance requirements",
        description: "Implement data governance practices for training, validation, and testing datasets covering relevance, representativeness, and freedom from bias.",
        category: "Data Governance",
        priority: "high",
        citation: "Art. 10",
        action_required: "Audit training data sources; document data governance policies; address identified biases.",
        spanforge_controls: ["SF-DATA-01: Training Data Audit", "SF-DATA-02: Bias Assessment Report"],
      },
      {
        id: "eu-ai-007",
        title: "Prohibited AI practices ban",
        description: "Ensure your AI system does not engage in any of the prohibited practices: subliminal manipulation, exploitation of vulnerabilities, real-time biometric surveillance.",
        category: "Prohibitions",
        priority: "critical",
        citation: "Art. 5",
        action_required: "Review system against prohibited use cases list; obtain legal confirmation of compliance.",
        spanforge_controls: ["SF-GOV-05: Prohibited Use Review", "SF-LEGAL-01: Legal Clearance Sign-off"],
      },
      {
        id: "eu-ai-008",
        title: "GPAI model transparency",
        description: "General-purpose AI model providers must publish summaries of training data, comply with copyright, and maintain technical documentation.",
        category: "GPAI Obligations",
        priority: "high",
        citation: "Art. 53",
        action_required: "Publish training data summary; implement copyright policy; maintain model card documentation.",
        spanforge_controls: ["SF-DOC-03: GPAI Model Card", "SF-LEGAL-02: Copyright Compliance Policy"],
      },
    ],
    applicability_rules: [
      {
        id: "rule-eu-001",
        name: "EU market deployment",
        weight: 0.5,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "EU" },
            { fact: "hq_region", operator: "equals", value: "EU" },
          ],
        },
      },
      {
        id: "rule-eu-002",
        name: "AI system present",
        weight: 0.4,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
      {
        id: "rule-eu-003",
        name: "High-risk use case",
        weight: 0.1,
        rule_json: {
          any: [
            { fact: "use_cases", operator: "contains", value: "hr" },
            { fact: "use_cases", operator: "contains", value: "recruitment" },
            { fact: "use_cases", operator: "contains", value: "credit_scoring" },
            { fact: "use_cases", operator: "contains", value: "medical" },
            { fact: "use_cases", operator: "contains", value: "law_enforcement" },
            { fact: "use_cases", operator: "contains", value: "biometric" },
          ],
        },
      },
    ],
  },
  {
    id: "law-002",
    slug: "us-ai-executive-order-14110",
    title: "Executive Order on Safe, Secure, and Trustworthy AI",
    short_title: "US AI Executive Order",
    jurisdiction: "United States",
    jurisdiction_code: "US",
    issuing_body: "White House / Biden Administration",
    status: "enacted",
    content_type: "executive_order",
    adopted_date: "2023-10-30",
    effective_date: "2023-10-30",
    official_url: "https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence",
    topics: ["Safety", "Security", "National Security", "Civil Rights", "Privacy", "Workforce"],
    summary_short: "Landmark US executive action directing federal agencies to develop AI safety standards, with particular focus on dual-use foundation models and critical infrastructure.",
    summary_long: "Executive Order 14110 is the most comprehensive US action on AI to date. It directed NIST to develop AI safety and security standards, required developers of powerful dual-use foundation models to share safety test results with the US government, and established new cybersecurity protections for AI systems. It directed agencies to protect Americans from AI-enabled discrimination and fraud, advance AI safety research, promote privacy-preserving techniques, and ensure AI does not undermine workers. Federal agencies were given deadlines to produce guidance and regulations across their domains.",
    obligations: [
      {
        id: "us-eo-001",
        title: "Dual-use foundation model reporting",
        description: "Developers of large dual-use foundation models must report safety test results, red-teaming outcomes, and other critical information to the federal government.",
        category: "Reporting",
        priority: "critical",
        citation: "Section 4.2",
        action_required: "If developing models above thresholds (10^26 FLOPs), establish reporting process to Commerce Department.",
      },
      {
        id: "us-eo-002",
        title: "Cybersecurity standards compliance",
        description: "AI systems used in critical infrastructure must comply with NIST AI Risk Management Framework guidelines.",
        category: "Security",
        priority: "high",
        citation: "Section 4.3",
        action_required: "Map your AI deployment to NIST AI RMF categories; document compliance measures.",
      },
      {
        id: "us-eo-003",
        title: "Bias and non-discrimination review",
        description: "Evaluate AI systems for potential civil rights and non-discrimination violations, especially in housing, credit, healthcare, and employment.",
        category: "Civil Rights",
        priority: "high",
        citation: "Section 6",
        action_required: "Conduct algorithmic impact assessment; audit for discriminatory outputs in regulated domains.",
      },
      {
        id: "us-eo-004",
        title: "Privacy-preserving AI techniques",
        description: "Federal agencies must prioritize AI applications that use privacy-preserving techniques and advance research into these approaches.",
        category: "Privacy",
        priority: "medium",
        citation: "Section 9",
        action_required: "Evaluate privacy-enhancing technologies (differential privacy, federated learning) for applicable AI systems.",
      },
      {
        id: "us-eo-005",
        title: "AI safety research investment",
        description: "Support and advance research in AI safety, including interpretability and robustness.",
        category: "Safety",
        priority: "medium",
        citation: "Section 4.4",
        action_required: "Document safety testing methodology; participate in voluntary information-sharing on AI incidents.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-us-001",
        name: "US market or federal contractor",
        weight: 0.5,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "US" },
            { fact: "hq_region", operator: "equals", value: "US" },
          ],
        },
      },
      {
        id: "rule-us-002",
        name: "AI system present",
        weight: 0.5,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
    ],
  },
  {
    id: "law-003",
    slug: "colorado-ai-act",
    title: "Colorado Artificial Intelligence Act (SB 24-205)",
    short_title: "Colorado AI Act",
    jurisdiction: "Colorado, USA",
    jurisdiction_code: "US-CO",
    issuing_body: "Colorado General Assembly",
    status: "enacted",
    content_type: "act",
    adopted_date: "2024-05-17",
    effective_date: "2026-02-01",
    official_url: "https://leg.colorado.gov/bills/sb24-205",
    topics: ["Algorithmic Discrimination", "High-Risk AI", "Consumer Protection", "Impact Assessment"],
    summary_short: "First US state AI law requiring developers and deployers of high-risk AI to protect consumers from algorithmic discrimination through risk assessments and disclosures.",
    summary_long: "Colorado SB 24-205 requires developers and deployers of high-risk AI systems to use reasonable care to protect consumers from algorithmic discrimination. Developers must provide information and documentation to deployers. Deployers must conduct annual impact assessments, implement risk management policies, notify consumers when high-risk AI makes consequential decisions, and provide appeal mechanisms. The law covers decisions in housing, employment, education, healthcare, credit, and insurance. Both developers and deployers face penalties for violations.",
    obligations: [
      {
        id: "co-001",
        title: "Annual algorithmic impact assessment",
        description: "Deployers of high-risk AI systems must complete an annual impact assessment evaluating risks of algorithmic discrimination.",
        category: "Risk Assessment",
        priority: "critical",
        citation: "Section 6-1-1703",
        action_required: "Conduct and document annual impact assessment; make available to AG upon request.",
      },
      {
        id: "co-002",
        title: "Consumer notification for consequential decisions",
        description: "Notify consumers when a high-risk AI system makes or significantly contributes to a consequential decision affecting them.",
        category: "Transparency",
        priority: "high",
        citation: "Section 6-1-1704",
        action_required: "Implement notification system; disclose the role of AI in decisions; provide opportunity to appeal.",
      },
      {
        id: "co-003",
        title: "Risk management policy",
        description: "Implement a risk management policy and program covering the development and deployment of high-risk AI.",
        category: "Governance",
        priority: "high",
        citation: "Section 6-1-1703",
        action_required: "Draft risk management policy; assign governance ownership; review annually.",
      },
      {
        id: "co-004",
        title: "Developer documentation obligations",
        description: "Developers of high-risk AI must provide deployers with technical documentation, statements of intended uses, and information needed to conduct impact assessments.",
        category: "Documentation",
        priority: "high",
        citation: "Section 6-1-1702",
        action_required: "Prepare and provide documentation package to each deployer; update on system changes.",
      },
      {
        id: "co-005",
        title: "Consumer appeal mechanism",
        description: "Deployers must allow consumers to appeal consequential decisions made by high-risk AI and have a human review the appeal.",
        category: "Consumer Rights",
        priority: "high",
        citation: "Section 6-1-1704(1)(b)",
        action_required: "Build appeals workflow; ensure human review is available for challenged AI decisions.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-co-001",
        name: "Colorado consumers affected",
        weight: 0.5,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "US" },
            { fact: "hq_region", operator: "equals", value: "US" },
          ],
        },
      },
      {
        id: "rule-co-002",
        name: "High-risk decision domain",
        weight: 0.5,
        rule_json: {
          any: [
            { fact: "use_cases", operator: "contains", value: "hr" },
            { fact: "use_cases", operator: "contains", value: "credit_scoring" },
            { fact: "use_cases", operator: "contains", value: "insurance" },
            { fact: "use_cases", operator: "contains", value: "medical" },
            { fact: "use_cases", operator: "contains", value: "housing" },
            { fact: "use_cases", operator: "contains", value: "education" },
          ],
        },
      },
    ],
  },
  {
    id: "law-004",
    slug: "canada-aida",
    title: "Artificial Intelligence and Data Act (AIDA)",
    short_title: "Canada AIDA",
    jurisdiction: "Canada",
    jurisdiction_code: "CA",
    issuing_body: "Innovation, Science and Economic Development Canada",
    status: "proposed",
    content_type: "act",
    adopted_date: "2022-06-16",
    effective_date: "2025-01-01",
    official_url: "https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act",
    topics: ["High-Impact AI", "Transparency", "Accountability", "Biometric", "Prohibited Uses"],
    summary_short: "Canada's proposed federal AI law creating obligations for high-impact AI systems including risk assessments, human oversight, and prohibition of harmful uses.",
    summary_long: "AIDA is Part 3 of Canada's Bill C-27, the Digital Charter Implementation Act. It targets 'high-impact AI systems' defined by regulation, requiring responsible AI design (bias minimization, testing), transparency measures (publish plain-language description of AI decisions), human oversight (monitor and respond to harms), and record-keeping. It prohibits AI uses that cause serious harm or are reckless about harm, and bans AI that fraudulently influences emotional or psychological states. The AI & Data Commissioner would oversee enforcement with significant penalties.",
    obligations: [
      {
        id: "ca-001",
        title: "High-impact system identification and assessment",
        description: "Assess whether your AI system qualifies as 'high-impact' and document the assessment methodology.",
        category: "Risk Assessment",
        priority: "critical",
        citation: "AIDA Section 5",
        action_required: "Review regulatory definitions; classify system; document decision.",
      },
      {
        id: "ca-002",
        title: "Plain-language disclosure",
        description: "Publish a plain-language description of how your high-impact AI system makes or assists decisions.",
        category: "Transparency",
        priority: "high",
        citation: "AIDA Section 11",
        action_required: "Draft and publish accessible description of AI decision logic on company website.",
      },
      {
        id: "ca-003",
        title: "Harm monitoring and reporting",
        description: "Monitor system outputs for harmful outcomes; report serious harm to the AI and Data Commissioner.",
        category: "Governance",
        priority: "high",
        citation: "AIDA Section 13",
        action_required: "Implement harm monitoring system; establish incident response process; notify regulator of serious incidents.",
      },
      {
        id: "ca-004",
        title: "Bias testing before deployment",
        description: "Test high-impact AI systems for bias before deployment and document results.",
        category: "Bias Mitigation",
        priority: "high",
        citation: "AIDA Section 8",
        action_required: "Conduct pre-deployment bias testing across protected characteristics; document methodology and results.",
      },
      {
        id: "ca-005",
        title: "Record-keeping requirements",
        description: "Maintain records of high-impact AI systems, assessments conducted, and any serious harms that occur.",
        category: "Documentation",
        priority: "medium",
        citation: "AIDA Section 12",
        action_required: "Establish record-keeping system; retain documents for prescribed periods; make available to Commissioner.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-ca-001",
        name: "Canadian market",
        weight: 0.6,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "CA" },
            { fact: "hq_region", operator: "equals", value: "CA" },
          ],
        },
      },
      {
        id: "rule-ca-002",
        name: "AI system present",
        weight: 0.4,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
    ],
  },
  {
    id: "law-005",
    slug: "uk-ai-pro-innovation-framework",
    title: "UK Pro-Innovation Approach to AI Regulation",
    short_title: "UK AI Framework",
    jurisdiction: "United Kingdom",
    jurisdiction_code: "UK",
    issuing_body: "DSIT / UK Government",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2023-03-29",
    effective_date: "2023-03-29",
    official_url: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    topics: ["Principles-Based", "Sector Regulation", "Safety", "Fairness", "Explainability"],
    summary_short: "The UK's principles-based AI regulatory approach empowering existing sector regulators to apply five cross-sector AI principles to their domains.",
    summary_long: "Rather than creating a new AI-specific law, the UK directs existing regulators (FCA, ICO, CMA, MHRA, etc.) to apply five cross-cutting AI principles within their existing powers: safety, security, robustness; appropriate transparency and explainability; fairness; accountability and governance; contestability and redress. The approach is non-statutory for now, with monitoring of whether statutory underpinning is needed. High-risk AI in regulated sectors (financial services, healthcare, legal) faces the highest scrutiny. The UK also launched AI Safety Institute and Frontier AI safety commitments.",
    obligations: [
      {
        id: "uk-001",
        title: "Sector-specific AI compliance review",
        description: "Identify the sector regulator(s) governing your AI deployment and review their AI-specific guidance and expectations.",
        category: "Compliance",
        priority: "high",
        citation: "AI White Paper 2023",
        action_required: "Map AI use to regulated sectors; obtain and review regulator guidance; implement requirements.",
      },
      {
        id: "uk-002",
        title: "Explainability implementation",
        description: "Implement appropriate transparency and explainability measures so users and regulators understand how decisions are made.",
        category: "Transparency",
        priority: "high",
        citation: "AI Principle 2",
        action_required: "Document decision logic; provide user-facing explanations for significant AI decisions.",
      },
      {
        id: "uk-003",
        title: "Human oversight and accountability governance",
        description: "Establish clear accountability structures and governance for AI systems, with named responsible individuals.",
        category: "Governance",
        priority: "medium",
        citation: "AI Principle 4",
        action_required: "Assign AI accountability roles; establish review and escalation procedures.",
      },
      {
        id: "uk-004",
        title: "Fairness and non-discrimination assessment",
        description: "Assess and mitigate risks of unfair bias or discrimination in AI outputs, particularly for protected characteristics.",
        category: "Fairness",
        priority: "high",
        citation: "AI Principle 3",
        action_required: "Conduct fairness assessment; identify protected characteristics relevant to your use case; test and mitigate bias.",
      },
      {
        id: "uk-005",
        title: "Contestability and redress mechanisms",
        description: "Ensure individuals can challenge AI decisions that affect them and obtain meaningful redress.",
        category: "Consumer Rights",
        priority: "medium",
        citation: "AI Principle 5",
        action_required: "Implement complaint and appeal process for AI-influenced decisions; train staff on handling AI challenges.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-uk-001",
        name: "UK market or UK-established entity",
        weight: 0.6,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "UK" },
            { fact: "hq_region", operator: "equals", value: "UK" },
          ],
        },
      },
      {
        id: "rule-uk-002",
        name: "AI system present",
        weight: 0.4,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
    ],
  },
  {
    id: "law-006",
    slug: "china-ai-regulations",
    title: "China AI Regulatory Framework",
    short_title: "China AI Regulations",
    jurisdiction: "China",
    jurisdiction_code: "CN",
    issuing_body: "Cyberspace Administration of China (CAC)",
    status: "in_force",
    content_type: "regulation",
    adopted_date: "2023-07-13",
    effective_date: "2023-08-15",
    official_url: "https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm",
    topics: ["Generative AI", "Algorithm Recommendations", "Deepfake", "Data Security", "Content Moderation"],
    summary_short: "China's suite of AI regulations covering algorithm recommendations, deepfake content, and generative AI services, with strict content moderation and data localization requirements.",
    summary_long: "China has enacted multiple targeted AI regulations. The Generative AI Measures (2023) require providers of public-facing generative AI to register with CAC, conduct security assessments, implement content moderation, watermark generated content, and comply with data security laws. The Algorithm Recommendation Measures cover transparency in algorithmic recommendations and user rights. The Deep Synthesis Measures regulate deepfakes and synthetic media. All regulations emphasize core socialist values, national security, and data sovereignty.",
    obligations: [
      {
        id: "cn-001",
        title: "CAC registration and security assessment",
        description: "Register generative AI services with the Cyberspace Administration of China and complete a security assessment before public launch.",
        category: "Compliance",
        priority: "critical",
        citation: "Generative AI Measures Art. 17",
        action_required: "Apply for CAC registration; complete security assessment; obtain approval before service launch.",
      },
      {
        id: "cn-002",
        title: "Content watermarking",
        description: "Label and watermark AI-generated content to enable identification as synthetically generated.",
        category: "Transparency",
        priority: "high",
        citation: "Deep Synthesis Measures Art. 17",
        action_required: "Implement technical watermarking; add visible labels to generated text, images, and audio/video.",
      },
      {
        id: "cn-003",
        title: "Data localization compliance",
        description: "Process and store Chinese user data within China; obtain appropriate security assessments for cross-border data transfers.",
        category: "Data Governance",
        priority: "critical",
        citation: "PIPL, DSL",
        action_required: "Assess data flow; establish China-local infrastructure or obtain transfer approval.",
      },
      {
        id: "cn-004",
        title: "Content moderation and harmful content filtering",
        description: "Implement robust content moderation to prevent generation or dissemination of content that violates Chinese law or undermines national security.",
        category: "Content Moderation",
        priority: "critical",
        citation: "Generative AI Measures Art. 4, 9",
        action_required: "Deploy content filtering; establish moderation team; implement user reporting mechanism.",
      },
      {
        id: "cn-005",
        title: "Algorithm transparency disclosure",
        description: "Disclose to users when they are interacting with algorithmic recommendation systems and provide opt-out options.",
        category: "Transparency",
        priority: "high",
        citation: "Algorithm Recommendation Measures Art. 17",
        action_required: "Add algorithm disclosure notices; implement opt-out for personalized recommendations; publish recommendation principles.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-cn-001",
        name: "China market",
        weight: 0.7,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "CN" },
          ],
        },
      },
      {
        id: "rule-cn-002",
        name: "Generative AI or content",
        weight: 0.3,
        rule_json: {
          any: [
            { fact: "use_cases", operator: "contains", value: "content_generation" },
            { fact: "product_type", operator: "equals", value: "generative_ai" },
          ],
        },
      },
    ],
  },
  {
    id: "law-007",
    slug: "eu-gdpr-ai",
    title: "GDPR — AI & Automated Decision Making",
    short_title: "GDPR (AI provisions)",
    jurisdiction: "European Union",
    jurisdiction_code: "EU",
    issuing_body: "European Parliament & Council",
    status: "in_force",
    content_type: "regulation",
    adopted_date: "2016-04-27",
    effective_date: "2018-05-25",
    official_url: "https://gdpr-info.eu/art-22-gdpr/",
    topics: ["Automated Decision Making", "Profiling", "Data Subject Rights", "DPIA", "Personal Data"],
    summary_short: "GDPR Article 22 gives individuals the right not to be subject to solely automated decisions with legal or similarly significant effects, with strict conditions when it is permitted.",
    summary_long: "Under GDPR, processing personal data for AI training or inference requires a lawful basis. Article 22 specifically restricts automated decision-making and profiling: individuals have the right not to be subject to purely automated decisions that significantly affect them unless the decision is necessary for a contract, authorized by law, or based on explicit consent. When permitted, organizations must implement safeguards including human review mechanisms and meaningful information about the logic involved. High-risk processing requires a Data Protection Impact Assessment (DPIA) before processing.",
    obligations: [
      {
        id: "gdpr-001",
        title: "Lawful basis for AI training/inference",
        description: "Identify and document a lawful basis for each personal data processing activity in your AI pipeline.",
        category: "Data Governance",
        priority: "critical",
        citation: "GDPR Art. 6",
        action_required: "Map all personal data inputs to AI system; document lawful basis for each processing purpose.",
      },
      {
        id: "gdpr-002",
        title: "Art. 22 compliance for automated decisions",
        description: "Ensure any automated individual decision-making complies with Article 22 restrictions or falls within a permitted exception.",
        category: "Automated Decision Making",
        priority: "critical",
        citation: "GDPR Art. 22",
        action_required: "Determine if decisions are solely automated with significant effects; implement human review if required.",
      },
      {
        id: "gdpr-003",
        title: "Data Protection Impact Assessment (DPIA)",
        description: "Conduct a DPIA before deploying AI systems involving large-scale processing of sensitive data or systematic monitoring.",
        category: "Risk Assessment",
        priority: "high",
        citation: "GDPR Art. 35",
        action_required: "Conduct DPIA; consult DPA if residual risks are high; document and publish summary.",
      },
      {
        id: "gdpr-004",
        title: "Transparency and meaningful information",
        description: "Provide meaningful information about automated decision-making logic in privacy notices.",
        category: "Transparency",
        priority: "high",
        citation: "GDPR Art. 13, 14",
        action_required: "Update privacy notices to explain AI decision logic, profiling, and individual rights.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-gdpr-001",
        name: "EU/EEA personal data",
        weight: 0.5,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "EU" },
            { fact: "processes_eu_personal_data", operator: "equals", value: true },
          ],
        },
      },
      {
        id: "rule-gdpr-002",
        name: "Processes personal data",
        weight: 0.3,
        rule_json: {
          all: [{ fact: "processes_personal_data", operator: "equals", value: true }],
        },
      },
      {
        id: "rule-gdpr-003",
        name: "Automated decisions or profiling",
        weight: 0.2,
        rule_json: {
          any: [
            { fact: "automated_decisions", operator: "equals", value: true },
            { fact: "uses_ai", operator: "equals", value: true },
          ],
        },
      },
    ],
  },
  {
    id: "law-008",
    slug: "brazil-ai-bill",
    title: "Brazil AI Act (PL 2338/2023)",
    short_title: "Brazil AI Bill",
    jurisdiction: "Brazil",
    jurisdiction_code: "BR",
    issuing_body: "Brazilian Senate",
    status: "proposed",
    content_type: "act",
    adopted_date: "2023-05-01",
    effective_date: "2025-06-01",
    official_url: "https://www25.senado.leg.br/web/atividade/materias/-/materia/157233",
    topics: ["Risk Classification", "Human Rights", "Accountability", "Transparency", "Prohibited Uses"],
    summary_short: "Brazil's proposed AI legislation adopting a risk-based approach aligned with EU AI Act principles while reflecting Brazilian constitutional values of human dignity and non-discrimination.",
    summary_long: "Brazil's AI Bill (PL 2338/2023) establishes principles and rules for AI development and use. It adopts a risk classification system (minimal, limited, high, unacceptable/excessive) with obligations proportional to risk. High-risk AI requires impact assessments, human oversight, explainability, and registration. The bill prohibits AI systems that pose unacceptable risk to human rights, as well as real-time biometric surveillance in public spaces. The National Data Protection Authority (ANPD) is positioned as a key supervisory body.",
    obligations: [
      {
        id: "br-001",
        title: "Risk classification and assessment",
        description: "Classify your AI system according to the Brazilian AI risk taxonomy and document the classification rationale.",
        category: "Risk Assessment",
        priority: "critical",
        citation: "PL 2338 Art. 15",
        action_required: "Apply classification criteria; document and maintain classification records; update on material changes.",
      },
      {
        id: "br-002",
        title: "AI impact assessment for high-risk",
        description: "Complete an AI Impact Assessment (AIIA) before deploying high-risk AI systems.",
        category: "Impact Assessment",
        priority: "critical",
        citation: "PL 2338 Art. 21",
        action_required: "Conduct AIIA covering rights impacts; consult affected groups where appropriate; publish summary.",
      },
      {
        id: "br-003",
        title: "Human oversight for consequential decisions",
        description: "Ensure meaningful human oversight for AI systems making decisions that significantly affect individuals' rights.",
        category: "Governance",
        priority: "high",
        citation: "PL 2338 Art. 17",
        action_required: "Design human-in-the-loop processes for high-stakes AI decisions; document oversight procedures.",
      },
      {
        id: "br-004",
        title: "Transparency and explainability obligations",
        description: "Provide clear information to affected individuals about AI decisions and the logic underlying them.",
        category: "Transparency",
        priority: "high",
        citation: "PL 2338 Art. 10, 11",
        action_required: "Implement user-facing disclosures; enable individuals to request explanation of automated decisions.",
      },
      {
        id: "br-005",
        title: "ANPD registration for high-risk AI",
        description: "Register high-risk AI systems with the National Data Protection Authority (ANPD) before deployment.",
        category: "Compliance",
        priority: "critical",
        citation: "PL 2338 Art. 25",
        action_required: "Submit registration documentation to ANPD; maintain up-to-date registration.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-br-001",
        name: "Brazilian market",
        weight: 0.7,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "BR" },
            { fact: "hq_region", operator: "equals", value: "BR" },
          ],
        },
      },
      {
        id: "rule-br-002",
        name: "AI system present",
        weight: 0.3,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
    ],
  },
  {
    id: "law-009",
    slug: "singapore-ai-governance-framework",
    title: "Singapore Model AI Governance Framework",
    short_title: "Singapore AI Framework",
    jurisdiction: "Singapore",
    jurisdiction_code: "SG",
    issuing_body: "Infocomm Media Development Authority (IMDA)",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2020-01-21",
    effective_date: "2020-01-21",
    official_url: "https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework",
    topics: ["Explainability", "Human Augmentation", "Data Governance", "Risk Assessment", "Operations Management"],
    summary_short: "Singapore's voluntary governance framework providing practical guidance on responsible AI deployment, emphasizing human-centric design and proportionate risk management.",
    summary_long: "Singapore's Model AI Governance Framework (2nd edition) provides detailed, implementable guidance for private sector AI deployment. It covers: internal governance structures, human involvement in AI-augmented decisions, operations management (monitoring, testing), and stakeholder interaction. The framework is voluntary but widely adopted and forms the basis of Singapore's AI Verify testing toolkit. It emphasizes that the level of human oversight should be proportionate to the risk of harm, and that AI systems should be explainable where decisions affect individuals.",
    obligations: [
      {
        id: "sg-001",
        title: "Internal AI governance structure",
        description: "Establish a clear internal governance structure for AI with defined roles, responsibilities, and escalation paths.",
        category: "Governance",
        priority: "medium",
        citation: "Framework Part 2",
        action_required: "Document AI governance org structure; assign AI accountability roles; establish review cadence.",
      },
      {
        id: "sg-002",
        title: "Proportionate human oversight",
        description: "Implement human oversight proportional to the probability and severity of harm for each AI decision context.",
        category: "Human Oversight",
        priority: "medium",
        citation: "Framework Part 3",
        action_required: "Map AI decisions to risk levels; implement appropriate human review for high-risk decisions.",
      },
      {
        id: "sg-003",
        title: "Operations management and monitoring",
        description: "Implement operational processes to monitor AI system performance, detect errors, and respond to failures in production.",
        category: "Operations",
        priority: "medium",
        citation: "Framework Part 4",
        action_required: "Set up performance monitoring dashboards; define thresholds for alerts; establish incident response playbook.",
      },
      {
        id: "sg-004",
        title: "Stakeholder communication and explainability",
        description: "Communicate clearly with customers and affected individuals about the use of AI and provide explanations for AI-influenced decisions.",
        category: "Transparency",
        priority: "medium",
        citation: "Framework Part 5",
        action_required: "Draft plain-language AI disclosure statements; implement explanation capability for affected decisions.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-sg-001",
        name: "Singapore market",
        weight: 0.7,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "SG" },
            { fact: "hq_region", operator: "equals", value: "SG" },
          ],
        },
      },
      {
        id: "rule-sg-002",
        name: "AI system present",
        weight: 0.3,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
    ],
  },
  {
    id: "law-010",
    slug: "nist-ai-rmf",
    title: "NIST AI Risk Management Framework",
    short_title: "NIST AI RMF",
    jurisdiction: "United States",
    jurisdiction_code: "US",
    issuing_body: "National Institute of Standards and Technology (NIST)",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2023-01-26",
    effective_date: "2023-01-26",
    official_url: "https://airc.nist.gov/RMF",
    topics: ["Risk Management", "GOVERN", "MAP", "MEASURE", "MANAGE", "Trustworthiness"],
    summary_short: "Voluntary US framework providing a structured approach to managing AI risks across four core functions: GOVERN, MAP, MEASURE, and MANAGE.",
    summary_long: "The NIST AI RMF 1.0 provides a flexible, voluntary framework for organizations to manage AI risks. Built around four core functions: GOVERN (organizational culture and policies), MAP (context setting and risk categorization), MEASURE (analysis and assessment), and MANAGE (prioritization and treatment). Each function has categories and subcategories with suggested actions. The RMF emphasizes trustworthy AI properties: valid and reliable, safe, secure and resilient, explainable and interpretable, privacy-enhanced, and fair with bias managed. Referenced in US Executive Order 14110 and adopted across federal agencies.",
    obligations: [
      {
        id: "nist-001",
        title: "AI risk governance structure (GOVERN)",
        description: "Establish organizational policies, accountability, and culture for responsible AI development and use.",
        category: "Governance",
        priority: "high",
        citation: "GOVERN 1.0–6.0",
        action_required: "Define AI risk tolerance; assign accountability; establish AI policies and procedures.",
      },
      {
        id: "nist-002",
        title: "AI system context mapping (MAP)",
        description: "Identify AI system context, use cases, stakeholders, and potential negative impacts before deployment.",
        category: "Risk Assessment",
        priority: "high",
        citation: "MAP 1.0–5.0",
        action_required: "Document system purpose, stakeholders, and foreseeable uses/misuses; conduct impact analysis.",
      },
      {
        id: "nist-003",
        title: "Risk measurement and testing (MEASURE)",
        description: "Measure, evaluate, and monitor AI risks using quantitative and qualitative metrics.",
        category: "Testing",
        priority: "medium",
        citation: "MEASURE 1.0–4.0",
        action_required: "Define AI performance metrics; conduct bias testing; establish ongoing monitoring.",
      },
      {
        id: "nist-004",
        title: "Risk treatment and response (MANAGE)",
        description: "Prioritize identified AI risks and implement treatments including mitigations, transfers, or acceptance.",
        category: "Risk Management",
        priority: "high",
        citation: "MANAGE 1.0–4.0",
        action_required: "Build risk register; prioritize risks by severity; implement mitigations; track residual risks.",
      },
      {
        id: "nist-005",
        title: "Trustworthy AI properties documentation",
        description: "Document how your AI system achieves trustworthy AI properties: validity, reliability, safety, security, explainability, privacy, and fairness.",
        category: "Documentation",
        priority: "medium",
        citation: "RMF Playbook",
        action_required: "Complete AI system trustworthiness self-assessment; maintain evidence for each property.",
      },
    ],
    applicability_rules: [
      {
        id: "rule-nist-001",
        name: "US market or US federal contractor",
        weight: 0.6,
        rule_json: {
          any: [
            { fact: "target_markets", operator: "contains", value: "US" },
            { fact: "hq_region", operator: "equals", value: "US" },
          ],
        },
      },
      {
        id: "rule-nist-002",
        name: "AI system present",
        weight: 0.4,
        rule_json: {
          all: [{ fact: "uses_ai", operator: "equals", value: true }],
        },
      },
    ],
  },

  // ── 11. Illinois AI Video Interview Act ─────────────────────────────────
  {
    id: "law-011",
    slug: "illinois-ai-video-interview-act",
    title: "Illinois Artificial Intelligence Video Interview Act",
    short_title: "IL AI Video Interview Act",
    jurisdiction: "Illinois, USA",
    jurisdiction_code: "US",
    issuing_body: "Illinois General Assembly",
    status: "in_force",
    content_type: "act",
    adopted_date: "2019-08-09",
    effective_date: "2020-01-01",
    official_url: "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=4015",
    topics: ["Employment", "Biometric", "Transparency", "Automated Decision Making"],
    summary_short: "Requires employers using AI to analyze video interviews to notify applicants, explain AI use, and obtain consent before using AI-analyzed video in hiring decisions.",
    summary_long: "The Illinois AI Video Interview Act mandates that any employer using AI to analyze video interviews must: (1) notify applicants before the interview that AI will be used; (2) explain how the AI works and what characteristics it evaluates; (3) obtain consent from the applicant. Employers may not share videos with third parties and must destroy videos within 30 days upon request. The law applies to employers who use algorithmic assessments of applicant videos—a narrow but increasingly common employment practice.",
    obligations: [
      { id: "il-aiv-001", title: "Pre-interview AI disclosure", description: "Notify job applicants before their video interview that AI will be used to analyze their responses.", category: "Transparency", priority: "critical", citation: "Section 10(a)(1)", action_required: "Add AI disclosure to interview invitation emails and consent forms." },
      { id: "il-aiv-002", title: "Explain AI characteristics assessed", description: "Describe to applicants what general characteristics the AI evaluates (e.g. tone, word choice, facial movements).", category: "Transparency", priority: "high", citation: "Section 10(a)(2)", action_required: "Prepare plain-language explanation of AI evaluation criteria for applicants." },
      { id: "il-aiv-003", title: "Obtain written consent", description: "Get applicant consent before the AI-analyzed video interview is used in hiring decisions.", category: "Consent", priority: "critical", citation: "Section 10(a)(3)", action_required: "Implement consent capture mechanism in interview scheduling system." },
      { id: "il-aiv-004", title: "Video deletion upon request", description: "Delete applicant videos within 30 days of a request; ensure no copies remain with third parties.", category: "Data Rights", priority: "high", citation: "Section 10(b)", action_required: "Build video deletion workflow with 30-day SLA; audit third-party data sharing." },
    ],
    applicability_rules: [
      { id: "il-aiv-rule-001", name: "Hiring AI in US", weight: 0.9, rule_json: { all: [{ fact: "use_cases", operator: "contains", value: "hr" }, { fact: "target_markets", operator: "contains", value: "US" }] } },
    ],
  },

  // ── 12. California AB 2013 (AI Training Data Transparency) ─────────────
  {
    id: "law-012",
    slug: "california-ab-2013",
    title: "California AB 2013 — AI Training Data Transparency Act",
    short_title: "CA AI Training Data Act",
    jurisdiction: "California, USA",
    jurisdiction_code: "US",
    issuing_body: "California State Legislature",
    status: "enacted",
    content_type: "act",
    adopted_date: "2024-09-28",
    effective_date: "2026-01-01",
    official_url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013",
    topics: ["Data Governance", "Transparency", "GPAI", "Accountability"],
    summary_short: "Requires AI developers to publicly document the training data used for AI systems, including sources, data collection methods, and known biases.",
    summary_long: "California AB 2013 mandates that developers of AI systems used in California publish detailed documentation about their training data. Documentation must cover data sources, collection methods, data types, known limitations and biases, and steps taken to mitigate bias. The law aims to give consumers and businesses meaningful insight into AI system provenance. Applies to AI systems offered to California consumers with some size-based exemptions.",
    obligations: [
      { id: "ca-ab2013-001", title: "Publish training data documentation", description: "Publicly document training data sources, collection methods, and known biases on your website.", category: "Transparency", priority: "critical", citation: "Section 22756.1", action_required: "Create and publish training data cards or model cards covering all required elements." },
      { id: "ca-ab2013-002", title: "Bias and limitation disclosure", description: "Document and disclose known limitations, biases, and gaps in training data.", category: "Documentation", priority: "high", citation: "Section 22756.1(b)(4)", action_required: "Conduct bias audit of training data; document findings in public-facing documentation." },
      { id: "ca-ab2013-003", title: "Annual documentation updates", description: "Update training data documentation annually and upon significant model changes.", category: "Accountability", priority: "medium", citation: "Section 22756.2", action_required: "Establish annual review process; update documentation within 30 days of significant model changes." },
    ],
    applicability_rules: [
      { id: "ca-ab2013-rule-001", name: "AI product in California market", weight: 0.85, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "US" }] } },
    ],
  },

  // ── 13. Texas Responsible AI Governance Act (TRAIGA) ────────────────────
  {
    id: "law-013",
    slug: "texas-responsible-ai-governance-act",
    title: "Texas Responsible AI Governance Act (TRAIGA)",
    short_title: "Texas TRAIGA",
    jurisdiction: "Texas, USA",
    jurisdiction_code: "US",
    issuing_body: "Texas Legislature",
    status: "proposed",
    content_type: "act",
    adopted_date: "2025-03-01",
    effective_date: "2025-09-01",
    official_url: "https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=HB1709",
    topics: ["High-Risk AI", "Accountability", "Risk Management", "Automated Decision Making"],
    summary_short: "Proposed Texas legislation establishing risk management requirements for high-risk AI systems, modeled partly on the Colorado AI Act.",
    summary_long: "TRAIGA proposes a risk-based AI governance framework for Texas, targeting deployers and developers of high-risk AI systems. High-risk AI is defined as AI making or substantially informing consequential decisions in employment, housing, healthcare, education, credit, insurance, and legal matters. Obligations include risk impact assessments, annual audits, human override mechanisms, and consumer notifications. The bill also grants Texans rights to know about AI-driven decisions and to appeal adverse outcomes.",
    obligations: [
      { id: "tx-001", title: "High-risk AI impact assessment", description: "Conduct and document impact assessments for high-risk AI systems before deployment.", category: "Risk Management", priority: "critical", citation: "Sec. 3(a)", action_required: "Develop impact assessment framework; conduct assessment before each high-risk AI deployment." },
      { id: "tx-002", title: "Consumer notification", description: "Notify consumers when high-risk AI systems are used to make or inform consequential decisions about them.", category: "Transparency", priority: "high", citation: "Sec. 5(b)", action_required: "Implement consumer notification in decision workflows for covered categories." },
      { id: "tx-003", title: "Annual audit", description: "Commission an annual independent audit of high-risk AI systems for bias and accuracy.", category: "Accountability", priority: "high", citation: "Sec. 4(a)", action_required: "Engage third-party AI auditor; establish annual audit cadence." },
      { id: "tx-004", title: "Human override mechanism", description: "Provide a human override option for all consequential AI-driven decisions.", category: "Human Oversight", priority: "critical", citation: "Sec. 5(c)", action_required: "Build and document escalation paths for human review of AI decisions." },
    ],
    applicability_rules: [
      { id: "tx-rule-001", name: "Consequential AI in Texas", weight: 0.8, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "US" }] } },
    ],
  },

  // ── 14. Australia AI Safety Standard (Proposed) ─────────────────────────
  {
    id: "law-014",
    slug: "australia-ai-safety-standard",
    title: "Australia Voluntary AI Safety Standard",
    short_title: "AU AI Safety Standard",
    jurisdiction: "Australia",
    jurisdiction_code: "AU",
    issuing_body: "Department of Industry, Science and Resources",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2024-09-05",
    effective_date: "2024-09-05",
    official_url: "https://www.industry.gov.au/publications/australias-ai-ethics-framework",
    topics: ["Safety", "Accountability", "Transparency", "Human Oversight"],
    summary_short: "Australia's voluntary framework setting safety and ethical standards for AI systems, with 10 core AI ethics principles for organizations to adopt.",
    summary_long: "Australia's Voluntary AI Safety Standard, underpinned by the AI Ethics Framework, establishes 10 core principles: human, societal and environmental wellbeing; human-centred values; fairness; privacy protection and security; reliability and safety; transparency and explainability; contestability; accountability; and privacy. While currently voluntary, Australia is consulting on whether to mandate compliance for high-risk AI in critical sectors. Organizations are encouraged to adopt the standard and document compliance.",
    obligations: [
      { id: "au-001", title: "AI ethics principles adoption", description: "Assess and document alignment of AI systems with Australia's 10 AI ethics principles.", category: "Accountability", priority: "medium", citation: "Principle 1-10", action_required: "Conduct an ethics assessment against each of the 10 principles; publish results." },
      { id: "au-002", title: "Human oversight documentation", description: "Document human oversight mechanisms for AI systems affecting individuals.", category: "Human Oversight", priority: "high", citation: "Principle 4 (Safety)", action_required: "Map human touchpoints in AI decision workflows; document escalation paths." },
      { id: "au-003", title: "Transparency statement", description: "Publish a transparency statement describing AI systems in use and how they affect users.", category: "Transparency", priority: "medium", citation: "Principle 7 (Transparency)", action_required: "Draft and publish AI transparency statement on your website." },
    ],
    applicability_rules: [
      { id: "au-rule-001", name: "AI in Australia market", weight: 0.7, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "AU" }] } },
    ],
  },

  // ── 15. Japan AI Guidelines ──────────────────────────────────────────────
  {
    id: "law-015",
    slug: "japan-ai-guidelines",
    title: "Japan Guidelines for AI Development and Utilization",
    short_title: "Japan AI Guidelines",
    jurisdiction: "Japan",
    jurisdiction_code: "JP",
    issuing_body: "Ministry of Internal Affairs and Communications (MIC)",
    status: "in_force",
    content_type: "guideline",
    adopted_date: "2024-04-19",
    effective_date: "2024-04-19",
    official_url: "https://www.soumu.go.jp/main_sosiki/joho_tsusin/policyreports/joho_tsusin/ai_network/index.html",
    topics: ["Safety", "Transparency", "Data Governance", "Accountability"],
    summary_short: "Japan's comprehensive AI guidelines covering development, deployment, and use of AI, aligned with G7 Hiroshima AI Process principles.",
    summary_long: "Japan's Guidelines for AI Development and Utilization set principles for all AI stakeholders. The guidelines cover safety by design, security measures, privacy protection, fairness, transparency, accountability, and innovation promotion. Aligned with the G7 Hiroshima AI Process, the guidelines are addressed to AI developers, AI providers, and AI users, with differentiated obligations based on role. Japan takes a light-touch regulatory approach, preferring voluntary compliance backed by industry standards.",
    obligations: [
      { id: "jp-001", title: "Safety-by-design implementation", description: "Implement safety measures throughout the AI development lifecycle, not only at deployment.", category: "Safety", priority: "high", citation: "Guideline 1 (Safety)", action_required: "Integrate safety checkpoints into development pipeline; document safety testing procedures." },
      { id: "jp-002", title: "Privacy-by-design compliance", description: "Embed privacy protections in AI systems handling personal data, in line with Japan's Act on Protection of Personal Information (APPI).", category: "Data Governance", priority: "high", citation: "Guideline 5 (Privacy)", action_required: "Conduct privacy impact assessment; implement data minimization and pseudonymization." },
      { id: "jp-003", title: "Algorithmic transparency", description: "Provide meaningful explanations of AI decision-making to affected parties where practicable.", category: "Transparency", priority: "medium", citation: "Guideline 6 (Transparency)", action_required: "Design explainability features for consumer-facing AI; document model decision logic." },
    ],
    applicability_rules: [
      { id: "jp-rule-001", name: "AI in Japan market", weight: 0.7, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "JP" }] } },
    ],
  },

  // ── 16. India Digital Personal Data Protection Act (AI provisions) ───────
  {
    id: "law-016",
    slug: "india-dpdp-act",
    title: "India Digital Personal Data Protection Act 2023",
    short_title: "India DPDP Act",
    jurisdiction: "India",
    jurisdiction_code: "IN",
    issuing_body: "Ministry of Electronics and Information Technology",
    status: "enacted",
    content_type: "act",
    adopted_date: "2023-08-11",
    effective_date: "2025-01-01",
    official_url: "https://www.meity.gov.in/writereaddata/files/Digital%20Personal%20Data%20Protection%20Act%202023.pdf",
    topics: ["Data Governance", "Automated Decision Making", "Transparency", "Data Rights"],
    summary_short: "India's landmark data protection law with significant implications for AI, particularly around automated decision-making, consent management, and data principal rights.",
    summary_long: "The Digital Personal Data Protection Act 2023 establishes India's first comprehensive data protection framework. Key provisions for AI include: mandatory consent before processing personal data (with granular consent for each purpose), rights for data principals to access, correct, and erase data, prohibition on processing children's data without verified parental consent, restrictions on cross-border data transfers to approved countries, and significant penalties up to INR 250 crore for breaches. AI systems processing personal data must comply with purpose limitation, data minimization, and accuracy principles.",
    obligations: [
      { id: "in-001", title: "Consent management for AI data processing", description: "Obtain free, specific, informed, and unconditional consent before processing personal data in AI systems.", category: "Consent", priority: "critical", citation: "Section 6", action_required: "Implement consent management platform with granular consent options for each AI processing purpose." },
      { id: "in-002", title: "Data principal rights implementation", description: "Enable data principals to access, correct, and erase their personal data held by AI systems.", category: "Data Rights", priority: "critical", citation: "Sections 11-13", action_required: "Build data rights portal; respond to requests within 72 hours." },
      { id: "in-003", title: "Children's data protection", description: "Obtain verifiable parental consent before processing data of children under 18 in AI systems.", category: "Data Governance", priority: "critical", citation: "Section 9", action_required: "Implement age verification and parental consent flows for consumer-facing AI." },
      { id: "in-004", title: "Data breach notification", description: "Report personal data breaches to the Data Protection Board and affected principals within prescribed timelines.", category: "Accountability", priority: "high", citation: "Section 8(6)", action_required: "Establish breach detection and notification procedures; test incident response plan." },
    ],
    applicability_rules: [
      { id: "in-rule-001", name: "AI processing Indian personal data", weight: 0.85, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "IN" }] } },
    ],
  },

  // ── 17. South Korea AI Act (proposed) ───────────────────────────────────
  {
    id: "law-017",
    slug: "south-korea-ai-act",
    title: "South Korea Act on the Development of Artificial Intelligence and Establishment of Trust Foundation",
    short_title: "South Korea AI Act",
    jurisdiction: "South Korea",
    jurisdiction_code: "KR",
    issuing_body: "Ministry of Science and ICT",
    status: "enacted",
    content_type: "act",
    adopted_date: "2025-01-22",
    effective_date: "2026-01-22",
    official_url: "https://www.msit.go.kr/eng/bbs/list.do?sCode=eng&mId=5&mPid=3",
    topics: ["High-Risk AI", "Transparency", "Safety", "Accountability"],
    summary_short: "South Korea's foundational AI law establishing safety standards, transparency requirements, and government support for AI industry development.",
    summary_long: "South Korea enacted its AI Framework Act in January 2025, becoming one of the first Asian countries with sector-agnostic AI legislation. The law establishes a tiered approach: high-impact AI systems (in healthcare, transportation, finance, law enforcement) face mandatory safety certification and transparency requirements. The law also creates a national AI committee, requires AI business registration for high-impact AI, mandates user notification when interacting with AI, and establishes a government fund to support AI safety research.",
    obligations: [
      { id: "kr-001", title: "High-impact AI safety certification", description: "Obtain safety certification for AI systems designated as high-impact before commercial deployment.", category: "Safety", priority: "critical", citation: "Article 27", action_required: "Identify if product is high-impact AI; submit for safety certification to designated body." },
      { id: "kr-002", title: "User AI interaction disclosure", description: "Clearly notify users when they are interacting with an AI system.", category: "Transparency", priority: "high", citation: "Article 38", action_required: "Add AI disclosure banners/notices to all user-facing AI interfaces." },
      { id: "kr-003", title: "AI business registration", description: "Register AI business with relevant authorities if operating high-impact AI services.", category: "Compliance", priority: "high", citation: "Article 25", action_required: "Complete AI business registration process with Ministry of Science and ICT." },
    ],
    applicability_rules: [
      { id: "kr-rule-001", name: "AI in South Korea market", weight: 0.75, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "KR" }] } },
    ],
  },

  // ── 18. UAE AI Ethics Guidelines ─────────────────────────────────────────
  {
    id: "law-018",
    slug: "uae-ai-ethics-guidelines",
    title: "UAE AI Ethics Guidelines",
    short_title: "UAE AI Ethics",
    jurisdiction: "United Arab Emirates",
    jurisdiction_code: "AE",
    issuing_body: "UAE Ministry of Artificial Intelligence",
    status: "in_force",
    content_type: "guideline",
    adopted_date: "2023-07-01",
    effective_date: "2023-07-01",
    official_url: "https://u.ae/en/about-the-uae/digital-uae/ai/AI-ethics",
    topics: ["Accountability", "Transparency", "Safety", "Data Governance"],
    summary_short: "UAE's national AI ethics framework establishing six core principles for responsible AI development and deployment across all sectors.",
    summary_long: "The UAE AI Ethics Guidelines establish six principles: inclusiveness, reliability, transparency, accountability, fairness, and respect for human dignity. The guidelines apply to all entities using or developing AI in the UAE. They include practical guidance on how to implement each principle, including bias assessments, explainability mechanisms, human oversight, and privacy protections. As the UAE positions itself as a global AI hub, these guidelines are complemented by sector-specific regulations in healthcare and financial services.",
    obligations: [
      { id: "ae-001", title: "AI ethics self-assessment", description: "Conduct a self-assessment of AI systems against UAE's six ethics principles before deployment.", category: "Accountability", priority: "medium", citation: "Section 3", action_required: "Complete UAE AI ethics self-assessment checklist for each deployed AI system." },
      { id: "ae-002", title: "Bias monitoring program", description: "Implement ongoing monitoring for algorithmic bias and take corrective action when bias is detected.", category: "Fairness", priority: "high", citation: "Principle 5 (Fairness)", action_required: "Deploy bias monitoring tools; set bias thresholds; establish remediation process." },
      { id: "ae-003", title: "Explainability mechanisms", description: "Provide meaningful explanations for AI-driven decisions affecting individuals.", category: "Transparency", priority: "medium", citation: "Principle 3 (Transparency)", action_required: "Implement explainability layer for consequential AI decisions; test with end users." },
    ],
    applicability_rules: [
      { id: "ae-rule-001", name: "AI in UAE market", weight: 0.7, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "AE" }] } },
    ],
  },

  // ── 19. US Algorithmic Accountability Act ────────────────────────────────
  {
    id: "law-019",
    slug: "us-algorithmic-accountability-act",
    title: "Algorithmic Accountability Act of 2023",
    short_title: "US Algorithmic Accountability Act",
    jurisdiction: "United States (Federal)",
    jurisdiction_code: "US",
    issuing_body: "US Congress (Proposed)",
    status: "proposed",
    content_type: "act",
    adopted_date: "2023-11-08",
    effective_date: "",
    official_url: "https://www.congress.gov/bill/118th-congress/senate-bill/3312",
    topics: ["Automated Decision Making", "Accountability", "High-Risk AI", "Transparency"],
    summary_short: "Federal bill requiring companies to conduct impact assessments on automated decision systems that could affect Americans, with FTC oversight.",
    summary_long: "The Algorithmic Accountability Act requires covered entities (companies above revenue thresholds or handling data of 1M+ people) to conduct impact assessments for 'critical decision systems'—automated systems that make or substantially inform consequential decisions in employment, housing, healthcare, education, credit, insurance, or government services. Assessments must evaluate accuracy, fairness, bias, privacy risks, and security. The FTC would receive assessment summaries and enforce violations. The bill mandates corrective action plans when significant risks are identified.",
    obligations: [
      { id: "us-aaa-001", title: "Automated system impact assessment", description: "Conduct comprehensive impact assessments for critical decision systems covering bias, accuracy, fairness, and privacy.", category: "Risk Management", priority: "critical", citation: "Section 3(a)", action_required: "Identify all critical decision systems; conduct impact assessment using approved methodology." },
      { id: "us-aaa-002", title: "Assessment documentation and retention", description: "Document impact assessments and retain records for a minimum of 3 years.", category: "Documentation", priority: "high", citation: "Section 3(c)", action_required: "Implement assessment documentation system; establish 3-year retention policy." },
      { id: "us-aaa-003", title: "Corrective action plan", description: "Develop and implement corrective action plans for critical decision systems with identified significant risks.", category: "Accountability", priority: "high", citation: "Section 3(d)", action_required: "Define risk threshold criteria; create corrective action plan template; track remediation." },
      { id: "us-aaa-004", title: "FTC reporting", description: "Submit impact assessment summaries to the FTC on an annual basis.", category: "Compliance", priority: "medium", citation: "Section 4", action_required: "Prepare annual FTC submission; engage legal counsel to review before filing." },
    ],
    applicability_rules: [
      { id: "us-aaa-rule-001", name: "Large company with automated decisions in US", weight: 0.75, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "US" }] } },
    ],
  },

  // ── 20. EU AI Liability Directive ────────────────────────────────────────
  {
    id: "law-020",
    slug: "eu-ai-liability-directive",
    title: "EU Artificial Intelligence Liability Directive (AILD)",
    short_title: "EU AI Liability Directive",
    jurisdiction: "European Union",
    jurisdiction_code: "EU",
    issuing_body: "European Parliament & Council",
    status: "proposed",
    content_type: "directive",
    adopted_date: "2022-09-28",
    effective_date: "",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52022PC0496",
    topics: ["Accountability", "High-Risk AI", "Transparency", "Safety"],
    summary_short: "Proposed EU directive creating civil liability rules for AI-caused harm, with a rebuttable presumption of causation for high-risk AI systems.",
    summary_long: "The EU AI Liability Directive complements the EU AI Act by establishing harmonized civil liability rules for AI-caused harm. Key innovations include: a disclosure obligation requiring defendants to share evidence about high-risk AI systems, and a rebuttable presumption of causation—if a claimant shows a causal link between an AI system's fault and their damage, courts presume causation unless the defendant can rebut it. Claimants no longer need to explain AI 'black box' systems. The directive applies when AI systems cause death, personal injury, or property damage.",
    obligations: [
      { id: "eu-aild-001", title: "Evidence preservation for AI systems", description: "Preserve logs, documentation, and evidence related to AI system operation to be able to defend liability claims.", category: "Accountability", priority: "critical", citation: "Article 3", action_required: "Implement comprehensive logging for all high-risk AI decisions; define retention periods; secure logs." },
      { id: "eu-aild-002", title: "Causation rebuttal documentation", description: "Prepare documentation to rebut presumption of causation if AI system is implicated in harm.", category: "Documentation", priority: "high", citation: "Article 4(5)", action_required: "Document safety measures, testing results, and monitoring data that demonstrate AI system compliance." },
      { id: "eu-aild-003", title: "Insurance or financial provisioning", description: "Assess and address insurance needs for AI liability exposure under the AILD framework.", category: "Risk Management", priority: "medium", citation: "Article 4", action_required: "Work with legal and insurance teams to assess liability exposure; obtain appropriate AI liability coverage." },
    ],
    applicability_rules: [
      { id: "eu-aild-rule-001", name: "High-risk AI in EU", weight: 0.8, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "EU" }] } },
    ],
  },

  // ── 21. Canada AIDA ─────────────────────────────────────────────────────
  // (Already included as law-004; adding new Canadian province/supplemental)
  // ── 21. Ontario AI Ethics Framework ────────────────────────────────────
  {
    id: "law-021",
    slug: "ontario-ai-ethics-framework",
    title: "Ontario Government Ethical AI Framework",
    short_title: "Ontario AI Ethics",
    jurisdiction: "Ontario, Canada",
    jurisdiction_code: "CA",
    issuing_body: "Government of Ontario, Digital and Data Directorate",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2021-10-01",
    effective_date: "2021-10-01",
    official_url: "https://www.ontario.ca/page/ontarios-ethical-framework-artificial-intelligence",
    topics: ["Accountability", "Transparency", "Fairness", "Human Oversight"],
    summary_short: "Ontario's government AI ethics framework establishing principles and practices for the responsible use of AI in public services.",
    summary_long: "Ontario's Ethical AI Framework applies to all Ontario government uses of AI in public services. It establishes five principles: transparency, accountability, fairness, human oversight, and explainability. Government AI systems must be assessed against the framework before deployment. Vendors supplying AI to the Ontario government must demonstrate compliance. The framework includes a risk assessment tool, a checklist, and guidance on human oversight requirements.",
    obligations: [
      { id: "on-001", title: "Pre-deployment risk assessment", description: "Complete Ontario's AI risk assessment tool before deploying AI in government services.", category: "Risk Management", priority: "critical", citation: "Principle 2 (Accountability)", action_required: "Use Ontario's published risk assessment tool; document findings; obtain sign-off." },
      { id: "on-002", title: "Human oversight designation", description: "Designate a human decision-maker responsible for all consequential AI-driven decisions in government services.", category: "Human Oversight", priority: "high", citation: "Principle 4 (Human Oversight)", action_required: "Document decision responsibility matrix; ensure human escalation path for all high-stakes decisions." },
      { id: "on-003", title: "Public transparency report", description: "Publish an annual report on AI systems in use, their purpose, and outcomes.", category: "Transparency", priority: "medium", citation: "Principle 1 (Transparency)", action_required: "Compile AI inventory; draft annual transparency report; publish on ontario.ca." },
    ],
    applicability_rules: [
      { id: "on-rule-001", name: "AI in Canadian government", weight: 0.6, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "CA" }] } },
    ],
  },

  // ── 22. New York City Local Law 144 (AEDT) ──────────────────────────────
  {
    id: "law-022",
    slug: "nyc-local-law-144",
    title: "New York City Local Law 144 — Automated Employment Decision Tools",
    short_title: "NYC LL 144 (AEDT)",
    jurisdiction: "New York City, USA",
    jurisdiction_code: "US",
    issuing_body: "New York City Council",
    status: "in_force",
    content_type: "act",
    adopted_date: "2021-12-11",
    effective_date: "2023-07-05",
    official_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?ID=4344524",
    topics: ["Employment", "Automated Decision Making", "Transparency", "Bias Audit"],
    summary_short: "NYC law requiring employers using AI hiring tools to conduct annual bias audits and notify candidates and employees, becoming a model for employment AI regulation.",
    summary_long: "NYC Local Law 144 requires employers and employment agencies using automated employment decision tools (AEDTs) to: (1) conduct and publish annual bias audits by independent auditors; (2) notify candidates and employees that an AEDT will be used at least 10 business days before use; (3) provide an alternative selection process or accommodation on request. Bias audits must assess the tool's impact by sex and race/ethnicity, published on the employer's website. The NYC Department of Consumer and Worker Protection enforces the law with fines up to $1,500 per violation.",
    obligations: [
      { id: "nyc-001", title: "Annual independent bias audit", description: "Commission an independent bias audit of AEDT tools annually; publish results on company website.", category: "Bias Audit", priority: "critical", citation: "Local Law 144, Section 1(b)", action_required: "Engage qualified independent auditor; complete audit before first use each year; publish results publicly." },
      { id: "nyc-002", title: "Candidate and employee notification", description: "Notify job candidates and employees at least 10 business days before using an AEDT in selection decisions.", category: "Transparency", priority: "critical", citation: "Local Law 144, Section 1(c)", action_required: "Add AEDT disclosure to job postings and employee communications at least 10 days in advance." },
      { id: "nyc-003", title: "Alternative process accommodation", description: "Provide candidates/employees with an alternative selection process or reasonable accommodation upon request.", category: "Data Rights", priority: "high", citation: "Local Law 144, Section 1(c)(3)", action_required: "Design alternative assessment process; train HR team on accommodation requests." },
      { id: "nyc-004", title: "Data retention for audit", description: "Retain data necessary for bias audits for the audit period plus one year.", category: "Data Governance", priority: "medium", citation: "DCWP Rules 5-301", action_required: "Configure data retention settings for AEDT inputs and outputs; document retention policy." },
    ],
    applicability_rules: [
      { id: "nyc-rule-001", name: "Hiring AI in New York City", weight: 0.95, rule_json: { all: [{ fact: "use_cases", operator: "contains", value: "hr" }, { fact: "target_markets", operator: "contains", value: "US" }] } },
    ],
  },

  // ── 23. EU Product Liability Directive (AI goods) ───────────────────────
  {
    id: "law-023",
    slug: "eu-product-liability-directive",
    title: "EU Product Liability Directive (Revised) — AI Application",
    short_title: "EU Product Liability (AI)",
    jurisdiction: "European Union",
    jurisdiction_code: "EU",
    issuing_body: "European Parliament & Council",
    status: "enacted",
    content_type: "directive",
    adopted_date: "2024-10-23",
    effective_date: "2026-12-09",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024L2853",
    topics: ["Accountability", "Safety", "High-Risk AI"],
    summary_short: "Revised EU product liability rules extended to software and AI, making AI developers liable for defective products causing harm without requiring proof of fault.",
    summary_long: "The revised EU Product Liability Directive extends strict liability for defective products to digital products including AI software. Key changes: software and AI systems are explicitly covered; the 10-year liability cap applies from the date of substantial modification (not just initial release); disclosure obligations on manufacturers; a rebuttable presumption of defect when a manufacturer fails to disclose requested evidence. AI companies must ensure product safety documentation is robust and that software updates don't introduce new defects.",
    obligations: [
      { id: "eu-pld-001", title: "Product safety documentation", description: "Maintain comprehensive product safety documentation for AI software, including version history, testing evidence, and known issues.", category: "Documentation", priority: "critical", citation: "Article 8", action_required: "Establish product safety documentation system; conduct pre-release safety testing; maintain version logs." },
      { id: "eu-pld-002", title: "Update defect management", description: "Monitor AI system performance post-deployment; issue patches for defects promptly; document all modifications.", category: "Safety", priority: "high", citation: "Article 10(4)", action_required: "Implement post-deployment monitoring; establish defect triage and patching process." },
      { id: "eu-pld-003", title: "Liability insurance assessment", description: "Assess product liability exposure for AI products sold in EU; obtain appropriate insurance coverage.", category: "Risk Management", priority: "medium", citation: "Article 5", action_required: "Engage insurance and legal advisers; review policy for software and AI coverage gaps." },
    ],
    applicability_rules: [
      { id: "eu-pld-rule-001", name: "AI product in EU market", weight: 0.8, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "EU" }] } },
    ],
  },

  // ── 24. France AI National Strategy (CGIAI) ─────────────────────────────
  {
    id: "law-024",
    slug: "france-ai-national-strategy",
    title: "France National AI Strategy (IA Commune) — Regulatory Guidelines",
    short_title: "France AI Strategy",
    jurisdiction: "France",
    jurisdiction_code: "FR",
    issuing_body: "Comité de l'IA générative (CGIAI)",
    status: "in_force",
    content_type: "guideline",
    adopted_date: "2024-03-13",
    effective_date: "2024-03-13",
    official_url: "https://www.gouvernement.fr/ia",
    topics: ["GPAI", "Transparency", "Accountability", "Safety"],
    summary_short: "France's AI national strategy includes regulatory guidelines for generative AI, complementing the EU AI Act with national-level implementation guidance.",
    summary_long: "France's AI strategy, updated in 2024, includes guidelines from the National Committee on Generative AI addressing responsible deployment of AI systems. Guidelines emphasize human oversight, watermarking of AI-generated content, mandatory disclosure of AI interaction, safety testing for high-stakes AI, and sector-specific guidance for healthcare, education, and public services. France is also active in EU AI Act implementation, with CNIL (data protection authority) providing guidance on AI and personal data.",
    obligations: [
      { id: "fr-001", title: "Generative AI content watermarking", description: "Apply watermarks or metadata to AI-generated content to enable detection and attribution.", category: "Transparency", priority: "high", citation: "CGIAI Guideline 3", action_required: "Implement technical watermarking for AI-generated text, images, and video." },
      { id: "fr-002", title: "CNIL AI data processing compliance", description: "Ensure AI data processing complies with CNIL guidance on AI and GDPR, including lawful basis and data subject rights.", category: "Data Governance", priority: "critical", citation: "CNIL AI Guidance 2024", action_required: "Review CNIL AI guidance; update privacy notices; verify lawful basis for AI data processing." },
      { id: "fr-003", title: "Sector-specific AI guidelines", description: "Apply sector-specific AI guidelines in healthcare, education, or public services if operating in those sectors.", category: "Compliance", priority: "medium", citation: "Sector Guidelines 2024", action_required: "Identify applicable sector guidelines; conduct gap analysis; implement required measures." },
    ],
    applicability_rules: [
      { id: "fr-rule-001", name: "AI in France or EU market", weight: 0.65, rule_json: { any: [{ fact: "target_markets", operator: "contains", value: "FR" }, { fact: "target_markets", operator: "contains", value: "EU" }] } },
    ],
  },

  // ── 25. UN High-Level Advisory Body on AI Governance ────────────────────
  {
    id: "law-025",
    slug: "un-ai-governance-framework",
    title: "UN International Governance of AI — Interim Report",
    short_title: "UN AI Governance",
    jurisdiction: "International / UN",
    jurisdiction_code: "INTL",
    issuing_body: "UN High-Level Advisory Body on Artificial Intelligence",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2023-12-21",
    effective_date: "2023-12-21",
    official_url: "https://www.un.org/sites/un2.un.org/files/un_ai_advisory_body_governing_ai_for_humanity_interim_report.pdf",
    topics: ["Safety", "Accountability", "Transparency", "Data Governance"],
    summary_short: "The UN's interim framework for international AI governance, calling for shared norms, global cooperation, and risk-based oversight of AI systems.",
    summary_long: "The UN High-Level Advisory Body on AI published its interim report outlining principles for global AI governance. The framework emphasizes: AI should be governed in the interest of all humanity; governance should be inclusive; AI risks must be addressed at a global level; existing international human rights frameworks apply to AI; and there is a need for a new international AI governance body. While not binding, the UN framework influences national legislation and sets expectations for multinational enterprises.",
    obligations: [
      { id: "un-001", title: "Human rights impact assessment for global AI", description: "Conduct a human rights due diligence assessment for AI systems that operate across multiple countries.", category: "Risk Management", priority: "high", citation: "Section 4.1", action_required: "Adopt UN Guiding Principles on Business and Human Rights framework for AI; conduct HRIA." },
      { id: "un-002", title: "AI governance policy publication", description: "Publish a corporate AI governance policy aligned with international norms.", category: "Accountability", priority: "medium", citation: "Section 3.2", action_required: "Draft and publish AI governance policy; include human rights commitments and oversight mechanisms." },
    ],
    applicability_rules: [
      { id: "un-rule-001", name: "Multinational AI operations", weight: 0.5, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }] } },
    ],
  },

  // ── 26. EU Cyber Resilience Act (AI-embedded products) ──────────────────
  {
    id: "law-026",
    slug: "eu-cyber-resilience-act",
    title: "EU Cyber Resilience Act",
    short_title: "EU Cyber Resilience Act",
    jurisdiction: "European Union",
    jurisdiction_code: "EU",
    issuing_body: "European Parliament & Council",
    status: "enacted",
    content_type: "regulation",
    adopted_date: "2024-10-10",
    effective_date: "2027-12-11",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847",
    topics: ["Safety", "Data Governance", "Accountability"],
    summary_short: "EU regulation requiring cybersecurity standards for products with digital elements, including AI-embedded hardware and software, throughout their lifecycle.",
    summary_long: "The EU Cyber Resilience Act mandates that manufacturers of products with digital elements (hardware, software, and AI-embedded products) meet cybersecurity requirements throughout the product lifecycle. Key obligations include: designing products with security by default; vulnerability handling processes; security patch support for minimum 5 years; security incident reporting to ENISA within 24 hours; and CE marking for compliant products. AI products sold in the EU must comply alongside the EU AI Act, making security documentation a dual compliance requirement.",
    obligations: [
      { id: "eu-cra-001", title: "Security by default product design", description: "Design AI products with security by default—no unnecessary vulnerabilities, minimal attack surface, and secure configurations.", category: "Safety", priority: "critical", citation: "Annex I, Part I", action_required: "Conduct security design review; implement secure coding practices; run penetration testing before release." },
      { id: "eu-cra-002", title: "Vulnerability disclosure and patching", description: "Establish a vulnerability handling process and provide security patches for minimum 5 years.", category: "Accountability", priority: "critical", citation: "Annex I, Part II", action_required: "Set up vulnerability disclosure program (VDP); commit to 5-year patch support; document process." },
      { id: "eu-cra-003", title: "Security incident reporting", description: "Report actively exploited vulnerabilities and severe security incidents to ENISA within 24 hours of discovery.", category: "Compliance", priority: "high", citation: "Article 14", action_required: "Integrate ENISA reporting into incident response procedures; test reporting workflow." },
    ],
    applicability_rules: [
      { id: "eu-cra-rule-001", name: "Software/AI product in EU", weight: 0.8, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "EU" }] } },
    ],
  },

  // ── 27. Spain AI Supervision Agency (AESIA) ─────────────────────────────
  {
    id: "law-027",
    slug: "spain-aesia-ai-supervision",
    title: "Spain AI Supervision Agency (AESIA) — National AI Supervision Framework",
    short_title: "Spain AESIA Framework",
    jurisdiction: "Spain",
    jurisdiction_code: "ES",
    issuing_body: "Agencia Española de Supervisión de la Inteligencia Artificial (AESIA)",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2024-06-13",
    effective_date: "2024-06-13",
    official_url: "https://www.aesia.es",
    topics: ["High-Risk AI", "Accountability", "Transparency", "Compliance"],
    summary_short: "Spain established AESIA as the first national AI supervision body in the EU, responsible for EU AI Act enforcement and sandbox programs.",
    summary_long: "Spain created AESIA in 2024 to be the national market surveillance authority responsible for enforcing the EU AI Act. AESIA oversees compliance for high-risk AI systems, operates an AI regulatory sandbox, and coordinates with other EU member state authorities. Spanish companies must comply with AESIA's sandbox conditions if participating, report high-risk AI system incidents, and cooperate with market surveillance audits. AESIA also coordinates Spain's implementation of the EU AI Act's Article 31 responsibilities.",
    obligations: [
      { id: "es-001", title: "AESIA sandbox compliance", description: "If participating in AESIA's AI sandbox program, comply with all sandbox conditions and reporting requirements.", category: "Compliance", priority: "medium", citation: "Royal Decree 729/2023", action_required: "Review AESIA sandbox conditions; designate sandbox compliance manager; submit required reports." },
      { id: "es-002", title: "Market surveillance cooperation", description: "Cooperate with AESIA market surveillance inspections; provide access to technical documentation and AI systems.", category: "Accountability", priority: "high", citation: "EU AI Act Art. 74; AESIA implementing rules", action_required: "Designate AESIA contact point; prepare documentation package for potential audits." },
    ],
    applicability_rules: [
      { id: "es-rule-001", name: "AI in Spain or EU market", weight: 0.7, rule_json: { any: [{ fact: "target_markets", operator: "contains", value: "ES" }, { fact: "target_markets", operator: "contains", value: "EU" }] } },
    ],
  },

  // ── 28. G7 Hiroshima AI Process (Code of Conduct) ───────────────────────
  {
    id: "law-028",
    slug: "g7-hiroshima-ai-process",
    title: "G7 Hiroshima AI Process — International Code of Conduct for Advanced AI",
    short_title: "G7 Hiroshima AI Code",
    jurisdiction: "International / G7",
    jurisdiction_code: "INTL",
    issuing_body: "G7 Leaders",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2023-10-30",
    effective_date: "2023-10-30",
    official_url: "https://www.g7hiroshima.go.jp/documents/pdf/231030_01_en.pdf",
    topics: ["GPAI", "Safety", "Transparency", "Accountability"],
    summary_short: "Voluntary code of conduct for developers of advanced AI systems, establishing 11 guiding behaviors covering safety testing, incident reporting, and transparency.",
    summary_long: "The G7 Hiroshima AI Process International Code of Conduct establishes 11 behaviors expected of AI developers. These include: taking appropriate measures to identify and mitigate risks throughout the AI lifecycle; investing in cybersecurity; share information on incidents with governments; develop technical standards; adopt risk-based approaches for safety testing; be transparent about AI capabilities and limitations; work toward AI watermarking; protect privacy and intellectual property; advance AI literacy; and develop AI governance frameworks. While voluntary, the code is expected to inform regulation across G7 countries.",
    obligations: [
      { id: "g7-001", title: "Advanced AI safety testing", description: "Conduct safety testing of advanced AI models before deployment, including red-teaming for dangerous capabilities.", category: "Safety", priority: "critical", citation: "Behavior 1", action_required: "Implement pre-deployment safety testing protocol; include adversarial testing; document results." },
      { id: "g7-002", title: "AI incident information sharing", description: "Report AI incidents to relevant authorities and share information with peers to improve collective safety.", category: "Accountability", priority: "high", citation: "Behavior 4", action_required: "Establish AI incident classification and reporting process; engage with government AI incident bodies." },
      { id: "g7-003", title: "AI content identification", description: "Implement technical mechanisms (e.g. watermarking) to help users identify AI-generated content.", category: "Transparency", priority: "medium", citation: "Behavior 8", action_required: "Evaluate and implement watermarking or content provenance standards for AI-generated outputs." },
    ],
    applicability_rules: [
      { id: "g7-rule-001", name: "Advanced AI system developer", weight: 0.6, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }] } },
    ],
  },

  // ── 29. ISO/IEC 42001 AI Management System ──────────────────────────────
  {
    id: "law-029",
    slug: "iso-iec-42001",
    title: "ISO/IEC 42001:2023 — Artificial Intelligence Management System",
    short_title: "ISO/IEC 42001",
    jurisdiction: "International (ISO Standard)",
    jurisdiction_code: "INTL",
    issuing_body: "ISO/IEC JTC 1/SC 42",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2023-12-18",
    effective_date: "2023-12-18",
    official_url: "https://www.iso.org/standard/81230.html",
    topics: ["Accountability", "Risk Management", "Data Governance", "Safety"],
    summary_short: "International standard for AI management systems, providing a certification-ready framework for responsible AI governance in any organization.",
    summary_long: "ISO/IEC 42001 is the world's first international standard specifically for AI management systems (AIMS). It provides a framework organizations can use to develop, implement, and continually improve responsible AI practices. The standard covers leadership commitment, AI policy, risk and impact assessment, AI system controls, supplier management, performance evaluation, and continual improvement. Organizations can seek ISO 42001 certification to demonstrate AI governance maturity—increasingly required by enterprise customers and insurers.",
    obligations: [
      { id: "iso-001", title: "AI policy and governance structure", description: "Establish a documented AI policy and governance structure with leadership accountability.", category: "Accountability", priority: "critical", citation: "Clause 5", action_required: "Draft AI governance policy; appoint AI governance lead; establish AI review committee." },
      { id: "iso-002", title: "AI risk and impact assessment", description: "Conduct systematic risk and impact assessments for all AI systems before deployment and periodically.", category: "Risk Management", priority: "critical", citation: "Clause 6.1", action_required: "Implement AI risk assessment process; use ISO 42001 Annex C impact assessment template." },
      { id: "iso-003", title: "AI system controls implementation", description: "Implement technical and organizational controls for AI systems as required by ISO 42001 Annex A.", category: "Safety", priority: "high", citation: "Annex A", action_required: "Map Annex A controls to your AI systems; implement and document required controls." },
      { id: "iso-004", title: "Supplier AI management", description: "Assess and manage AI-related risks in the supply chain, including third-party AI models and services.", category: "Data Governance", priority: "medium", citation: "Clause 8.4", action_required: "Inventory third-party AI dependencies; conduct supplier AI governance assessments." },
    ],
    applicability_rules: [
      { id: "iso-rule-001", name: "Organization seeking AI governance certification", weight: 0.55, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }] } },
    ],
  },

  // ── 30. New Zealand AI Strategy and Guidelines ───────────────────────────
  {
    id: "law-030",
    slug: "new-zealand-ai-strategy",
    title: "New Zealand Algorithm Charter and AI Strategy",
    short_title: "NZ Algorithm Charter",
    jurisdiction: "New Zealand",
    jurisdiction_code: "NZ",
    issuing_body: "New Zealand Government — Statistics New Zealand",
    status: "in_force",
    content_type: "framework",
    adopted_date: "2020-07-01",
    effective_date: "2020-07-01",
    official_url: "https://www.data.govt.nz/toolkit/data-ethics/government-algorithm-transparency-and-accountability/algorithm-charter/",
    topics: ["Transparency", "Accountability", "Fairness", "Human Oversight"],
    summary_short: "New Zealand's Algorithm Charter for government agencies, requiring transparency, human oversight, and bias management for algorithmic decision-making in public services.",
    summary_long: "The New Zealand Algorithm Charter is a voluntary commitment by government agencies to use algorithms and AI responsibly in public services. Signatories commit to: being transparent about how algorithms are used; assessing and managing bias; maintaining human oversight; engaging with affected communities; and publishing information about algorithmic systems. The charter was signed by 30+ government agencies and is now a baseline expectation for public sector AI use in New Zealand. The 2024 updated strategy extends these commitments.",
    obligations: [
      { id: "nz-001", title: "Algorithm transparency publication", description: "Publish clear information about algorithmic systems used in public services, including purpose and impact.", category: "Transparency", priority: "high", citation: "Charter Commitment 1", action_required: "Create algorithm register; publish entries for each algorithmic system in use." },
      { id: "nz-002", title: "Bias and fairness assessment", description: "Conduct bias assessments for algorithmic systems affecting different population groups.", category: "Fairness", priority: "high", citation: "Charter Commitment 3", action_required: "Conduct demographic impact analysis; document findings; implement bias mitigations." },
      { id: "nz-003", title: "Human review for consequential decisions", description: "Ensure human review is available for all algorithmic decisions with significant impacts on individuals.", category: "Human Oversight", priority: "critical", citation: "Charter Commitment 2", action_required: "Map all consequential algorithmic decisions; implement human review pathway for each." },
    ],
    applicability_rules: [
      { id: "nz-rule-001", name: "AI in New Zealand public services", weight: 0.65, rule_json: { all: [{ fact: "uses_ai", operator: "equals", value: true }, { fact: "target_markets", operator: "contains", value: "NZ" }] } },
    ],
  },
];

// ── Freshness metadata injection ─────────────────────────────────────────────
// Sets freshness_sla_days, draft_status, and last_reviewed_at on key laws.
const freshnessMap: Record<string, { freshness_sla_days: number; draft_status: "draft" | "published"; last_reviewed_at: string }> = {
  "eu-ai-act": { freshness_sla_days: 90, draft_status: "published", last_reviewed_at: "2025-03-01" },
  "us-ai-executive-order-14110": { freshness_sla_days: 60, draft_status: "published", last_reviewed_at: "2025-01-15" },
  "colorado-sb205": { freshness_sla_days: 120, draft_status: "published", last_reviewed_at: "2025-02-10" },
  "gdpr": { freshness_sla_days: 180, draft_status: "published", last_reviewed_at: "2024-11-20" },
  "ccpa-cpra": { freshness_sla_days: 120, draft_status: "published", last_reviewed_at: "2024-12-05" },
  "uk-ai-safety-framework": { freshness_sla_days: 90, draft_status: "published", last_reviewed_at: "2025-01-20" },
  "canada-aida": { freshness_sla_days: 90, draft_status: "draft", last_reviewed_at: "2025-02-01" },
  "us-state-ai-bills": { freshness_sla_days: 60, draft_status: "published", last_reviewed_at: "2025-03-10" },
  "nist-ai-rmf": { freshness_sla_days: 180, draft_status: "published", last_reviewed_at: "2024-10-15" },
  "nyc-local-law-144": { freshness_sla_days: 120, draft_status: "published", last_reviewed_at: "2025-01-08" },
  "eu-product-liability-directive": { freshness_sla_days: 120, draft_status: "draft", last_reviewed_at: "2025-02-20" },
  "eu-cyber-resilience-act": { freshness_sla_days: 90, draft_status: "published", last_reviewed_at: "2025-01-30" },
  "spain-aesia-ai-supervision": { freshness_sla_days: 90, draft_status: "draft", last_reviewed_at: "2024-12-15" },
  "un-ai-governance-framework": { freshness_sla_days: 180, draft_status: "published", last_reviewed_at: "2024-09-01" },
};

for (const law of laws) {
  const meta = freshnessMap[law.slug];
  if (meta) {
    law.freshness_sla_days = meta.freshness_sla_days;
    law.draft_status = meta.draft_status;
    law.last_reviewed_at = meta.last_reviewed_at;
  } else {
    law.freshness_sla_days = 180;
    law.draft_status = "published";
    law.last_reviewed_at = "2024-06-01";
  }
}


// ── Helpers ──────────────────────────────────────────────────────────────────

export function getLawBySlug(slug: string): Law | undefined {
  return laws.find((l) => l.slug === slug);
}

export function searchLaws(params: {
  search?: string;
  jurisdiction?: string;
  topic?: string;
  status?: string;
}): Law[] {
  let results = [...laws];

  if (params.search) {
    const q = params.search.toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.short_title.toLowerCase().includes(q) ||
        l.summary_short.toLowerCase().includes(q) ||
        l.topics.some((t) => t.toLowerCase().includes(q)) ||
        l.jurisdiction.toLowerCase().includes(q),
    );
  }

  if (params.jurisdiction && params.jurisdiction !== "all") {
    results = results.filter(
      (l) =>
        l.jurisdiction_code === params.jurisdiction ||
        l.jurisdiction.toLowerCase().includes(params.jurisdiction!.toLowerCase()),
    );
  }

  if (params.topic && params.topic !== "all") {
    const t = params.topic.toLowerCase();
    results = results.filter((l) =>
      l.topics.some((topic) => topic.toLowerCase().includes(t)),
    );
  }

  if (params.status && params.status !== "all") {
    results = results.filter((l) => l.status === params.status);
  }

  return results;
}

export const JURISDICTIONS = [
  { code: "EU", label: "European Union" },
  { code: "US", label: "United States" },
  { code: "UK", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "CN", label: "China" },
  { code: "BR", label: "Brazil" },
  { code: "SG", label: "Singapore" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "IN", label: "India" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "NZ", label: "New Zealand" },
  { code: "INTL", label: "International" },
];

export const TOPICS = [
  "Risk Classification",
  "High-Risk AI",
  "GPAI",
  "Transparency",
  "Automated Decision Making",
  "Data Governance",
  "Biometric",
  "Content Moderation",
  "Safety",
  "Accountability",
  "Employment",
  "Fairness",
  "Human Oversight",
  "Risk Management",
  "Consent",
  "Data Rights",
  "Bias Audit",
  "Compliance",
  "Documentation",
];

export const STATUSES = [
  { value: "in_force", label: "In Force" },
  { value: "enacted", label: "Enacted" },
  { value: "proposed", label: "Proposed" },
  { value: "draft", label: "Draft" },
];
