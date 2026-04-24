import { describe, it, expect } from "vitest";
import { laws, getLawBySlug, searchLaws } from "@/lib/lexforge-data";

describe("laws data integrity", () => {
  it("has at least 30 laws", () => {
    expect(laws.length).toBeGreaterThanOrEqual(30);
  });

  it("every law has required fields", () => {
    for (const law of laws) {
      expect(law.id).toBeTruthy();
      expect(law.slug).toBeTruthy();
      expect(law.title).toBeTruthy();
      expect(law.short_title).toBeTruthy();
      expect(law.jurisdiction).toBeTruthy();
      expect(law.jurisdiction_code).toBeTruthy();
      expect(law.issuing_body).toBeTruthy();
      expect(law.summary_short).toBeTruthy();
      expect(law.official_url).toBeTruthy();
    }
  });

  it("every law has at least one obligation", () => {
    for (const law of laws) {
      expect(law.obligations.length).toBeGreaterThan(0);
    }
  });

  it("every law has at least one applicability rule", () => {
    for (const law of laws) {
      expect(law.applicability_rules.length).toBeGreaterThan(0);
    }
  });

  it("law slugs are unique", () => {
    const slugs = laws.map((l) => l.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("law IDs are unique", () => {
    const ids = laws.map((l) => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("obligation IDs are globally unique", () => {
    const ids = laws.flatMap((l) => l.obligations.map((o) => o.id));
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("obligation priorities are valid", () => {
    const valid = ["critical", "high", "medium", "low"];
    for (const law of laws) {
      for (const obl of law.obligations) {
        expect(valid).toContain(obl.priority);
      }
    }
  });

  it("applicability rule weights are positive", () => {
    for (const law of laws) {
      for (const rule of law.applicability_rules) {
        expect(rule.weight).toBeGreaterThan(0);
      }
    }
  });

  it("law statuses are valid", () => {
    const valid = ["enacted", "in_force", "proposed", "draft", "repealed"];
    for (const law of laws) {
      expect(valid).toContain(law.status);
    }
  });
});

describe("getLawBySlug", () => {
  it("finds a law by slug", () => {
    const law = getLawBySlug("eu-ai-act");
    expect(law).toBeDefined();
    expect(law?.title).toContain("EU");
  });

  it("returns undefined for unknown slug", () => {
    expect(getLawBySlug("nonexistent-law")).toBeUndefined();
  });
});

describe("searchLaws", () => {
  it("returns all laws when no filters applied", () => {
    const results = searchLaws({});
    expect(results.length).toBe(laws.length);
  });

  it("filters by search text (title)", () => {
    const results = searchLaws({ search: "GDPR" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((l) => l.slug.includes("gdpr") || l.title.toLowerCase().includes("gdpr"))).toBe(true);
  });

  it("filters by jurisdiction code", () => {
    const results = searchLaws({ jurisdiction: "EU" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.jurisdiction_code).toBe("EU");
    }
  });

  it("filters by status", () => {
    const results = searchLaws({ status: "in_force" });
    for (const r of results) {
      expect(r.status).toBe("in_force");
    }
  });

  it("returns empty array for unknown status", () => {
    const results = searchLaws({ status: "unknownStatus" });
    expect(results).toHaveLength(0);
  });
});
