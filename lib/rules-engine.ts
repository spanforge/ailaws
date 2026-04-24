// ============================================================
//  LexForge — Rules Engine
//  Deterministic rule evaluation against user assessment input
// ============================================================

import type { Law, RuleCondition, RuleGroup } from "./lexforge-data";

// WS3: Version this engine so historical assessments remain reproducible.
export const RULES_ENGINE_VERSION = "1.0.0";

export type AssessmentInput = {
  // Company
  company_name?: string;
  product_preset?: string;
  system_description?: string;
  hq_region: string; // EU | US | UK | CA | CN | BR | SG | AU | Other
  company_size: "startup" | "sme" | "large" | "enterprise";
  industry?: string;
  target_markets: string[]; // ["EU", "US", ...]

  // Product
  product_type: string; // saas | ai_model | embedded | platform | generative_ai | other
  use_cases: string[]; // ["hr", "credit_scoring", "medical", ...]
  deployment_context: string; // public | enterprise | consumer | government

  // Technical
  uses_ai: boolean;
  uses_biometric_data: boolean;
  processes_personal_data: boolean;
  processes_eu_personal_data: boolean;
  automated_decisions: boolean;
  data_types?: string[];
  risk_self_assessment?: string; // minimal | limited | high | unacceptable
};

export type TriggeredObligation = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  citation: string;
  action_required: string;
  spanforge_controls?: string[];
};

// WS3: Evaluation trace — what each rule did and why the score was produced.
export type RuleEvaluationEntry = {
  ruleId: string;
  ruleName: string;
  weight: number;
  matched: boolean;
};

export type EvaluationTrace = {
  rulesEngineVersion: string;
  totalWeight: number;
  matchedWeight: number;
  score: number;
  rules: RuleEvaluationEntry[];
  scoreBreakdown: {
    matchedRuleCount: number;
    totalRuleCount: number;
    weightedPercentage: number;
  };
};

export type AssessmentResult = {
  law_id: string;
  law_slug: string;
  law_title: string;
  law_short_title: string;
  jurisdiction: string;
  jurisdiction_code: string;
  relevance_score: number;
  applicability_status: "likely_applies" | "may_apply" | "unlikely";
  rationale: string;
  triggered_rules: string[];
  triggered_obligations: TriggeredObligation[];
  // WS3: Explainability
  evaluation_trace: EvaluationTrace;
};

// ── Condition evaluator ─────────────────────────────────────────────────────

function evaluateCondition(
  condition: RuleCondition,
  input: AssessmentInput,
): boolean {
  const raw = (input as Record<string, unknown>)[condition.fact];
  const val = condition.value;

  switch (condition.operator) {
    case "equals":
      return raw === val;
    case "not_equals":
      return raw !== val;
    case "contains":
      if (Array.isArray(raw)) return (raw as string[]).includes(val as string);
      if (typeof raw === "string") return raw.includes(val as string);
      return false;
    case "in":
      if (Array.isArray(val)) {
        if (Array.isArray(raw))
          return (raw as string[]).some((r) => (val as string[]).includes(r));
        return (val as string[]).includes(raw as string);
      }
      return false;
    case "gt":
      return Number(raw) > Number(val);
    case "lt":
      return Number(raw) < Number(val);
    case "gte":
      return Number(raw) >= Number(val);
    case "lte":
      return Number(raw) <= Number(val);
    default:
      return false;
  }
}

function evaluateGroup(group: RuleGroup, input: AssessmentInput): boolean {
  if (group.all) {
    return group.all.every((item) => {
      if ("fact" in item) return evaluateCondition(item as RuleCondition, input);
      return evaluateGroup(item as RuleGroup, input);
    });
  }
  if (group.any) {
    return group.any.some((item) => {
      if ("fact" in item) return evaluateCondition(item as RuleCondition, input);
      return evaluateGroup(item as RuleGroup, input);
    });
  }
  return false;
}

// ── Score → status mapping ──────────────────────────────────────────────────

function scoreToStatus(score: number): AssessmentResult["applicability_status"] {
  if (score >= 0.75) return "likely_applies";
  if (score >= 0.4) return "may_apply";
  return "unlikely";
}

function buildRationale(
  law: Law,
  score: number,
  triggeredRules: string[],
  input: AssessmentInput,
): string {
  const status = scoreToStatus(score);
  const parts: string[] = [];

  if (status === "likely_applies") {
    parts.push(`${law.short_title} very likely applies to your product.`);
  } else if (status === "may_apply") {
    parts.push(`${law.short_title} may apply depending on implementation details.`);
  } else {
    parts.push(`${law.short_title} is unlikely to apply based on your profile.`);
  }

  if (triggeredRules.length > 0) {
    parts.push(`Triggered conditions: ${triggeredRules.join("; ")}.`);
  }

  if (input.target_markets.includes(law.jurisdiction_code)) {
    parts.push(`Your product targets ${law.jurisdiction} — the primary coverage area.`);
  }

  return parts.join(" ");
}

// ── Obligation selector ─────────────────────────────────────────────────────

function selectObligations(
  law: Law,
  status: AssessmentResult["applicability_status"],
): TriggeredObligation[] {
  if (status === "unlikely") return [];
  const priorityFilter = status === "likely_applies"
    ? ["critical", "high", "medium"]
    : ["critical", "high"];
  return law.obligations
    .filter((o) => priorityFilter.includes(o.priority))
    .map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      category: o.category,
      priority: o.priority,
      citation: o.citation,
      action_required: o.action_required,
      spanforge_controls: o.spanforge_controls,
    }));
}

// ── Main engine ─────────────────────────────────────────────

export function runRulesEngine(
  laws: Law[],
  input: AssessmentInput,
): AssessmentResult[] {
  return laws
    .map((law) => {
      let totalWeight = 0;
      let matchedWeight = 0;
      const triggeredRules: string[] = [];
      const ruleEvaluations: RuleEvaluationEntry[] = [];

      for (const rule of law.applicability_rules) {
        totalWeight += rule.weight;
        const matched = evaluateGroup(rule.rule_json, input);
        if (matched) {
          matchedWeight += rule.weight;
          triggeredRules.push(rule.name);
        }
        ruleEvaluations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          weight: rule.weight,
          matched,
        });
      }

      const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
      const status = scoreToStatus(score);

      // WS3: Build evaluation trace for explainability and reproducibility
      const evaluationTrace: EvaluationTrace = {
        rulesEngineVersion: RULES_ENGINE_VERSION,
        totalWeight,
        matchedWeight,
        score: Math.round(score * 1000) / 1000,
        rules: ruleEvaluations,
        scoreBreakdown: {
          matchedRuleCount: ruleEvaluations.filter((r) => r.matched).length,
          totalRuleCount: ruleEvaluations.length,
          weightedPercentage: Math.round(score * 100),
        },
      };

      return {
        law_id: law.id,
        law_slug: law.slug,
        law_title: law.title,
        law_short_title: law.short_title,
        jurisdiction: law.jurisdiction,
        jurisdiction_code: law.jurisdiction_code,
        relevance_score: Math.round(score * 100) / 100,
        applicability_status: status,
        rationale: buildRationale(law, score, triggeredRules, input),
        triggered_rules: triggeredRules,
        triggered_obligations: selectObligations(law, status),
        evaluation_trace: evaluationTrace,
      } satisfies AssessmentResult;
    })
    .sort((a, b) => b.relevance_score - a.relevance_score);
}
