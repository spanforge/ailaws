import { describe, it, expect } from "vitest";
import { runRulesEngine, RULES_ENGINE_VERSION, type AssessmentInput } from "@/lib/rules-engine";
import { laws } from "@/lib/lexforge-data";

const EU_AI_PRODUCT: AssessmentInput = {
  hq_region: "EU",
  company_size: "startup",
  target_markets: ["EU", "US"],
  product_type: "generative_ai",
  use_cases: ["hr", "content_generation"],
  deployment_context: "public",
  uses_ai: true,
  uses_biometric_data: false,
  processes_personal_data: true,
  processes_eu_personal_data: true,
  automated_decisions: true,
  risk_self_assessment: "high",
};

const US_ONLY_PRODUCT: AssessmentInput = {
  hq_region: "US",
  company_size: "startup",
  target_markets: ["US"],
  product_type: "saas",
  use_cases: ["general_purpose"],
  deployment_context: "enterprise",
  uses_ai: false,
  uses_biometric_data: false,
  processes_personal_data: false,
  processes_eu_personal_data: false,
  automated_decisions: false,
  risk_self_assessment: "minimal",
};

describe("runRulesEngine", () => {
  it("returns results for all laws", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    expect(results).toHaveLength(laws.length);
  });

  it("returns results sorted by relevance_score descending", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].relevance_score).toBeGreaterThanOrEqual(results[i + 1].relevance_score);
    }
  });

  it("marks EU AI Act as likely_applies for EU-targeting AI product", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    const euAiAct = results.find((r) => r.law_slug === "eu-ai-act");
    expect(euAiAct).toBeDefined();
    expect(euAiAct?.applicability_status).toBe("likely_applies");
    expect(euAiAct?.relevance_score).toBeGreaterThanOrEqual(0.75);
  });

  it("marks EU AI Act as unlikely for non-AI US-only product", () => {
    const results = runRulesEngine(laws, US_ONLY_PRODUCT);
    const euAiAct = results.find((r) => r.law_slug === "eu-ai-act");
    expect(euAiAct).toBeDefined();
    expect(euAiAct?.applicability_status).toBe("unlikely");
  });

  it("includes triggered_rules in results", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    const euAiAct = results.find((r) => r.law_slug === "eu-ai-act");
    expect(euAiAct?.triggered_rules).toBeInstanceOf(Array);
    expect(euAiAct?.triggered_rules.length).toBeGreaterThan(0);
  });

  it("includes triggered_obligations for likely_applies results", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    const euAiAct = results.find((r) => r.law_slug === "eu-ai-act");
    expect(euAiAct?.triggered_obligations.length).toBeGreaterThan(0);
    expect(euAiAct?.triggered_obligations[0]).toHaveProperty("title");
    expect(euAiAct?.triggered_obligations[0]).toHaveProperty("citation");
  });

  it("returns no triggered_obligations for unlikely results", () => {
    const results = runRulesEngine(laws, US_ONLY_PRODUCT);
    const unlikely = results.filter((r) => r.applicability_status === "unlikely");
    for (const r of unlikely) {
      expect(r.triggered_obligations).toHaveLength(0);
    }
  });

  it("includes evaluation_trace for each result (WS3)", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    for (const result of results) {
      expect(result.evaluation_trace).toBeDefined();
      expect(result.evaluation_trace.rulesEngineVersion).toBe(RULES_ENGINE_VERSION);
      expect(result.evaluation_trace.rules).toBeInstanceOf(Array);
      expect(result.evaluation_trace.scoreBreakdown).toHaveProperty("weightedPercentage");
    }
  });

  it("evaluation_trace totalWeight equals sum of all rule weights", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    const euAiAct = results.find((r) => r.law_slug === "eu-ai-act");
    expect(euAiAct).toBeDefined();
    const law = laws.find((l) => l.slug === "eu-ai-act")!;
    const expectedTotal = law.applicability_rules.reduce((s, r) => s + r.weight, 0);
    expect(euAiAct!.evaluation_trace.totalWeight).toBeCloseTo(expectedTotal);
  });

  it("evaluation_trace score matches relevance_score", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    for (const r of results) {
      expect(r.evaluation_trace.score).toBeCloseTo(r.relevance_score, 1);
    }
  });

  it("RULES_ENGINE_VERSION is a semver string", () => {
    expect(RULES_ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("obligation selection", () => {
  it("critical obligations appear for likely_applies laws", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    const applies = results.filter((r) => r.applicability_status === "likely_applies");
    for (const r of applies) {
      const criticalObls = r.triggered_obligations.filter((o) => o.priority === "critical");
      // If the law has critical obligations they must appear
      const law = laws.find((l) => l.slug === r.law_slug)!;
      const lawCritical = law.obligations.filter((o) => o.priority === "critical").length;
      expect(criticalObls.length).toBe(lawCritical);
    }
  });

  it("only critical+high obligations appear for may_apply laws", () => {
    const results = runRulesEngine(laws, EU_AI_PRODUCT);
    const mayApply = results.filter((r) => r.applicability_status === "may_apply");
    for (const r of mayApply) {
      const hasMediumOrLow = r.triggered_obligations.some(
        (o) => o.priority === "medium" || o.priority === "low",
      );
      expect(hasMediumOrLow).toBe(false);
    }
  });
});

describe("freshness and provenance metadata", () => {
  it("every law has a source_kind (WS1)", () => {
    for (const law of laws) {
      expect(law.source_kind).toBeDefined();
      expect(law.source_kind).not.toBe("");
    }
  });

  it("every law has a confidence_level (WS1)", () => {
    const valid = ["high", "medium", "low"];
    for (const law of laws) {
      expect(valid).toContain(law.confidence_level);
    }
  });

  it("every law has a review_status (WS1)", () => {
    const valid = ["draft", "needs_review", "verified", "superseded", "archived"];
    for (const law of laws) {
      expect(valid).toContain(law.review_status);
    }
  });

  it("primary laws have source_citation_full populated", () => {
    for (const law of laws) {
      if (law.source_kind === "primary_law") {
        expect(law.source_citation_full).toBeTruthy();
      }
    }
  });
});
