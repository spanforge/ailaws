import { describe, expect, it } from "vitest";
import { buildAssessmentDeltaSummary, buildAssessmentDiff } from "@/lib/smb";
import type { AssessmentResult } from "@/lib/rules-engine";

function makeResult(
  lawSlug: string,
  lawShortTitle: string,
  applicabilityStatus: AssessmentResult["applicability_status"],
  relevanceScore: number,
): AssessmentResult {
  return {
    law_id: lawSlug,
    law_slug: lawSlug,
    law_title: lawShortTitle,
    law_short_title: lawShortTitle,
    jurisdiction: "EU",
    jurisdiction_code: "EU",
    relevance_score: relevanceScore,
    applicability_status: applicabilityStatus,
    rationale: `${lawShortTitle} rationale`,
    triggered_rules: [],
    triggered_obligations: [],
    evaluation_trace: {
      rulesEngineVersion: "test",
      rules: [],
      score: relevanceScore,
      totalWeight: 1,
      matchedWeight: relevanceScore,
      scoreBreakdown: {
        matchedRuleCount: 1,
        totalRuleCount: 1,
        weightedPercentage: relevanceScore,
      },
    },
  };
}

describe("assessment history helpers", () => {
  it("summarizes newly added and downgraded likely matches", () => {
    const current = [
      makeResult("eu-ai-act", "EU AI Act", "likely_applies", 0.95),
      makeResult("gdpr", "GDPR", "may_apply", 0.6),
    ];
    const previous = [
      makeResult("eu-ai-act", "EU AI Act", "may_apply", 0.72),
      makeResult("gdpr", "GDPR", "likely_applies", 0.81),
    ];

    const summary = buildAssessmentDeltaSummary(current, previous);

    expect(summary).not.toBeNull();
    expect(summary?.newLikelyApplies).toEqual(["EU AI Act"]);
    expect(summary?.newlyDowngraded).toEqual(["GDPR"]);
  });

  it("builds detailed diff entries for changed laws", () => {
    const current = [
      makeResult("eu-ai-act", "EU AI Act", "likely_applies", 0.91),
      makeResult("colorado-ai-act", "Colorado AI Act", "may_apply", 0.58),
    ];
    const previous = [
      makeResult("eu-ai-act", "EU AI Act", "may_apply", 0.62),
      makeResult("nyc-144", "NYC 144", "likely_applies", 0.8),
    ];

    const diff = buildAssessmentDiff(current, previous);

    expect(diff).toHaveLength(3);
    expect(diff[0]).toEqual(expect.objectContaining({ lawSlug: "nyc-144", changeType: "reduced", previousStatus: "likely_applies", currentStatus: "not_applicable" }));
    expect(diff).toEqual(expect.arrayContaining([
      expect.objectContaining({ lawSlug: "eu-ai-act", changeType: "increased", previousStatus: "may_apply", currentStatus: "likely_applies" }),
      expect.objectContaining({ lawSlug: "colorado-ai-act", changeType: "new", previousStatus: "not_applicable", currentStatus: "may_apply" }),
    ]));
  });
});