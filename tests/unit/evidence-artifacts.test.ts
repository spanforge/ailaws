import { describe, expect, it } from "vitest";
import { getEffectiveEvidenceStatus, summarizeEvidenceCoverage } from "@/lib/evidence-artifacts";

describe("evidence artifact helpers", () => {
  it("marks expired evidence as stale even if the stored status is collected", () => {
    const status = getEffectiveEvidenceStatus({
      id: "artifact-1",
      title: "Risk memo",
      description: null,
      artifactType: "Document",
      sourceType: "document",
      sourceUrl: null,
      status: "collected",
      collectedAt: "2026-04-01T00:00:00.000Z",
      verifiedAt: null,
      expiresAt: "2026-04-10T00:00:00.000Z",
    });

    expect(status).toBe("stale");
  });

  it("summarizes effective evidence coverage using stale detection", () => {
    const summary = summarizeEvidenceCoverage([
      {
        id: "artifact-1",
        title: "Policy",
        description: null,
        artifactType: "Policy",
        sourceType: "policy",
        sourceUrl: null,
        status: "verified",
        collectedAt: "2026-04-01T00:00:00.000Z",
        verifiedAt: "2026-04-02T00:00:00.000Z",
        expiresAt: null,
      },
      {
        id: "artifact-2",
        title: "Old export",
        description: null,
        artifactType: "Export",
        sourceType: "export",
        sourceUrl: null,
        status: "linked",
        collectedAt: "2026-04-01T00:00:00.000Z",
        verifiedAt: null,
        expiresAt: "2026-04-10T00:00:00.000Z",
      },
    ]);

    expect(summary.total).toBe(2);
    expect(summary.verified).toBe(1);
    expect(summary.stale).toBe(1);
    expect(summary.hasCoverage).toBe(true);
  });
});
