import { getLawBySlug } from "./lexforge-data";
import type { AssessmentInput, AssessmentResult } from "./rules-engine";
import type { WorkspaceChecklistItem } from "./workspace-intelligence";

export type AnalysisSeverity = "critical" | "high" | "medium" | "low";

export type ComplianceBlocker = {
  title: string;
  severity: AnalysisSeverity;
  reason: string;
};

export type ComplianceAnalysis = {
  normalizedInput: AssessmentInput;
  assumptions: string[];
  detectedUseCases: string[];
  detectedDataTypes: string[];
  systemSummary: string;
  riskLevel: "minimal" | "limited" | "high" | "unacceptable";
  riskScore: number;
  complianceScore: number;
  auditReadinessScore: number;
  blockers: ComplianceBlocker[];
  mappedLaws: Array<{
    lawSlug: string;
    lawShortTitle: string;
    status: AssessmentResult["applicability_status"];
    rationale: string;
    reason: string;
    triggeredObligations: number;
  }>;
};

const USE_CASE_KEYWORDS: Array<{ useCase: string; keywords: string[] }> = [
  { useCase: "hr", keywords: ["hiring", "recruit", "recruitment", "candidate", "interview", "screening"] },
  { useCase: "medical", keywords: ["medical", "healthcare", "clinical", "patient", "triage", "diagnosis"] },
  { useCase: "credit_scoring", keywords: ["credit", "lending", "loan", "underwriting", "affordability"] },
  { useCase: "insurance", keywords: ["insurance", "claims", "policyholder"] },
  { useCase: "law_enforcement", keywords: ["law enforcement", "policing", "criminal", "public safety"] },
  { useCase: "biometric", keywords: ["biometric", "face recognition", "fingerprint", "voiceprint", "iris"] },
  { useCase: "content_generation", keywords: ["generate", "generation", "summarize", "draft", "copilot", "assistant", "chatbot"] },
  { useCase: "education", keywords: ["education", "student", "learning", "proctoring"] },
  { useCase: "housing", keywords: ["housing", "tenant", "rental", "mortgage"] },
  { useCase: "customer_service", keywords: ["support", "customer service", "helpdesk", "ticket", "chatbot"] },
  { useCase: "recommendation", keywords: ["recommend", "ranking", "personalization", "feed"] },
  { useCase: "fraud_detection", keywords: ["fraud", "transaction monitoring", "risk scoring", "aml"] },
  { useCase: "general_purpose", keywords: ["general purpose", "foundation model", "llm", "general assistant"] },
];

const DATA_TYPE_KEYWORDS: Array<{ dataType: string; keywords: string[] }> = [
  { dataType: "personal_data", keywords: ["personal data", "pii", "email", "name", "user profile"] },
  { dataType: "biometric_data", keywords: ["biometric", "face", "fingerprint", "voiceprint", "iris"] },
  { dataType: "health_data", keywords: ["health", "medical", "clinical", "patient"] },
  { dataType: "financial_data", keywords: ["financial", "bank", "credit", "transaction", "loan"] },
  { dataType: "employment_data", keywords: ["employee", "candidate", "resume", "cv", "recruit"] },
  { dataType: "sensitive_data", keywords: ["sensitive", "special category", "race", "religion", "political"] },
  { dataType: "children_data", keywords: ["child", "children", "minor", "student"] },
];

function includesKeyword(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function inferUseCases(description: string): string[] {
  const lowered = description.toLowerCase();
  return USE_CASE_KEYWORDS.filter((entry) => includesKeyword(lowered, entry.keywords)).map((entry) => entry.useCase);
}

function inferDataTypes(description: string): string[] {
  const lowered = description.toLowerCase();
  return DATA_TYPE_KEYWORDS.filter((entry) => includesKeyword(lowered, entry.keywords)).map((entry) => entry.dataType);
}

function calculateRiskLevel(input: AssessmentInput, results: AssessmentResult[]): ComplianceAnalysis["riskLevel"] {
  const highRiskUseCases = ["hr", "medical", "credit_scoring", "insurance", "law_enforcement", "housing"];
  const hasHighRiskUseCase = input.use_cases.some((useCase) => highRiskUseCases.includes(useCase));
  const likelyApplies = results.filter((result) => result.applicability_status === "likely_applies");

  if (
    input.uses_biometric_data &&
    (input.use_cases.includes("law_enforcement") || input.deployment_context === "government")
  ) {
    return "unacceptable";
  }

  if (
    hasHighRiskUseCase ||
    input.automated_decisions ||
    likelyApplies.some((result) => result.law_slug === "eu-ai-act")
  ) {
    return "high";
  }

  if (input.processes_personal_data || results.some((result) => result.applicability_status === "may_apply")) {
    return "limited";
  }

  return "minimal";
}

function calculateComplianceScore(results: AssessmentResult[], checklistItems: WorkspaceChecklistItem[] = []) {
  const applicable = results.filter((result) => result.applicability_status !== "unlikely");
  const base = applicable.length === 0 ? 90 : Math.max(35, 100 - applicable.length * 7);
  if (checklistItems.length === 0) return base;

  const completed = checklistItems.filter((item) => item.status === "completed").length;
  const inProgress = checklistItems.filter((item) => item.status === "in_progress").length;
  const weightedCompletion = ((completed * 1) + (inProgress * 0.45)) / checklistItems.length;
  return Math.max(20, Math.min(98, Math.round(base * 0.45 + weightedCompletion * 55)));
}

function calculateAuditReadiness(results: AssessmentResult[], checklistItems: WorkspaceChecklistItem[] = []) {
  const applicable = results.filter((result) => result.applicability_status !== "unlikely");
  const obligations = applicable.reduce((sum, result) => sum + result.triggered_obligations.length, 0);
  if (obligations === 0) return checklistItems.length > 0 ? 65 : 40;

  if (checklistItems.length === 0) return 30;

  const traceable = checklistItems.filter((item) => Boolean(item.lawSlug)).length / checklistItems.length;
  const completed = checklistItems.filter((item) => item.status === "completed").length / checklistItems.length;
  return Math.max(15, Math.min(95, Math.round(traceable * 45 + completed * 55)));
}

function buildBlockers(
  input: AssessmentInput,
  results: AssessmentResult[],
  checklistItems: WorkspaceChecklistItem[] = [],
): ComplianceBlocker[] {
  const blockers: ComplianceBlocker[] = [];
  const likelyApplies = results.filter((result) => result.applicability_status === "likely_applies");
  const openCritical = checklistItems.find((item) => item.priority === "critical" && item.status !== "completed");

  if (input.automated_decisions && !input.processes_personal_data) {
    blockers.push({
      title: "Decision-flow data review missing",
      severity: "high",
      reason: "Automated decisions are enabled but personal-data handling is not clearly documented. Review the actual decision inputs and affected individuals.",
    });
  }

  if (likelyApplies.some((result) => result.law_slug === "eu-ai-act") && input.risk_self_assessment !== "high") {
    blockers.push({
      title: "Risk self-classification is understated",
      severity: "high",
      reason: "Your profile matches a likely-applicable EU AI Act scenario, but the self-assessed risk level is lower than the detected posture.",
    });
  }

  if (input.uses_biometric_data && !input.data_types?.includes("biometric_data")) {
    blockers.push({
      title: "Biometric evidence trail missing",
      severity: "critical",
      reason: "Biometric processing is enabled but the data inventory does not explicitly track biometric data. Audit evidence will be weak until data categories are documented.",
    });
  }

  if (openCritical) {
    blockers.push({
      title: "Critical compliance task still open",
      severity: "critical",
      reason: `A critical obligation remains incomplete: ${openCritical.title}.`,
    });
  }

  if (checklistItems.length === 0 && likelyApplies.length > 0) {
    blockers.push({
      title: "No execution checklist generated",
      severity: "high",
      reason: "Applicable laws were identified, but no tracked tasks exist yet. The workspace is not audit-ready until obligations become owned work items.",
    });
  }

  return blockers;
}

export function buildAssessmentAssumptions(
  rawInput: AssessmentInput,
  normalizedInput: AssessmentInput,
): string[] {
  const assumptions: string[] = [];

  const inferredUseCases = normalizedInput.use_cases.filter((useCase) => !rawInput.use_cases.includes(useCase));
  if (inferredUseCases.length > 0) {
    assumptions.push(`Use cases inferred from description: ${inferredUseCases.join(", ")}.`);
  }

  const rawDataTypes = rawInput.data_types ?? [];
  const inferredDataTypes = (normalizedInput.data_types ?? []).filter((dataType) => !rawDataTypes.includes(dataType));
  if (inferredDataTypes.length > 0) {
    assumptions.push(`Data categories inferred from description: ${inferredDataTypes.join(", ")}.`);
  }

  if (!rawInput.processes_personal_data && normalizedInput.processes_personal_data) {
    assumptions.push("Personal data processing assumed because the selected or inferred data categories include regulated personal data.");
  }

  if (!rawInput.processes_eu_personal_data && normalizedInput.processes_eu_personal_data) {
    assumptions.push("EU personal data processing assumed because EU markets are selected alongside personal-data indicators.");
  }

  if (!rawInput.uses_biometric_data && normalizedInput.uses_biometric_data) {
    assumptions.push("Biometric processing assumed because the system description or data inventory references biometric signals.");
  }

  if (!rawInput.automated_decisions && normalizedInput.automated_decisions) {
    assumptions.push("Automated decision-making assumed because the system description references ranking, screening, scoring, or decision workflows.");
  }

  if (assumptions.length === 0) {
    assumptions.push("No additional assumptions were added beyond the inputs you explicitly provided.");
  }

  return assumptions;
}

export function normalizeAssessmentInput(input: AssessmentInput): AssessmentInput {
  const description = input.system_description?.trim() ?? "";
  const inferredUseCases = description ? inferUseCases(description) : [];
  const inferredDataTypes = description ? inferDataTypes(description) : [];
  const combinedDataTypes = dedupe([...(input.data_types ?? []), ...inferredDataTypes]);

  return {
    ...input,
    use_cases: dedupe([...input.use_cases, ...inferredUseCases]),
    data_types: combinedDataTypes,
    processes_personal_data:
      input.processes_personal_data ||
      combinedDataTypes.some((dataType) => ["personal_data", "health_data", "financial_data", "employment_data", "children_data", "sensitive_data"].includes(dataType)),
    processes_eu_personal_data:
      input.processes_eu_personal_data ||
      input.target_markets.includes("EU") && combinedDataTypes.includes("personal_data"),
    uses_biometric_data:
      input.uses_biometric_data || combinedDataTypes.includes("biometric_data"),
    automated_decisions:
      input.automated_decisions ||
      includesKeyword(description.toLowerCase(), ["ranking", "ranks", "score", "decision", "screening", "underwriting", "eligibility"]),
  };
}

export function buildComplianceAnalysis(
  rawInput: AssessmentInput,
  results: AssessmentResult[],
  checklistItems: WorkspaceChecklistItem[] = [],
): ComplianceAnalysis {
  const normalizedInput = normalizeAssessmentInput(rawInput);
  const riskLevel = calculateRiskLevel(normalizedInput, results);
  const riskScore = riskLevel === "unacceptable" ? 95 : riskLevel === "high" ? 80 : riskLevel === "limited" ? 55 : 25;
  const blockers = buildBlockers(normalizedInput, results, checklistItems);
  const complianceScore = calculateComplianceScore(results, checklistItems);
  const auditReadinessScore = calculateAuditReadiness(results, checklistItems);

  return {
    normalizedInput,
    assumptions: buildAssessmentAssumptions(rawInput, normalizedInput),
    detectedUseCases: normalizedInput.use_cases,
    detectedDataTypes: normalizedInput.data_types ?? [],
    systemSummary:
      normalizedInput.system_description?.trim() ||
      `${normalizedInput.product_type} system serving ${normalizedInput.target_markets.join(", ") || "selected markets"} for ${normalizedInput.use_cases.join(", ") || "general AI use"}.`,
    riskLevel,
    riskScore,
    complianceScore,
    auditReadinessScore,
    blockers,
    mappedLaws: results
      .filter((result) => result.applicability_status !== "unlikely")
      .map((result) => {
        const law = getLawBySlug(result.law_slug);
        return {
          lawSlug: result.law_slug,
          lawShortTitle: result.law_short_title,
          status: result.applicability_status,
          rationale: result.rationale,
          reason: law ? `${law.short_title} applies because ${result.triggered_rules.join(", ") || "your system profile matches its scope"}.` : result.rationale,
          triggeredObligations: result.triggered_obligations.length,
        };
      }),
  };
}
