import { describe, expect, it } from "vitest";
import { laws } from "@/lib/lexforge-data";
import { buildAssessmentAssumptions, buildComplianceAnalysis, normalizeAssessmentInput } from "@/lib/compliance-analysis";
import { runRulesEngine, type AssessmentInput } from "@/lib/rules-engine";

describe("compliance analysis", () => {
  it("infers structured signals from a freeform system description", () => {
    const input: AssessmentInput = {
      system_description:
        "We built an AI hiring tool that screens resumes, ranks candidates, and helps recruiters decide who to interview in the EU.",
      hq_region: "US",
      company_size: "startup",
      industry: "HR Tech",
      target_markets: ["EU", "US"],
      product_type: "saas",
      use_cases: [],
      deployment_context: "enterprise",
      uses_ai: true,
      uses_biometric_data: false,
      processes_personal_data: false,
      processes_eu_personal_data: false,
      automated_decisions: false,
      data_types: [],
      risk_self_assessment: "limited",
    };

    const normalized = normalizeAssessmentInput(input);

    expect(normalized.use_cases).toContain("hr");
    expect(normalized.data_types).toContain("employment_data");
    expect(normalized.automated_decisions).toBe(true);
    expect(normalized.processes_personal_data).toBe(true);
  });

  it("classifies a hiring workflow as high risk and exposes blockers without a checklist", () => {
    const input: AssessmentInput = normalizeAssessmentInput({
      system_description:
        "We built an AI hiring tool that screens resumes, ranks candidates, and makes interview recommendations for employers in the EU.",
      hq_region: "US",
      company_size: "startup",
      industry: "HR Tech",
      target_markets: ["EU", "US"],
      product_type: "saas",
      use_cases: ["hr"],
      deployment_context: "enterprise",
      uses_ai: true,
      uses_biometric_data: false,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: true,
      data_types: ["employment_data", "personal_data"],
      risk_self_assessment: "limited",
    });

    const results = runRulesEngine(laws, input);
    const analysis = buildComplianceAnalysis(input, results, []);

    expect(analysis.riskLevel).toBe("high");
    expect(analysis.mappedLaws.length).toBeGreaterThan(0);
    expect(analysis.blockers.some((blocker) => blocker.title === "No execution checklist generated")).toBe(true);
    expect(analysis.assumptions.length).toBeGreaterThan(0);
  });

  it("summarizes assumptions added during normalization", () => {
    const rawInput: AssessmentInput = {
      system_description: "AI hiring workflow that screens resumes and ranks candidates in the EU.",
      hq_region: "US",
      company_size: "startup",
      industry: "HR Tech",
      target_markets: ["EU"],
      product_type: "saas",
      use_cases: [],
      deployment_context: "enterprise",
      uses_ai: true,
      uses_biometric_data: false,
      processes_personal_data: false,
      processes_eu_personal_data: false,
      automated_decisions: false,
      data_types: [],
      risk_self_assessment: "limited",
    };

    const normalized = normalizeAssessmentInput(rawInput);
    const assumptions = buildAssessmentAssumptions(rawInput, normalized);

    expect(assumptions.some((entry) => entry.includes("Use cases inferred"))).toBe(true);
    expect(assumptions.some((entry) => entry.includes("Data categories inferred"))).toBe(true);
    expect(assumptions.some((entry) => entry.includes("Automated decision-making assumed"))).toBe(true);
  });
});
