/**
 * Smoke tests — fast checks that critical system boundaries respond as expected.
 * These can run without a real database using mocked Prisma.
 */
import { describe, it, expect } from "vitest";
import { laws } from "@/lib/lexforge-data";
import { runRulesEngine, RULES_ENGINE_VERSION } from "@/lib/rules-engine";
import type { AssessmentInput } from "@/lib/rules-engine";

const SAMPLE_INPUT: AssessmentInput = {
  hq_region: "EU",
  company_size: "startup",
  target_markets: ["EU", "US"],
  product_type: "generative_ai",
  use_cases: ["hr"],
  deployment_context: "public",
  uses_ai: true,
  uses_biometric_data: false,
  processes_personal_data: true,
  processes_eu_personal_data: true,
  automated_decisions: true,
};

describe("smoke: rules engine produces valid results", () => {
  const results = runRulesEngine(laws, SAMPLE_INPUT);

  it("produces a result for every law", () => {
    expect(results.length).toBe(laws.length);
  });

  it("every result has an applicability_status", () => {
    const valid = ["likely_applies", "may_apply", "unlikely"];
    for (const r of results) {
      expect(valid).toContain(r.applicability_status);
    }
  });

  it("every result has evaluation_trace with correct version", () => {
    for (const r of results) {
      expect(r.evaluation_trace.rulesEngineVersion).toBe(RULES_ENGINE_VERSION);
    }
  });

  it("relevance_score is between 0 and 1", () => {
    for (const r of results) {
      expect(r.relevance_score).toBeGreaterThanOrEqual(0);
      expect(r.relevance_score).toBeLessThanOrEqual(1);
    }
  });
});

describe("smoke: lexforge-data laws array", () => {
  it("loads without throwing", () => {
    expect(() => laws).not.toThrow();
    expect(Array.isArray(laws)).toBe(true);
  });

  it("has EU AI Act with high confidence provenance", () => {
    const euAiAct = laws.find((l) => l.slug === "eu-ai-act");
    expect(euAiAct).toBeDefined();
    expect(euAiAct?.source_kind).toBe("primary_law");
    expect(euAiAct?.confidence_level).toBe("high");
    expect(euAiAct?.review_status).toBe("verified");
  });
});
