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
  whyThisMattersThisWeek: string;
  founderSummary: string;
  lastReviewed: string;
  freshnessLabel: string;
  freshnessTone: "fresh" | "aging" | "stale";
  sourceUrl?: string;
};

export type PenaltySnapshot = {
  lawSlug: string;
  lawShortTitle: string;
  summary: string;
};

export type AssessmentDeltaSummary = {
  summary: string;
  newLikelyApplies: string[];
  newlyDowngraded: string[];
  unchangedTopMatches: string[];
};

export type AssessmentDiffEntry = {
  lawSlug: string;
  lawShortTitle: string;
  previousStatus: AssessmentResult["applicability_status"] | "not_applicable";
  currentStatus: AssessmentResult["applicability_status"] | "not_applicable";
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  changeType: "new" | "reduced" | "increased" | "decreased" | "unchanged";
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

const LAW_REVIEW_OVERRIDES: Record<string, string> = {
  "eu-ai-act": "2026-04-23",
  "colorado-ai-act": "2026-04-21",
  "eu-cyber-resilience-act": "2026-04-22",
  "iso-iec-42001": "2026-04-18",
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

function formatDisplayDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function diffInDays(dateString: string): number {
  const target = new Date(`${dateString}T00:00:00Z`).getTime();
  const now = new Date().getTime();
  return Math.max(0, Math.floor((now - target) / (1000 * 60 * 60 * 24)));
}

export function getLawLastReviewed(lawSlug: string): string {
  const law = getLawBySlug(lawSlug);
  const fallback =
    law?.status === "in_force" || law?.status === "enacted" ? "2026-04-23" : "2026-04-18";
  return LAW_REVIEW_OVERRIDES[lawSlug] ?? fallback;
}

export function getFreshnessTone(reviewDate: string): "fresh" | "aging" | "stale" {
  const days = diffInDays(reviewDate);
  if (days <= 45) return "fresh";
  if (days <= 120) return "aging";
  return "stale";
}

export function getFreshnessLabel(reviewDate: string): string {
  const tone = getFreshnessTone(reviewDate);
  if (tone === "fresh") return `Reviewed recently on ${formatDisplayDate(reviewDate)}`;
  if (tone === "aging") return `Review is aging from ${formatDisplayDate(reviewDate)}`;
  return `Needs refresh. Last reviewed ${formatDisplayDate(reviewDate)}`;
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

function buildWhyThisMattersThisWeek(result: AssessmentResult, input?: AssessmentInput): string {
  const law = getLawBySlug(result.law_slug);
  const marketSignal = input?.target_markets?.length
    ? `because you are targeting ${input.target_markets.join(", ")}`
    : "because your current product profile matches its scope";
  const firstAction = buildWhatToDoFirst(result);

  if (result.applicability_status === "likely_applies") {
    return `${result.law_short_title} is worth acting on this week ${marketSignal}. Start by making one owner accountable for: ${firstAction}`;
  }

  if (result.applicability_status === "may_apply") {
    return `${result.law_short_title} is a near-term watch item ${marketSignal}. Clarify scope now so you do not discover a blocker late in launch or expansion.`;
  }

  return `${law?.short_title ?? result.law_short_title} is not a current priority, but keep it on your watchlist if your markets, use case, or decision flows change.`;
}

function buildFounderSummary(result: AssessmentResult, input?: AssessmentInput): string {
  const useCaseSummary = input?.use_cases?.length ? formatUseCases(input.use_cases) : "your current AI workflow";

  if (result.applicability_status === "likely_applies") {
    return `This likely affects ${useCaseSummary}. Put an owner on it and handle the first requirement before the next product or market change.`;
  }

  if (result.applicability_status === "may_apply") {
    return `This could matter if ${useCaseSummary} becomes more automated or expands into a regulated market.`;
  }

  return `Low priority for now based on this product profile.`;
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
    whyThisMattersThisWeek: buildWhyThisMattersThisWeek(result, input),
    founderSummary: buildFounderSummary(result, input),
    lastReviewed: getLawLastReviewed(result.law_slug),
    freshnessLabel: getFreshnessLabel(getLawLastReviewed(result.law_slug)),
    freshnessTone: getFreshnessTone(getLawLastReviewed(result.law_slug)),
    sourceUrl: getLawBySlug(result.law_slug)?.official_url,
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

export type ExecutiveVerdict = {
  status: "proceed" | "action_required" | "significant_exposure";
  label: string;
  headline: string;
  summary: string;
  topRisks: string[];
  immediateActions: string[];
  ownerRecommendation: string;
};

export function buildExecutiveVerdict(
  results: AssessmentResult[],
  input?: AssessmentInput,
): ExecutiveVerdict {
  const likelyApplies = results.filter((r) => r.applicability_status === "likely_applies");
  const mayApply = results.filter((r) => r.applicability_status === "may_apply");
  const criticalObligations = likelyApplies.flatMap((r) =>
    r.triggered_obligations.filter((o) => o.priority === "critical"),
  );
  const highObligations = likelyApplies.flatMap((r) =>
    r.triggered_obligations.filter((o) => o.priority === "high"),
  );

  const topRisks = likelyApplies
    .slice(0, 3)
    .map((r) => {
      const firstObligation = r.triggered_obligations[0];
      return firstObligation
        ? `${r.law_short_title}: ${firstObligation.title}`
        : `${r.law_short_title} applies to this profile`;
    });

  const immediateActions = criticalObligations
    .slice(0, 3)
    .map((o) => o.action_required || o.title)
    .concat(highObligations.slice(0, Math.max(0, 3 - criticalObligations.length)).map((o) => o.action_required || o.title));

  const hasHighRiskUseCase =
    input?.use_cases?.some((uc) => ["hr", "credit_scoring", "medical", "biometric", "law_enforcement"].includes(uc)) ?? false;

  let status: ExecutiveVerdict["status"];
  let label: string;
  let headline: string;
  let summary: string;
  let ownerRecommendation: string;

  if (likelyApplies.length === 0 && mayApply.length <= 1) {
    status = "proceed";
    label = "Low regulatory exposure";
    headline = "This profile has low current regulatory exposure.";
    summary =
      "Based on your assessment inputs, no AI laws currently apply with high confidence. Continue building, but revisit if you expand into EU markets, add automated decision-making, or process biometric or health data.";
    ownerRecommendation = "Founder or ops lead. Monitor quarterly.";
  } else if (likelyApplies.length >= 3 || criticalObligations.length >= 2 || hasHighRiskUseCase) {
    status = "significant_exposure";
    label = "Significant exposure — legal review needed";
    headline = `${likelyApplies.length} law${likelyApplies.length !== 1 ? "s" : ""} likely apply with ${criticalObligations.length} critical obligation${criticalObligations.length !== 1 ? "s" : ""} identified.`;
    summary =
      "This product profile carries meaningful regulatory exposure. Critical obligations require owner assignment, documented evidence, and a legal review before launch or enterprise sales. Export the evidence package and share with counsel before committing to timelines.";
    ownerRecommendation = "Legal or compliance lead, with product and engineering for technical controls.";
  } else {
    status = "action_required";
    label = "Action required before launch";
    headline = `${likelyApplies.length} law${likelyApplies.length !== 1 ? "s" : ""} likely appl${likelyApplies.length !== 1 ? "y" : "ies"}, ${mayApply.length} more may apply.`;
    summary =
      "This profile has manageable but real regulatory exposure. Assign owners to the top obligations, produce the required documentation, and run this through a short legal review before a regulated customer or enterprise procurement review.";
    ownerRecommendation = "Product lead with founder sign-off. Escalate to legal if critical obligations are triggered.";
  }

  return {
    status,
    label,
    headline,
    summary,
    topRisks,
    immediateActions: immediateActions.slice(0, 3),
    ownerRecommendation,
  };
}

export function getObligationDueDateSuggestion(priority: string): string {
  const now = new Date();
  if (priority === "critical") {
    now.setDate(now.getDate() + 7);
    return `By ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (this week)`;
  }
  if (priority === "high") {
    now.setDate(now.getDate() + 30);
    return `By ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (this month)`;
  }
  now.setDate(now.getDate() + 90);
  return `By ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (next quarter)`;
}

export function buildRecommendedControls(results: AssessmentResult[]): Array<{ category: string; controls: string[] }> {
  const applicable = results.filter(
    (r) => r.applicability_status === "likely_applies" || r.applicability_status === "may_apply",
  );

  const controlMap: Record<string, Set<string>> = {
    "Data governance": new Set(),
    "Technical controls": new Set(),
    "Transparency & disclosure": new Set(),
    "Human oversight": new Set(),
    "Documentation": new Set(),
  };

  for (const result of applicable) {
    for (const obligation of result.triggered_obligations) {
      const hay = `${obligation.category} ${obligation.title} ${obligation.action_required}`.toLowerCase();
      if (hay.includes("privacy") || hay.includes("data protection") || hay.includes("pii"))
        controlMap["Data governance"].add("PII detection and redaction controls");
      if (hay.includes("security") || hay.includes("robustness") || hay.includes("integrity"))
        controlMap["Technical controls"].add("Security testing and adversarial robustness checks");
      if (hay.includes("transparency") || hay.includes("disclosure") || hay.includes("notice"))
        controlMap["Transparency & disclosure"].add("AI disclosure notices for end users");
      if (hay.includes("human") || hay.includes("oversight") || hay.includes("appeal"))
        controlMap["Human oversight"].add("Human review pathway for automated decisions");
      if (hay.includes("documentation") || hay.includes("technical doc") || hay.includes("audit trail"))
        controlMap["Documentation"].add("Technical documentation and audit trail");
      if (hay.includes("bias") || hay.includes("fairness") || hay.includes("discrimination"))
        controlMap["Technical controls"].add("Bias testing and fairness evaluation");
      if (hay.includes("monitoring") || hay.includes("post-market") || hay.includes("performance"))
        controlMap["Technical controls"].add("Post-deployment monitoring and drift detection");
      if (hay.includes("incident") || hay.includes("report") || hay.includes("breach"))
        controlMap["Data governance"].add("Incident response and regulatory reporting process");
    }
  }

  return Object.entries(controlMap)
    .map(([category, controls]) => ({ category, controls: [...controls] }))
    .filter((group) => group.controls.length > 0);
}

export function buildKeySources(results: AssessmentResult[]): Array<{ title: string; url: string }> {
  return results
    .filter((result) => result.applicability_status === "likely_applies" || result.applicability_status === "may_apply")
    .slice(0, 5)
    .map((result) => getLawBySlug(result.law_slug))
    .filter((law): law is Law => Boolean(law?.official_url))
    .map((law) => ({ title: `${law.short_title} (reviewed ${formatDisplayDate(getLawLastReviewed(law.slug))})`, url: law.official_url }));
}

export function buildAssessmentDeltaSummary(
  currentResults: AssessmentResult[],
  previousResults?: AssessmentResult[] | null,
): AssessmentDeltaSummary | null {
  if (!previousResults || previousResults.length === 0) return null;

  const previousBySlug = new Map(previousResults.map((result) => [result.law_slug, result]));
  const currentLikely = currentResults.filter((result) => result.applicability_status === "likely_applies");
  const previousLikely = previousResults.filter((result) => result.applicability_status === "likely_applies");

  const newLikelyApplies = currentLikely
    .filter((result) => previousBySlug.get(result.law_slug)?.applicability_status !== "likely_applies")
    .slice(0, 3)
    .map((result) => result.law_short_title);

  const newlyDowngraded = previousLikely
    .filter((result) => previousBySlug.has(result.law_slug))
    .filter((result) => {
      const current = currentResults.find((entry) => entry.law_slug === result.law_slug);
      return current && current.applicability_status !== "likely_applies";
    })
    .slice(0, 3)
    .map((result) => result.law_short_title);

  const unchangedTopMatches = currentLikely
    .filter((result) => previousBySlug.get(result.law_slug)?.applicability_status === "likely_applies")
    .slice(0, 3)
    .map((result) => result.law_short_title);

  const summaryParts: string[] = [];
  if (newLikelyApplies.length > 0) {
    summaryParts.push(`New likely matches: ${newLikelyApplies.join(", ")}`);
  }
  if (newlyDowngraded.length > 0) {
    summaryParts.push(`Reduced priority: ${newlyDowngraded.join(", ")}`);
  }
  if (summaryParts.length === 0 && unchangedTopMatches.length > 0) {
    summaryParts.push(`No major scope shift. Core matches still include ${unchangedTopMatches.join(", ")}`);
  }
  if (summaryParts.length === 0) {
    summaryParts.push("No major scope shift since the last assessment.");
  }

  return {
    summary: summaryParts.join(". "),
    newLikelyApplies,
    newlyDowngraded,
    unchangedTopMatches,
  };
}

export function buildAssessmentDiff(
  currentResults: AssessmentResult[],
  previousResults?: AssessmentResult[] | null,
): AssessmentDiffEntry[] {
  if (!previousResults || previousResults.length === 0) {
    return [];
  }

  const currentBySlug = new Map(currentResults.map((result) => [result.law_slug, result]));
  const previousBySlug = new Map(previousResults.map((result) => [result.law_slug, result]));
  const allSlugs = Array.from(new Set([...currentBySlug.keys(), ...previousBySlug.keys()]));

  const rank = (status: AssessmentResult["applicability_status"] | "not_applicable") => {
    if (status === "likely_applies") return 3;
    if (status === "may_apply") return 2;
    if (status === "unlikely") return 1;
    return 0;
  };

  return allSlugs
    .map((slug) => {
      const current = currentBySlug.get(slug);
      const previous = previousBySlug.get(slug);
      const currentStatus: AssessmentDiffEntry["currentStatus"] = current?.applicability_status ?? "not_applicable";
      const previousStatus: AssessmentDiffEntry["previousStatus"] = previous?.applicability_status ?? "not_applicable";
      const currentScore = current?.relevance_score ?? 0;
      const previousScore = previous?.relevance_score ?? 0;
      const scoreDelta = Number((currentScore - previousScore).toFixed(3));

      let changeType: AssessmentDiffEntry["changeType"] = "unchanged";
      if (rank(currentStatus) > rank(previousStatus)) {
        changeType = previousStatus === "not_applicable" ? "new" : "increased";
      } else if (rank(currentStatus) < rank(previousStatus)) {
        changeType = currentStatus === "not_applicable" ? "reduced" : "decreased";
      } else if (Math.abs(scoreDelta) >= 0.1) {
        changeType = scoreDelta > 0 ? "increased" : "decreased";
      }

      return {
        lawSlug: slug,
        lawShortTitle: current?.law_short_title ?? previous?.law_short_title ?? slug,
        previousStatus,
        currentStatus,
        previousScore,
        currentScore,
        scoreDelta,
        changeType,
      };
    })
    .filter((entry) => entry.changeType !== "unchanged")
    .sort((left, right) => Math.abs(right.scoreDelta) - Math.abs(left.scoreDelta));
}

export type TemplateEntry = {
  slug: string;
  title: string;
  intendedUser: string;
  useCase: string;
  lastReviewed: string;
  disclaimer: string;
  fileName: string;
  formatLabel: string;
  body: string;
};

function renderTemplateDocument(params: {
  title: string;
  subtitle: string;
  lastReviewed: string;
  disclaimer: string;
  sections: Array<{ heading: string; content: string }>;
}): string {
  const sectionMarkup = params.sections
    .map(
      (section) => `
        <section class="section">
          <h2>${section.heading}</h2>
          ${section.content}
        </section>
      `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${params.title}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #102030;
        --muted: #5a6877;
        --line: #d8e0e8;
        --panel: #f6f8fb;
        --accent: #d97706;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        color: var(--ink);
        background: #eef3f8;
        line-height: 1.55;
      }
      .page {
        max-width: 960px;
        margin: 32px auto;
        background: #fff;
        border: 1px solid var(--line);
        box-shadow: 0 12px 36px rgba(16, 32, 48, 0.08);
      }
      .header {
        padding: 36px 40px 28px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(135deg, #fffaf0 0%, #ffffff 55%, #f7fbff 100%);
      }
      .eyebrow {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 34px;
        line-height: 1.1;
      }
      .subtitle {
        margin: 0;
        color: var(--muted);
        font-size: 16px;
        max-width: 72ch;
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        padding: 20px 40px;
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }
      .meta-card {
        padding: 12px 14px;
        border: 1px solid var(--line);
        background: #fff;
      }
      .meta-label {
        margin: 0 0 4px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .meta-value {
        margin: 0;
        font-size: 14px;
      }
      .content {
        padding: 32px 40px 40px;
      }
      .section + .section {
        margin-top: 28px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 20px;
        line-height: 1.2;
      }
      p {
        margin: 0 0 12px;
      }
      ul, ol {
        margin: 0 0 12px 20px;
        padding: 0;
      }
      li + li {
        margin-top: 6px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid var(--line);
        padding: 10px 12px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: var(--panel);
        font-size: 13px;
      }
      .placeholder {
        color: var(--muted);
        font-style: italic;
      }
      .footnote {
        margin-top: 28px;
        padding: 16px 18px;
        border: 1px solid var(--line);
        background: var(--panel);
        color: var(--muted);
        font-size: 13px;
      }
      @media print {
        body {
          background: #fff;
        }
        .page {
          margin: 0;
          box-shadow: none;
          border: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <p class="eyebrow">Spanforge Compass Template Library</p>
        <h1>${params.title}</h1>
        <p class="subtitle">${params.subtitle}</p>
      </header>
      <section class="meta">
        <div class="meta-card">
          <p class="meta-label">Last reviewed</p>
          <p class="meta-value">${params.lastReviewed}</p>
        </div>
        <div class="meta-card">
          <p class="meta-label">Format</p>
          <p class="meta-value">Editable HTML document compatible with browsers, Word, and Google Docs</p>
        </div>
      </section>
      <div class="content">
        ${sectionMarkup}
        <div class="footnote">${params.disclaimer}</div>
      </div>
    </main>
  </body>
</html>`;
}

export const TEMPLATE_LIBRARY: TemplateEntry[] = [
  {
    slug: "ai-usage-policy",
    title: "AI usage policy",
    intendedUser: "Founder or operations lead",
    useCase: "Set baseline internal rules for approved AI use, data handling, and review expectations.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template for operational planning only. Adapt with counsel before relying on it as legal advice.",
    fileName: "spanforge-compass-ai-usage-policy.html",
    formatLabel: "Editable HTML",
    body: renderTemplateDocument({
      title: "AI Usage Policy",
      subtitle: "Internal baseline policy for approved AI use, restricted activities, oversight, and accountability.",
      lastReviewed: "2026-04-23",
      disclaimer: "This template is for operational planning only. Adapt it to your actual tooling, data flows, employment policies, and legal obligations before rollout.",
      sections: [
        {
          heading: "1. Document control",
          content: `
            <table>
              <tr><th>Company</th><td class="placeholder">[Company name]</td></tr>
              <tr><th>Policy owner</th><td class="placeholder">[Role / team]</td></tr>
              <tr><th>Approved by</th><td class="placeholder">[Executive / committee]</td></tr>
              <tr><th>Effective date</th><td class="placeholder">[Date]</td></tr>
              <tr><th>Review cadence</th><td>Quarterly and after material model, vendor, or workflow changes</td></tr>
            </table>
          `,
        },
        {
          heading: "2. Purpose and scope",
          content: `
            <p>This policy sets the baseline rules for how employees, contractors, and approved service providers may use AI systems in company work.</p>
            <p>It applies to:</p>
            <ul>
              <li>Internal copilots, drafting tools, code assistants, analytics tools, and customer-facing AI features.</li>
              <li>Any workflow where an AI system generates content, recommendations, classifications, or decisions used by the company.</li>
              <li>Third-party tools and vendor-hosted models used with company, customer, employee, or prospect data.</li>
            </ul>
          `,
        },
        {
          heading: "3. Approved and prohibited uses",
          content: `
            <p><strong>Approved uses</strong></p>
            <ul>
              <li>Drafting, summarization, translation, coding assistance, support triage, and internal knowledge search.</li>
              <li>Customer-facing assistance only where the workflow has an owner, documented purpose, testing evidence, and required notices.</li>
              <li>Experimentation in sandbox or test environments approved by engineering or security.</li>
            </ul>
            <p><strong>Prohibited uses</strong></p>
            <ul>
              <li>Uploading confidential customer data, source code, secrets, regulated records, or personal data into unapproved tools.</li>
              <li>Using AI as the sole decision-maker for hiring, credit, housing, healthcare, insurance, education, law enforcement, or other high-impact domains.</li>
              <li>Generating deceptive, discriminatory, harassing, unlawful, or misleading content.</li>
              <li>Removing required human review, escalation, or audit steps from an approved workflow.</li>
            </ul>
          `,
        },
        {
          heading: "4. Mandatory control requirements",
          content: `
            <table>
              <tr><th>Control area</th><th>Minimum requirement</th></tr>
              <tr><td>Tool approval</td><td>Maintain an inventory of approved AI tools, owners, business purpose, and data-use limits.</td></tr>
              <tr><td>Data handling</td><td>Use only approved data classes. Follow retention, redaction, and access rules before submitting data.</td></tr>
              <tr><td>Human oversight</td><td>Require human review for consequential outputs, customer commitments, policy actions, and sensitive communications.</td></tr>
              <tr><td>Testing</td><td>Document accuracy, failure modes, bias checks, and escalation criteria before production use.</td></tr>
              <tr><td>Transparency</td><td>Label AI-generated or AI-assisted customer-facing content where required by law, policy, or contract.</td></tr>
              <tr><td>Incident response</td><td>Escalate security issues, harmful outputs, bias concerns, and policy violations within one business day.</td></tr>
              <tr><td>Change management</td><td>Review model, prompt, vendor, threshold, and data-source changes before release.</td></tr>
            </table>
          `,
        },
        {
          heading: "5. Roles and responsibilities",
          content: `
            <ul>
              <li><strong>Policy owner:</strong> Maintains this policy, training materials, and exception log.</li>
              <li><strong>Team managers:</strong> Ensure only approved tools and workflows are used by their teams.</li>
              <li><strong>Engineering / security:</strong> Review technical controls, logging, retention, and incident handling.</li>
              <li><strong>Product / operations:</strong> Maintain workflow descriptions, human-review steps, and customer-facing notices.</li>
              <li><strong>All users:</strong> Use AI responsibly, follow this policy, and report issues promptly.</li>
            </ul>
          `,
        },
        {
          heading: "6. Exceptions, training, and attestation",
          content: `
            <p>Any exception to this policy must be documented, approved, time-bounded, and reviewed before renewal.</p>
            <p class="placeholder">Exception owner: [Name / role]</p>
            <p class="placeholder">Required training completion method: [LMS / handbook / signed acknowledgement]</p>
            <p>Employees using approved AI tools must confirm that they have read this policy and understand the company escalation path for incidents and misuse.</p>
          `,
        },
      ],
    }),
  },
  {
    slug: "vendor-diligence-checklist",
    title: "Vendor diligence checklist",
    intendedUser: "Founder, procurement, or engineering lead",
    useCase: "Review external AI vendors before procurement or renewal.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template for diligence support only. It does not replace legal, security, or procurement review.",
    fileName: "spanforge-compass-vendor-diligence-checklist.html",
    formatLabel: "Editable HTML",
    body: renderTemplateDocument({
      title: "Vendor Diligence Checklist",
      subtitle: "Procurement and renewal checklist for third-party AI vendors, model providers, and AI-enabled SaaS tools.",
      lastReviewed: "2026-04-23",
      disclaimer: "Use this checklist to structure diligence and capture evidence. It does not replace legal review, security review, procurement controls, or negotiated contract terms.",
      sections: [
        {
          heading: "1. Vendor profile",
          content: `
            <table>
              <tr><th>Vendor legal name</th><td class="placeholder">[Vendor legal entity]</td></tr>
              <tr><th>Product / service</th><td class="placeholder">[Product name]</td></tr>
              <tr><th>Internal business owner</th><td class="placeholder">[Name / team]</td></tr>
              <tr><th>Use case</th><td class="placeholder">[What the tool will do]</td></tr>
              <tr><th>Customer-facing or internal</th><td class="placeholder">[Internal / customer-facing / both]</td></tr>
              <tr><th>Target launch / renewal date</th><td class="placeholder">[Date]</td></tr>
            </table>
          `,
        },
        {
          heading: "2. Data, privacy, and residency",
          content: `
            <ul>
              <li>Confirm what data categories the vendor will receive, generate, store, or derive.</li>
              <li>Document whether personal data, confidential business data, regulated records, or customer content are involved.</li>
              <li>Confirm where data is processed and stored, including cross-border transfers.</li>
              <li>Identify sub-processors, upstream model providers, and hosted infrastructure dependencies.</li>
              <li>Confirm retention periods, deletion timelines, and customer data export options.</li>
            </ul>
            <p class="placeholder">Notes / restrictions: [Insert approved data classes and prohibited data classes]</p>
          `,
        },
        {
          heading: "3. Security and operational controls",
          content: `
            <table>
              <tr><th>Question</th><th>Response / evidence</th><th>Status</th></tr>
              <tr><td>Security program and certifications available?</td><td class="placeholder">[SOC 2, ISO 27001, pen test, etc.]</td><td class="placeholder">[Pass / gap]</td></tr>
              <tr><td>Authentication, access control, and admin logging supported?</td><td class="placeholder">[Details]</td><td class="placeholder">[Pass / gap]</td></tr>
              <tr><td>Incident notification timeline contractually defined?</td><td class="placeholder">[Hours / days]</td><td class="placeholder">[Pass / gap]</td></tr>
              <tr><td>Business continuity and disaster recovery documented?</td><td class="placeholder">[Details]</td><td class="placeholder">[Pass / gap]</td></tr>
              <tr><td>Model or service change notices committed?</td><td class="placeholder">[Release notes / advance notice]</td><td class="placeholder">[Pass / gap]</td></tr>
            </table>
          `,
        },
        {
          heading: "4. AI governance and product risk",
          content: `
            <ul>
              <li>Ask how the vendor tests for accuracy, safety, bias, robustness, and misuse.</li>
              <li>Confirm whether human review, override, or fallback controls are available.</li>
              <li>Document whether the product makes or supports consequential decisions.</li>
              <li>Request documentation for model cards, evaluation summaries, acceptable use restrictions, and incident handling.</li>
              <li>Confirm whether customer data is used for training, tuning, or product improvement and whether opt-out exists.</li>
            </ul>
          `,
        },
        {
          heading: "5. Contract checkpoints and final decision",
          content: `
            <table>
              <tr><th>Checkpoint</th><th>Decision / owner</th></tr>
              <tr><td>Audit rights or alternative evidence accepted</td><td class="placeholder">[Yes / no / owner]</td></tr>
              <tr><td>Termination rights and transition support</td><td class="placeholder">[Yes / no / owner]</td></tr>
              <tr><td>Data return / deletion language confirmed</td><td class="placeholder">[Yes / no / owner]</td></tr>
              <tr><td>Legal review completed</td><td class="placeholder">[Date / approver]</td></tr>
              <tr><td>Security review completed</td><td class="placeholder">[Date / approver]</td></tr>
              <tr><td>Final decision</td><td class="placeholder">[Approve / approve with conditions / reject]</td></tr>
            </table>
          `,
        },
      ],
    }),
  },
  {
    slug: "model-change-review-checklist",
    title: "Model change review checklist",
    intendedUser: "Product or engineering lead",
    useCase: "Review risk before changing models, prompts, vendors, or training data.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template for product review only. Validate legal and security impact before launch.",
    fileName: "spanforge-compass-model-change-review-checklist.html",
    formatLabel: "Editable HTML",
    body: renderTemplateDocument({
      title: "Model Change Review Checklist",
      subtitle: "Structured review checklist for model swaps, prompt changes, retrieval changes, vendor migrations, and threshold updates.",
      lastReviewed: "2026-04-23",
      disclaimer: "This checklist supports release review only. High-risk or customer-facing changes may need deeper legal, security, quality, or compliance review.",
      sections: [
        {
          heading: "1. Change summary",
          content: `
            <table>
              <tr><th>Change owner</th><td class="placeholder">[Name / team]</td></tr>
              <tr><th>Release / ticket</th><td class="placeholder">[Link or ID]</td></tr>
              <tr><th>Change type</th><td class="placeholder">[Model / prompt / retrieval / threshold / vendor / dataset / policy]</td></tr>
              <tr><th>Reason for change</th><td class="placeholder">[Performance, cost, quality, reliability, legal, vendor change, etc.]</td></tr>
              <tr><th>Target release date</th><td class="placeholder">[Date]</td></tr>
            </table>
          `,
        },
        {
          heading: "2. Impact assessment",
          content: `
            <ul>
              <li>Describe what user-visible behavior changes are expected.</li>
              <li>Identify whether the change affects regulated or high-impact use cases.</li>
              <li>Confirm whether output confidence, escalation, or human-review thresholds change.</li>
              <li>Assess whether the change alters data flows, retention, or vendor exposure.</li>
              <li>Confirm whether any new jurisdictions, customer segments, or decision contexts are introduced.</li>
            </ul>
          `,
        },
        {
          heading: "3. Validation and testing",
          content: `
            <table>
              <tr><th>Check</th><th>Evidence</th><th>Status</th></tr>
              <tr><td>Accuracy / quality benchmark rerun</td><td class="placeholder">[Link / summary]</td><td class="placeholder">[Pass / fail / pending]</td></tr>
              <tr><td>Safety and misuse tests rerun</td><td class="placeholder">[Link / summary]</td><td class="placeholder">[Pass / fail / pending]</td></tr>
              <tr><td>Bias / fairness checks rerun where relevant</td><td class="placeholder">[Link / summary]</td><td class="placeholder">[Pass / fail / pending]</td></tr>
              <tr><td>Fallback / rollback tested</td><td class="placeholder">[Details]</td><td class="placeholder">[Pass / fail / pending]</td></tr>
              <tr><td>Monitoring and alert thresholds updated</td><td class="placeholder">[Details]</td><td class="placeholder">[Pass / fail / pending]</td></tr>
            </table>
          `,
        },
        {
          heading: "4. Documentation and disclosure updates",
          content: `
            <ul>
              <li>Update model cards, internal design docs, architecture diagrams, and support playbooks.</li>
              <li>Confirm whether transparency notices, customer-facing copy, or procurement materials need revision.</li>
              <li>Record whether a reassessment or evidence-package refresh is required before launch.</li>
              <li>Document whether training or enablement is needed for support, operations, or reviewers.</li>
            </ul>
          `,
        },
        {
          heading: "5. Approval and rollback",
          content: `
            <table>
              <tr><th>Approver role</th><th>Name</th><th>Date</th></tr>
              <tr><td>Product</td><td class="placeholder">[Name]</td><td class="placeholder">[Date]</td></tr>
              <tr><td>Engineering</td><td class="placeholder">[Name]</td><td class="placeholder">[Date]</td></tr>
              <tr><td>Security / privacy</td><td class="placeholder">[Name]</td><td class="placeholder">[Date]</td></tr>
              <tr><td>Legal / compliance if required</td><td class="placeholder">[Name]</td><td class="placeholder">[Date]</td></tr>
            </table>
            <p class="placeholder">Rollback plan: [Describe rollback trigger, owner, and maximum rollback time]</p>
          `,
        },
      ],
    }),
  },
  {
    slug: "transparency-notice-template",
    title: "Transparency notice template",
    intendedUser: "Product or legal owner",
    useCase: "Provide a clear user-facing notice that AI is being used.",
    lastReviewed: "2026-04-23",
    disclaimer: "Template wording only. Tailor to the actual product flow and jurisdiction-specific requirements.",
    fileName: "spanforge-compass-transparency-notice-template.html",
    formatLabel: "Editable HTML",
    body: renderTemplateDocument({
      title: "Transparency Notice Template",
      subtitle: "User-facing notice template for AI-assisted features, outputs, and review rights.",
      lastReviewed: "2026-04-23",
      disclaimer: "Template wording only. Tailor this notice to the exact workflow, product surface, and jurisdiction-specific disclosure rules that apply to your service.",
      sections: [
        {
          heading: "1. Short in-product notice",
          content: `
            <p><strong>Suggested short form</strong></p>
            <p>This feature uses AI to help generate or analyze outputs. A human may review results before final action where required.</p>
          `,
        },
        {
          heading: "2. Full notice template",
          content: `
            <p>We use AI tools to support parts of this product experience.</p>
            <p><strong>What the AI does</strong></p>
            <ul>
              <li class="placeholder">[Describe the task, recommendation, summary, classification, or generation function]</li>
            </ul>
            <p><strong>What a human still does</strong></p>
            <ul>
              <li class="placeholder">[Describe review, override, escalation, approval, or fallback steps]</li>
            </ul>
            <p><strong>What data may be used</strong></p>
            <ul>
              <li class="placeholder">[List relevant categories of data used or processed]</li>
            </ul>
            <p><strong>What this means for you</strong></p>
            <ul>
              <li class="placeholder">[Describe whether outputs are advisory, partially automated, or part of a decision flow]</li>
            </ul>
            <p><strong>Questions or concerns</strong></p>
            <ul>
              <li class="placeholder">Contact [team / email / support path]</li>
            </ul>
          `,
        },
        {
          heading: "3. Implementation checklist",
          content: `
            <ul>
              <li>Place the notice close to the AI interaction point, not buried only in a policy page.</li>
              <li>Align the notice with actual workflow behavior, review steps, and escalation rights.</li>
              <li>Update support guidance so customer-facing teams can explain the role of AI consistently.</li>
              <li>Version-control the notice and review it after model or workflow changes.</li>
            </ul>
          `,
        },
      ],
    }),
  },
  {
    slug: "launch-readiness-checklist",
    title: "Launch readiness checklist",
    intendedUser: "Founder or cross-functional launch owner",
    useCase: "Final launch check for regulated AI features.",
    lastReviewed: "2026-04-23",
    disclaimer: "Planning aid only. Final launch approval should include legal, security, and product review.",
    fileName: "spanforge-compass-launch-readiness-checklist.html",
    formatLabel: "Editable HTML",
    body: renderTemplateDocument({
      title: "Launch Readiness Checklist",
      subtitle: "Cross-functional go-live checklist for AI features before release, customer rollout, or market expansion.",
      lastReviewed: "2026-04-23",
      disclaimer: "Use this as a launch decision aid only. Final release approval should include product, engineering, security, and legal/compliance review where required.",
      sections: [
        {
          heading: "1. Release overview",
          content: `
            <table>
              <tr><th>Feature / release name</th><td class="placeholder">[Release name]</td></tr>
              <tr><th>Owner</th><td class="placeholder">[Name / team]</td></tr>
              <tr><th>Customer impact</th><td class="placeholder">[Internal / limited beta / GA]</td></tr>
              <tr><th>Markets in scope</th><td class="placeholder">[US / EU / UK / etc.]</td></tr>
              <tr><th>Planned launch date</th><td class="placeholder">[Date]</td></tr>
            </table>
          `,
        },
        {
          heading: "2. Compliance and documentation checks",
          content: `
            <ul>
              <li>Assessment rerun completed for the release candidate or current production configuration.</li>
              <li>Top applicable laws reviewed by a named owner.</li>
              <li>Required notices, policies, contract terms, and support flows are live.</li>
              <li>Evidence package stored with latest action plan, checklist state, and sources.</li>
              <li>Model or vendor change log updated for this release.</li>
            </ul>
          `,
        },
        {
          heading: "3. Technical and operational checks",
          content: `
            <table>
              <tr><th>Control</th><th>Owner</th><th>Status</th></tr>
              <tr><td>Monitoring and alerting configured</td><td class="placeholder">[Owner]</td><td class="placeholder">[Ready / pending]</td></tr>
              <tr><td>Fallback / rollback tested</td><td class="placeholder">[Owner]</td><td class="placeholder">[Ready / pending]</td></tr>
              <tr><td>Support escalation path documented</td><td class="placeholder">[Owner]</td><td class="placeholder">[Ready / pending]</td></tr>
              <tr><td>Security and privacy review complete</td><td class="placeholder">[Owner]</td><td class="placeholder">[Ready / pending]</td></tr>
              <tr><td>Customer communications approved</td><td class="placeholder">[Owner]</td><td class="placeholder">[Ready / pending]</td></tr>
            </table>
          `,
        },
        {
          heading: "4. Final approval record",
          content: `
            <table>
              <tr><th>Approver role</th><th>Name</th><th>Decision</th><th>Date</th></tr>
              <tr><td>Product</td><td class="placeholder">[Name]</td><td class="placeholder">[Approve / conditional / hold]</td><td class="placeholder">[Date]</td></tr>
              <tr><td>Engineering</td><td class="placeholder">[Name]</td><td class="placeholder">[Approve / conditional / hold]</td><td class="placeholder">[Date]</td></tr>
              <tr><td>Security / privacy</td><td class="placeholder">[Name]</td><td class="placeholder">[Approve / conditional / hold]</td><td class="placeholder">[Date]</td></tr>
              <tr><td>Legal / compliance if required</td><td class="placeholder">[Name]</td><td class="placeholder">[Approve / conditional / hold]</td><td class="placeholder">[Date]</td></tr>
            </table>
          `,
        },
      ],
    }),
  },
];

export function getTemplateBySlug(slug: string): TemplateEntry | undefined {
  return TEMPLATE_LIBRARY.find((template) => template.slug === slug);
}
