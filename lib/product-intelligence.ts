import type { AssessmentInput, AssessmentResult } from "@/lib/rules-engine";
import type { ClauseGapEntry, DriftTrigger, WorkspaceChecklistItem } from "@/lib/workspace-intelligence";

type MatchDefinition = {
  value: string;
  keywords: string[];
};

type ActionPlanLike = {
  id: string;
  title: string;
  owner: string;
  urgency: string;
  timeline: string;
  lawShortTitle: string;
  whyItMatters: string;
};

type AlertLike = {
  id: string;
  lawSlug?: string;
  lawShortTitle?: string;
  title?: string;
  summary?: string;
  message?: string;
  changedAt?: string;
  severity?: string;
};

export type IntakeAssistant = {
  summary: string;
  confidence: "high" | "medium" | "low";
  inferredUseCases: string[];
  inferredDataTypes: string[];
  inferredMarkets: string[];
  missingFacts: string[];
  suggestedActions: string[];
  suggestedPatch: Partial<AssessmentInput>;
};

export type ChangeImpactBrief = {
  id: string;
  severity: "high" | "medium" | "low";
  headline: string;
  whyItMatters: string;
  affectedLaws: string[];
  nextActions: string[];
};

export type WeeklyPriority = {
  id: string;
  title: string;
  owner: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  href?: string;
};

export type EvidenceRecommendation = {
  id: string;
  lawSlug: string;
  lawShortTitle: string;
  obligationTitle: string;
  priority: string;
  artifactType: string;
  sourceHint: string;
  owner: string;
  whyNow: string;
  draftTitle: string;
  draftDescription: string;
};

export type RegulatoryUpdateBrief = {
  id: string;
  urgency: "high" | "medium" | "low";
  headline: string;
  lawShortTitle: string;
  whyItMatters: string;
  nextStep: string;
};

const USE_CASE_MATCHES: MatchDefinition[] = [
  { value: "hr", keywords: ["hire", "hiring", "recruit", "resume", "candidate", "interview", "talent"] },
  { value: "credit_scoring", keywords: ["credit", "loan", "lending", "underwriting", "affordability", "risk score"] },
  { value: "medical", keywords: ["health", "medical", "patient", "diagnosis", "clinical", "hospital"] },
  { value: "insurance", keywords: ["insurance", "claims", "policy holder", "underwrite"] },
  { value: "biometric", keywords: ["face", "facial", "fingerprint", "gait", "voiceprint", "biometric"] },
  { value: "content_generation", keywords: ["generate", "copilot", "assistant", "chatbot", "summarize", "draft"] },
  { value: "education", keywords: ["student", "education", "teacher", "grading", "proctor"] },
  { value: "housing", keywords: ["tenant", "housing", "rent", "landlord", "mortgage"] },
  { value: "customer_service", keywords: ["support", "customer service", "helpdesk", "chat", "agent"] },
  { value: "recommendation", keywords: ["recommend", "ranking", "feed", "personalize", "match"] },
  { value: "fraud_detection", keywords: ["fraud", "aml", "suspicious", "transaction monitoring"] },
  { value: "general_purpose", keywords: ["general purpose", "foundation model", "g pai", "gpai", "llm", "model api"] },
];

const DATA_TYPE_MATCHES: MatchDefinition[] = [
  { value: "personal_data", keywords: ["email", "name", "user data", "customer data", "personal data", "pii"] },
  { value: "employment_data", keywords: ["employee", "resume", "candidate", "recruit", "work history"] },
  { value: "financial_data", keywords: ["bank", "payment", "transaction", "credit", "income", "financial"] },
  { value: "health_data", keywords: ["health", "medical", "patient", "diagnosis", "clinical"] },
  { value: "biometric_data", keywords: ["face", "fingerprint", "iris", "voiceprint", "biometric"] },
  { value: "children_data", keywords: ["child", "children", "student", "minor", "kid"] },
  { value: "sensitive_data", keywords: ["racial", "ethnic", "religion", "sexual", "disability", "sensitive"] },
];

const MARKET_MATCHES: MatchDefinition[] = [
  { value: "EU", keywords: ["eu", "europe", "european union", "eea"] },
  { value: "US", keywords: ["us", "united states", "u.s.", "america"] },
  { value: "UK", keywords: ["uk", "united kingdom", "britain"] },
  { value: "CA", keywords: ["canada", "canadian"] },
  { value: "SG", keywords: ["singapore"] },
  { value: "AU", keywords: ["australia", "australian"] },
  { value: "JP", keywords: ["japan", "japanese"] },
  { value: "IN", keywords: ["india", "indian"] },
  { value: "AE", keywords: ["uae", "united arab emirates", "dubai", "abu dhabi"] },
];

const EVIDENCE_TYPE_MAP: Record<string, string> = {
  "Risk Management": "Risk assessment documentation",
  Documentation: "Technical documentation / audit record",
  Compliance: "Conformity assessment / certification",
  Transparency: "Disclosure notice / policy document",
  "Human Oversight": "Process documentation / escalation SOP",
  "Data Governance": "Privacy policy / data-processing record",
  Security: "Security assessment / control evidence",
  Monitoring: "Monitoring log / review record",
  General: "Internal review record",
};

const SOURCE_HINT_MAP: Record<string, string> = {
  "Risk Management": "Risk register, risk memo, or launch review note",
  Documentation: "Architecture doc, model card, or system design note",
  Compliance: "Certification, internal review, or legal signoff record",
  Transparency: "Customer disclosure, privacy notice, or product notice",
  "Human Oversight": "Escalation SOP, reviewer checklist, or decision policy",
  "Data Governance": "DPIA, data map, retention record, or DPA",
  Security: "Security review, pen-test output, or control attestation",
  Monitoring: "Dashboard export, alert log, or post-release review",
  General: "Internal note, approval record, or operating evidence",
};

const OWNER_MAP: Record<string, string> = {
  "Risk Management": "Legal / Compliance",
  Documentation: "Engineering",
  Compliance: "Legal / Compliance",
  Transparency: "Product",
  "Human Oversight": "Operations",
  "Data Governance": "Privacy / Legal",
  Security: "Security / Engineering",
  Monitoring: "Engineering / Operations",
  General: "Operations",
};

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function textForInference(input: AssessmentInput) {
  return [input.system_description, input.industry, input.company_name, input.product_type, input.deployment_context]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferValues(text: string, matches: MatchDefinition[]) {
  return matches
    .filter((entry) => entry.keywords.some((keyword) => text.includes(keyword)))
    .map((entry) => entry.value);
}

function estimateConfidence(matchCount: number): IntakeAssistant["confidence"] {
  if (matchCount >= 5) return "high";
  if (matchCount >= 2) return "medium";
  return "low";
}

function normalizeUrgency(value: string | undefined): "high" | "medium" | "low" {
  if (!value) return "medium";
  if (/critical|high/.test(value)) return "high";
  if (/low|later/.test(value)) return "low";
  return "medium";
}

function toSeverity(value: string | undefined): "high" | "medium" | "low" {
  return normalizeUrgency(value);
}

export function buildIntakeAssistant(input: AssessmentInput): IntakeAssistant {
  const text = textForInference(input);
  const inferredUseCases = unique([...input.use_cases, ...inferValues(text, USE_CASE_MATCHES)]);
  const inferredDataTypes = unique([...(input.data_types ?? []), ...inferValues(text, DATA_TYPE_MATCHES)]);
  const inferredMarkets = unique([...input.target_markets, ...inferValues(text, MARKET_MATCHES)]);

  const automatedDecisions = input.automated_decisions || /rank|score|approve|deny|screen|eligibility|decision/.test(text);
  const usesBiometricData = input.uses_biometric_data || inferredDataTypes.includes("biometric_data");
  const processesPersonalData = input.processes_personal_data || inferredDataTypes.some((value) => value !== "");
  const processesEuPersonalData = input.processes_eu_personal_data || inferredMarkets.includes("EU");
  const usesAi = input.uses_ai || /ai|model|ml|machine learning|llm|classifier|recommend/.test(text);

  const missingFacts = [
    input.target_markets.length === 0 ? "Confirm the launch markets so the jurisdiction mapping is complete." : null,
    input.use_cases.length === 0 && inferredUseCases.length === 0 ? "Specify the main use case so the law map reflects the actual system behavior." : null,
    !processesPersonalData && inferredDataTypes.length === 0 ? "Clarify whether the system handles personal, employee, customer, or sensitive data." : null,
    !automatedDecisions ? "Confirm whether the system directly ranks, approves, rejects, or otherwise influences consequential decisions." : null,
  ];

  const suggestedActions = unique([
    inferredUseCases.includes("hr") ? "Confirm whether hiring outcomes or recruiter prioritization are automated or merely assisted." : null,
    inferredUseCases.includes("credit_scoring") ? "Capture the adverse-action or explanation workflow for lending decisions." : null,
    inferredUseCases.includes("content_generation") ? "Document provider, prompt, and model-change review controls before launch." : null,
    usesBiometricData ? "Record biometric handling purpose, retention, and user notice requirements." : null,
    inferredMarkets.includes("EU") ? "Verify whether EU residents are in scope and whether high-risk AI obligations apply." : null,
  ]);

  const summaryParts = [
    inferredUseCases.length > 0 ? `Likely use cases: ${inferredUseCases.map((value) => value.replace(/_/g, " ")).join(", ")}.` : null,
    inferredDataTypes.length > 0 ? `Detected data signals: ${inferredDataTypes.map((value) => value.replace(/_/g, " ")).join(", ")}.` : null,
    inferredMarkets.length > 0 ? `Jurisdictions likely in scope: ${inferredMarkets.join(", ")}.` : null,
  ].filter(Boolean);

  const matchCount = inferredUseCases.length + inferredDataTypes.length + inferredMarkets.length;

  return {
    summary: summaryParts.join(" ") || "Add a fuller system description to let the intake assistant infer likely use cases, data types, and markets.",
    confidence: estimateConfidence(matchCount),
    inferredUseCases,
    inferredDataTypes,
    inferredMarkets,
    missingFacts: missingFacts.filter((value): value is string => Boolean(value)),
    suggestedActions,
    suggestedPatch: {
      use_cases: inferredUseCases,
      data_types: inferredDataTypes,
      target_markets: inferredMarkets,
      uses_ai: usesAi,
      uses_biometric_data: usesBiometricData,
      processes_personal_data: processesPersonalData,
      processes_eu_personal_data: processesEuPersonalData,
      automated_decisions: automatedDecisions,
    },
  };
}

export function buildChangeImpactBriefs(params: {
  alerts?: AlertLike[];
  driftTriggers?: DriftTrigger[];
  applicableResults?: AssessmentResult[];
}) {
  const applicableLawTitles = unique((params.applicableResults ?? []).map((result) => result.law_short_title));
  const alertBriefs: ChangeImpactBrief[] = (params.alerts ?? [])
    .slice(0, 3)
    .map((alert) => {
      const narrative = alert.summary ?? alert.message ?? alert.title ?? "Tracked regulatory or workspace change detected.";
      return {
        id: `alert-${alert.id}`,
        severity: toSeverity(alert.severity),
        headline: alert.lawShortTitle ? `${alert.lawShortTitle} changed` : alert.title ?? "Change detected",
        whyItMatters: narrative,
        affectedLaws: unique([alert.lawShortTitle, ...applicableLawTitles.slice(0, 2)]),
        nextActions: unique([
          "Review the affected obligations and rerun the assessment if product scope changed.",
          "Update customer-facing notices, evidence, and owner assignments if this change alters current controls.",
        ]),
      };
    });

  const driftBriefs: ChangeImpactBrief[] = (params.driftTriggers ?? []).slice(0, 2).map((trigger, index) => ({
    id: `drift-${index}`,
    severity: trigger.severity,
    headline: trigger.title,
    whyItMatters: trigger.reason,
    affectedLaws: applicableLawTitles.slice(0, 3),
    nextActions: unique([
      "Review the latest assessment inputs, linked evidence, and checklist owners.",
      trigger.severity === "high" ? "Treat this as a re-assessment trigger before relying on the current verdict." : null,
    ]),
  }));

  return [...alertBriefs, ...driftBriefs].slice(0, 5);
}

export function buildWeeklyPriorityQueue(params: {
  actionPlanItems?: ActionPlanLike[];
  checklistItems?: WorkspaceChecklistItem[];
  driftTriggers?: DriftTrigger[];
  evidenceRecommendations?: EvidenceRecommendation[];
}) {
  const priorities: WeeklyPriority[] = [];

  for (const action of (params.actionPlanItems ?? []).slice(0, 3)) {
    priorities.push({
      id: `action-${action.id}`,
      title: action.title,
      owner: action.owner,
      reason: `${action.lawShortTitle}: ${action.whyItMatters}`,
      urgency: normalizeUrgency(`${action.urgency} ${action.timeline}`),
    });
  }

  for (const item of (params.checklistItems ?? []).filter((entry) => entry.status !== "completed").slice(0, 3)) {
    priorities.push({
      id: `checklist-${item.id}`,
      title: item.title,
      owner: item.priority === "critical" ? "Leadership / Compliance" : OWNER_MAP[item.category ?? "General"] ?? "Operations",
      reason: item.priority ? `${item.priority} obligation still open.` : "Outstanding checklist work is blocking readiness.",
      urgency: normalizeUrgency(item.priority ?? undefined),
    });
  }

  for (const trigger of (params.driftTriggers ?? []).slice(0, 2)) {
    priorities.push({
      id: `drift-${trigger.title}`,
      title: trigger.title,
      owner: "Compliance owner",
      reason: trigger.reason,
      urgency: trigger.severity,
    });
  }

  for (const recommendation of (params.evidenceRecommendations ?? []).slice(0, 2)) {
    priorities.push({
      id: `evidence-${recommendation.id}`,
      title: `Collect ${recommendation.artifactType.toLowerCase()}`,
      owner: recommendation.owner,
      reason: recommendation.whyNow,
      urgency: normalizeUrgency(recommendation.priority),
      href: "/evidence",
    });
  }

  return priorities.slice(0, 6).sort((left, right) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return rank[right.urgency] - rank[left.urgency];
  });
}

export function buildEvidenceRecommendations(entries: ClauseGapEntry[]) {
  return entries
    .filter((entry) => entry.status !== "covered")
    .slice(0, 6)
    .map((entry) => {
      const category = entry.category || "General";
      const artifactType = EVIDENCE_TYPE_MAP[category] ?? EVIDENCE_TYPE_MAP.General;
      const sourceHint = SOURCE_HINT_MAP[category] ?? SOURCE_HINT_MAP.General;
      const owner = OWNER_MAP[category] ?? OWNER_MAP.General;
      return {
        id: `${entry.lawSlug}-${entry.obligationTitle}`,
        lawSlug: entry.lawSlug,
        lawShortTitle: entry.lawShortTitle,
        obligationTitle: entry.obligationTitle,
        priority: entry.priority,
        artifactType,
        sourceHint,
        owner,
        whyNow: `${entry.lawShortTitle}: ${entry.whyItMatters}`,
        draftTitle: `${entry.lawShortTitle} — ${entry.obligationTitle}`,
        draftDescription: `${artifactType}. Suggested source: ${sourceHint}. Citation: ${entry.citation}.`,
      } satisfies EvidenceRecommendation;
    });
}

export function buildRegulatoryUpdateBriefs(params: {
  alerts?: AlertLike[];
  input: AssessmentInput;
  results?: AssessmentResult[];
}) {
  const relevantLawShortTitles = new Set((params.results ?? []).map((result) => result.law_short_title));
  return (params.alerts ?? [])
    .filter((alert) => !alert.lawShortTitle || relevantLawShortTitles.has(alert.lawShortTitle))
    .slice(0, 4)
    .map((alert) => {
      const marketText = params.input.target_markets.length > 0 ? params.input.target_markets.join(", ") : "your active markets";
      return {
        id: `update-${alert.id}`,
        urgency: toSeverity(alert.severity),
        headline: alert.title ?? `${alert.lawShortTitle ?? "Tracked law"} update`,
        lawShortTitle: alert.lawShortTitle ?? "Tracked law",
        whyItMatters: alert.summary ?? alert.message ?? `A tracked law relevant to ${marketText} changed and may affect current obligations.`,
        nextStep: `Review this update against your ${params.input.use_cases.length > 0 ? params.input.use_cases.join(", ") : "current"} use cases and update the checklist or evidence package if controls changed.`,
      } satisfies RegulatoryUpdateBrief;
    });
}