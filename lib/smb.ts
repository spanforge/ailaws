import { getLawBySlug, type Law } from "./lexforge-data";
import type { AssessmentInput, AssessmentResult, TriggeredObligation } from "./rules-engine";

export type ProductPreset = {
  id: string;
  title: string;
  description: string;
  audience: string;
  input: Partial<AssessmentInput>;
};

export const PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: "customer-support-chatbot",
    title: "Customer support chatbot",
    description: "Public-facing assistant that answers questions, resolves tickets, and handles customer data.",
    audience: "Founder, product, support",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "SaaS",
      target_markets: ["US", "EU"],
      product_type: "generative_ai",
      use_cases: ["customer_service", "content_generation"],
      deployment_context: "public",
      uses_ai: true,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: false,
      risk_self_assessment: "limited",
    },
  },
  {
    id: "recruiting-ai",
    title: "Recruiting or hiring AI",
    description: "Candidate screening, ranking, interview analysis, or recruiting workflow automation.",
    audience: "Founder, HR, product",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "HR Tech",
      target_markets: ["US", "EU"],
      product_type: "saas",
      use_cases: ["hr", "education"],
      deployment_context: "enterprise",
      uses_ai: true,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: true,
      risk_self_assessment: "high",
    },
  },
  {
    id: "health-assistant",
    title: "Health assistant",
    description: "Healthcare guidance, triage, documentation, or patient-facing assistant workflows.",
    audience: "Founder, ops, clinical product",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "Healthcare",
      target_markets: ["US", "EU"],
      product_type: "generative_ai",
      use_cases: ["medical", "customer_service"],
      deployment_context: "public",
      uses_ai: true,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: true,
      risk_self_assessment: "high",
    },
  },
  {
    id: "internal-copilot",
    title: "Internal productivity copilot",
    description: "Employee-facing assistant for drafting, search, summarization, and internal knowledge tasks.",
    audience: "Founder, ops, engineering",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "SaaS",
      target_markets: ["US"],
      product_type: "generative_ai",
      use_cases: ["content_generation", "general_purpose"],
      deployment_context: "enterprise",
      uses_ai: true,
      processes_personal_data: true,
      processes_eu_personal_data: false,
      automated_decisions: false,
      risk_self_assessment: "limited",
    },
  },
  {
    id: "marketing-generator",
    title: "Marketing content generator",
    description: "Generates copy, images, campaigns, or brand assets for marketing teams.",
    audience: "Founder, growth, product",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "Marketing Tech",
      target_markets: ["US", "EU"],
      product_type: "generative_ai",
      use_cases: ["content_generation"],
      deployment_context: "public",
      uses_ai: true,
      processes_personal_data: false,
      processes_eu_personal_data: false,
      automated_decisions: false,
      risk_self_assessment: "limited",
    },
  },
  {
    id: "recommendation-engine",
    title: "Recommendation engine",
    description: "Personalized ranking or recommendation system for products, content, or offers.",
    audience: "Founder, product, engineering",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "E-commerce",
      target_markets: ["US", "EU"],
      product_type: "saas",
      use_cases: ["recommendation"],
      deployment_context: "public",
      uses_ai: true,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: true,
      risk_self_assessment: "limited",
    },
  },
  {
    id: "fraud-detection",
    title: "Fraud detection",
    description: "Risk scoring or detection system used to flag transactions, users, or suspicious activity.",
    audience: "Founder, ops, engineering",
    input: {
      hq_region: "US",
      company_size: "startup",
      industry: "Fintech",
      target_markets: ["US", "EU"],
      product_type: "saas",
      use_cases: ["fraud_detection", "credit_scoring"],
      deployment_context: "enterprise",
      uses_ai: true,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: true,
      risk_self_assessment: "high",
    },
  },
];

export function getProductPresetById(id?: string | null): ProductPreset | undefined {
  if (!id) return undefined;
  return PRODUCT_PRESETS.find((preset) => preset.id === id);
}

export function applyProductPreset(base: AssessmentInput, presetId: string): AssessmentInput {
  const preset = getProductPresetById(presetId);
  if (!preset) return base;

  return {
    ...base,
    ...preset.input,
    target_markets: preset.input.target_markets ?? base.target_markets,
    use_cases: preset.input.use_cases ?? base.use_cases,
    product_preset: preset.id,
  };
}

export type OwnerHint = "founder" | "product" | "engineering" | "operations" | "legal";
export type EffortLabel = "low" | "medium" | "high";
export type ActionTimeline = "this_week" | "this_month" | "later";
export type ActionUrgency = "urgent" | "soon" | "monitor";

export type ActionPlanItem = {
  id: string;
  title: string;
  whyItMatters: string;
  owner: OwnerHint;
  urgency: ActionUrgency;
  effort: EffortLabel;
  timeline: ActionTimeline;
  lawSlug: string;
  lawShortTitle: string;
  citation: string;
};

export type PlainEnglishLawResult = AssessmentResult & {
  plainSummary: string;
  whoThisAppliesTo: string;
  whyYouMatched: string;
  whatToDoFirst: string;
  legalDetails: string;
};

export type PenaltySnapshot = {
  lawSlug: string;
  lawShortTitle: string;
  summary: string;
};

const ACTION_TIMELINE_LABELS: Record<ActionTimeline, string> = {
  this_week: "This week",
  this_month: "This month",
  later: "Later",
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  saas: "AI SaaS product",
  ai_model: "AI model or API",
  embedded: "AI-enabled product",
  platform: "AI platform or marketplace",
  generative_ai: "generative AI service",
  other: "AI product",
};

const USE_CASE_LABELS: Record<string, string> = {
  hr: "hiring or recruitment",
  credit_scoring: "credit or lending decisions",
  medical: "healthcare workflows",
  insurance: "insurance decisions",
  law_enforcement: "law-enforcement uses",
  biometric: "biometric identification",
  content_generation: "content generation",
  education: "education workflows",
  housing: "housing decisions",
  customer_service: "customer support",
  recommendation: "recommendations or ranking",
  fraud_detection: "fraud detection",
  general_purpose: "general AI assistant workflows",
};

const PENALTY_SNAPSHOTS: Record<string, string> = {
  "eu-ai-act": "Can trigger substantial EU fines, including multi-million-euro or global-turnover exposure for prohibited or non-compliant systems.",
  "eu-gdpr-ai": "Privacy violations can expose the company to GDPR administrative fines and corrective orders.",
  "colorado-ai-act": "State enforcement risk includes investigations, remediation demands, and penalties tied to consumer-protection violations.",
  "nyc-local-law-144": "Can create enforcement and reputational exposure if required bias-audit and notice steps are missed.",
};

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function formatUseCases(useCases: string[]): string {
  const labels = useCases.map((useCase) => USE_CASE_LABELS[useCase] ?? useCase.replace(/_/g, " "));
  if (labels.length === 0) return "general AI use";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

function mapTriggeredRules(result: AssessmentResult): string {
  if (result.triggered_rules.length === 0) {
    return "Your answers put this law close enough to warrant a practical review.";
  }

  return `You matched because the assessment flagged ${result.triggered_rules.join(", ").toLowerCase()}.`;
}

function summarizeLaw(result: AssessmentResult, input?: AssessmentInput): string {
  const law = getLawBySlug(result.law_slug);
  const productLabel = PRODUCT_TYPE_LABELS[input?.product_type ?? "other"] ?? "AI product";
  const marketHint = input?.target_markets?.includes(law?.jurisdiction_code ?? "")
    ? `selling into ${law?.jurisdiction}`
    : `operating with ${law?.jurisdiction} exposure`;

  const base = law?.summary_short
    ? truncateWords(law.summary_short, 26)
    : `${result.law_short_title} matters if you are ${marketHint} with an ${productLabel}.`;

  return truncateWords(base, 26);
}

function buildWhoThisAppliesTo(result: AssessmentResult, input?: AssessmentInput): string {
  const productLabel = PRODUCT_TYPE_LABELS[input?.product_type ?? "other"] ?? "AI product";
  const useCases = input?.use_cases?.length
    ? `teams using AI for ${formatUseCases(input.use_cases)}`
    : "teams deploying AI systems";

  return `${productLabel} teams ${useCases} in ${result.jurisdiction}.`;
}

function buildWhatToDoFirst(result: AssessmentResult): string {
  const firstObligation = result.triggered_obligations[0];
  if (firstObligation?.action_required) return firstObligation.action_required;
  if (firstObligation?.title) return `Start with: ${firstObligation.title}.`;
  return "Confirm scope, assign an owner, and document the first compliance review.";
}

function buildLegalDetails(result: AssessmentResult): string {
  const law = getLawBySlug(result.law_slug);
  const citations = result.triggered_obligations
    .slice(0, 3)
    .map((obligation) => obligation.citation)
    .filter(Boolean)
    .join(", ");

  return [result.rationale, citations ? `Key citations: ${citations}.` : "", law?.official_url ? `Official source: ${law.official_url}` : ""]
    .filter(Boolean)
    .join(" ");
}

function inferOwner(obligation: TriggeredObligation): OwnerHint {
  const haystack = `${obligation.category} ${obligation.title} ${obligation.action_required}`.toLowerCase();

  if (haystack.includes("documentation") || haystack.includes("technical") || haystack.includes("security") || haystack.includes("testing")) {
    return "engineering";
  }
  if (haystack.includes("consumer") || haystack.includes("incident") || haystack.includes("monitor") || haystack.includes("operations")) {
    return "operations";
  }
  if (haystack.includes("transparency") || haystack.includes("product") || haystack.includes("human oversight") || haystack.includes("appeal")) {
    return "product";
  }
  if (haystack.includes("legal") || haystack.includes("regulator") || haystack.includes("conformity") || haystack.includes("compliance")) {
    return "legal";
  }
  return "founder";
}

function inferTimeline(priority: string): ActionTimeline {
  if (priority === "critical") return "this_week";
  if (priority === "high") return "this_month";
  return "later";
}

function inferUrgency(priority: string): ActionUrgency {
  if (priority === "critical") return "urgent";
  if (priority === "high") return "soon";
  return "monitor";
}

function inferEffort(obligation: TriggeredObligation): EffortLabel {
  const haystack = `${obligation.category} ${obligation.title} ${obligation.action_required}`.toLowerCase();
  if (obligation.priority === "critical") return "high";
  if (haystack.includes("policy") || haystack.includes("notice") || haystack.includes("register")) return "low";
  if (haystack.includes("assessment") || haystack.includes("audit") || haystack.includes("documentation")) return "medium";
  return obligation.priority === "high" ? "medium" : "low";
}

export function enrichAssessmentResults(
  results: AssessmentResult[],
  input?: AssessmentInput,
): PlainEnglishLawResult[] {
  return results.map((result) => ({
    ...result,
    plainSummary: summarizeLaw(result, input),
    whoThisAppliesTo: buildWhoThisAppliesTo(result, input),
    whyYouMatched: mapTriggeredRules(result),
    whatToDoFirst: buildWhatToDoFirst(result),
    legalDetails: buildLegalDetails(result),
  }));
}

export function buildActionPlan(results: AssessmentResult[]): {
  topUrgentActions: ActionPlanItem[];
  groupedActions: Record<ActionTimeline, ActionPlanItem[]>;
  allActions: ActionPlanItem[];
} {
  const candidateResults = results.filter(
    (result) => result.applicability_status === "likely_applies" || result.applicability_status === "may_apply",
  );

  const actions = candidateResults.flatMap((result) => {
    const obligations = result.triggered_obligations.length > 0
      ? result.triggered_obligations
      : [
          {
            id: `${result.law_id}-review`,
            title: `Review ${result.law_short_title} applicability`,
            description: "This law matched strongly enough to require an internal owner and a short compliance review.",
            category: "Compliance",
            priority: result.applicability_status === "likely_applies" ? "high" : "medium",
            citation: "",
            action_required: "Assign an owner, confirm scope, and document the first compliance decision.",
          } satisfies TriggeredObligation,
        ];

    return obligations.map((obligation) => ({
      id: `${result.law_slug}-${obligation.id}`,
      title: obligation.title,
      whyItMatters: obligation.description,
      owner: inferOwner(obligation),
      urgency: inferUrgency(obligation.priority),
      effort: inferEffort(obligation),
      timeline: inferTimeline(obligation.priority),
      lawSlug: result.law_slug,
      lawShortTitle: result.law_short_title,
      citation: obligation.citation,
    }));
  });

  const deduped = actions.filter((action, index, list) =>
    list.findIndex((candidate) => candidate.title === action.title && candidate.lawSlug === action.lawSlug) === index,
  );

  const timelineOrder: ActionTimeline[] = ["this_week", "this_month", "later"];
  const urgencyRank: Record<ActionUrgency, number> = { urgent: 0, soon: 1, monitor: 2 };
  const effortRank: Record<EffortLabel, number> = { low: 0, medium: 1, high: 2 };

  const sorted = [...deduped].sort((left, right) => {
    const timelineDelta = timelineOrder.indexOf(left.timeline) - timelineOrder.indexOf(right.timeline);
    if (timelineDelta !== 0) return timelineDelta;
    const urgencyDelta = urgencyRank[left.urgency] - urgencyRank[right.urgency];
    if (urgencyDelta !== 0) return urgencyDelta;
    return effortRank[left.effort] - effortRank[right.effort];
  });

  return {
    topUrgentActions: sorted.slice(0, 3),
    groupedActions: {
      this_week: sorted.filter((action) => action.timeline === "this_week"),
      this_month: sorted.filter((action) => action.timeline === "this_month"),
      later: sorted.filter((action) => action.timeline === "later"),
    },
    allActions: sorted,
  };
}

export function getActionTimelineLabel(timeline: ActionTimeline): string {
  return ACTION_TIMELINE_LABELS[timeline];
}

export function buildPenaltySnapshot(results: AssessmentResult[]): PenaltySnapshot[] {
  return results
    .filter((result) => result.applicability_status === "likely_applies" || result.applicability_status === "may_apply")
    .slice(0, 3)
    .map((result) => ({
      lawSlug: result.law_slug,
      lawShortTitle: result.law_short_title,
      summary: PENALTY_SNAPSHOTS[result.law_slug] ?? "Review this law's enforcement section and penalty schedule before launch or expansion.",
    }));
}

export function buildProductSummary(input?: AssessmentInput | null): string {
  if (!input) return "Assessment profile unavailable.";

  const productLabel = PRODUCT_TYPE_LABELS[input.product_type] ?? "AI product";
  const useCases = formatUseCases(input.use_cases);
  const markets = input.target_markets.length > 0 ? input.target_markets.join(", ") : "no target markets selected";

  return `${productLabel} focused on ${useCases}. HQ ${input.hq_region || "not provided"}, targeting ${markets}, with ${input.deployment_context} deployment.`;
}

export function buildKeySources(results: AssessmentResult[]): Array<{ title: string; url: string }> {
  return results
    .filter((result) => result.applicability_status === "likely_applies" || result.applicability_status === "may_apply")
    .slice(0, 5)
    .map((result) => getLawBySlug(result.law_slug))
    .filter((law): law is Law => Boolean(law?.official_url))
    .map((law) => ({ title: law.short_title, url: law.official_url }));
}

export type TemplateEntry = {
  slug: string;
  title: string;
  intendedUser: string;
  useCase: string;
  lastReviewed: string;
  disclaimer: string;
  fileName: string;
  body: string;
};

export const TEMPLATE_LIBRARY: TemplateEntry[] = [
  {
    slug: "ai-usage-policy",
    title: "AI usage policy",
    intendedUser: "Founder or operations lead",
    useCase: "Set baseline internal rules for approved AI use, data handling, and review expectations.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template for operational planning only. Adapt with counsel before relying on it as legal advice.",
    fileName: "lexforge-ai-usage-policy.md",
    body: `# AI Usage Policy

## Purpose
Set baseline rules for how the company uses AI systems safely and responsibly.

## Scope
Applies to employees, contractors, and approved vendors using AI tools for company work.

## Allowed Uses
- Drafting, summarization, translation, coding assistance, and internal knowledge support.
- Customer-facing use only when product and legal owners approve the workflow.

## Restricted Uses
- Uploading confidential customer data into unapproved AI tools.
- Fully automated high-impact decisions in hiring, credit, healthcare, housing, insurance, or similar domains without review.
- Generating deceptive, discriminatory, or unlawful content.

## Required Controls
- Maintain an inventory of approved AI tools and owners.
- Label AI-generated customer-facing content where required.
- Require human review for consequential outputs.
- Escalate incidents, bias concerns, and security issues within one business day.

## Review
Review this policy quarterly and after major model or workflow changes.
`,
  },
  {
    slug: "vendor-diligence-checklist",
    title: "Vendor diligence checklist",
    intendedUser: "Founder, procurement, or engineering lead",
    useCase: "Review external AI vendors before procurement or renewal.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template for diligence support only. It does not replace legal, security, or procurement review.",
    fileName: "lexforge-vendor-diligence-checklist.md",
    body: `# Vendor Diligence Checklist

- Identify the vendor, product name, and business owner.
- Confirm where data is processed and stored.
- Ask whether the vendor uses sub-processors or third-party models.
- Request security documentation, incident process, and retention terms.
- Confirm model-update notice commitments.
- Review bias, testing, and human-oversight controls.
- Confirm rights to audit, terminate, and export data.
- Record decision, approver, and renewal date.
`,
  },
  {
    slug: "model-change-review-checklist",
    title: "Model change review checklist",
    intendedUser: "Product or engineering lead",
    useCase: "Review risk before changing models, prompts, vendors, or training data.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template for product review only. Validate legal and security impact before launch.",
    fileName: "lexforge-model-change-review-checklist.md",
    body: `# Model Change Review Checklist

- What changed: model, prompt, retrieval source, threshold, dataset, or vendor?
- Does the change affect regulated use cases or customer-facing disclosures?
- Do accuracy, bias, or safety tests need to be rerun?
- Do updated docs, model cards, or notices need publication?
- Who approved the change?
- What is the rollback plan?
`,
  },
  {
    slug: "transparency-notice-template",
    title: "Transparency notice template",
    intendedUser: "Product or legal owner",
    useCase: "Provide a clear user-facing notice that AI is being used.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template wording only. Tailor to the actual product flow and jurisdiction-specific requirements.",
    fileName: "lexforge-transparency-notice-template.md",
    body: `# Transparency Notice Template

We use AI tools to support parts of this product experience.

What the AI does:
- [Describe the task or decision support function]

What a human still does:
- [Describe review, override, or escalation steps]

What data may be used:
- [List relevant categories of data]

What to do if you have questions:
- Contact [team/contact method]
`,
  },
  {
    slug: "launch-readiness-checklist",
    title: "Launch readiness checklist",
    intendedUser: "Founder or cross-functional launch owner",
    useCase: "Final launch check for regulated AI features.",
    lastReviewed: "2026-04-23",
    disclaimer: "Planning aid only. Final launch approval should include legal, security, and product review.",
    fileName: "lexforge-launch-readiness-checklist.md",
    body: `# Launch Readiness Checklist

- Assessment rerun completed for the release candidate.
- Top applicable laws reviewed by an owner.
- Required notices, policies, and support flows are live.
- Incident escalation and contact paths are documented.
- Model or vendor change log is updated.
- Evidence package is stored for the launch decision.
`,
  },
];

export function getTemplateBySlug(slug: string): TemplateEntry | undefined {
  return TEMPLATE_LIBRARY.find((template) => template.slug === slug);
}
