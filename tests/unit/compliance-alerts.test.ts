import { describe, expect, it } from "vitest";
import { buildAlertFingerprint, deriveAlertOwners } from "@/lib/compliance-alerts";

describe("compliance alerts", () => {
  it("keeps assessment drift alerts stable across refreshes", () => {
    expect(buildAlertFingerprint("user-1", "assessment-1", "execution_drift")).toBe(
      "user-1:assessment-1:execution_drift",
    );
  });

  it("routes execution drift to owners of critical incomplete work", () => {
    const owners = deriveAlertOwners("execution_drift", [
      {
        id: "item-1",
        lawSlug: "eu-ai-act",
        title: "Complete risk controls",
        category: "governance",
        priority: "critical",
        status: "in_progress",
        assignee: { id: "user-2", email: "owner@example.com", name: "Owner" },
        evidenceArtifacts: [],
      },
      {
        id: "item-2",
        lawSlug: "eu-ai-act",
        title: "Archive evidence",
        category: "evidence",
        priority: "critical",
        status: "completed",
        assignee: { id: "user-2", email: "owner@example.com", name: "Owner" },
        evidenceArtifacts: [],
      },
      {
        id: "item-3",
        lawSlug: "gdpr",
        title: "Review notice",
        category: "privacy",
        priority: "medium",
        status: "not_started",
        assignee: { id: "user-3", email: "other@example.com", name: "Other" },
        evidenceArtifacts: [],
      },
    ]);

    expect(owners).toEqual([{ id: "user-2", email: "owner@example.com", name: "Owner" }]);
  });

  it("routes evidence drift to owners of critical or evidenced work", () => {
    const owners = deriveAlertOwners("evidence_freshness_drift", [
      {
        id: "item-1",
        lawSlug: "eu-ai-act",
        title: "Maintain evidence",
        category: "evidence",
        priority: "low",
        status: "completed",
        assignee: { id: "user-2", email: "owner@example.com", name: "Owner" },
        evidenceArtifacts: [
          {
            id: "artifact-1",
            title: "Control log",
            description: null,
            artifactType: "log",
            sourceType: "upload",
            sourceUrl: null,
            status: "stale",
            collectedAt: new Date(),
            verifiedAt: null,
            expiresAt: null,
          },
        ],
      },
      {
        id: "item-2",
        lawSlug: "gdpr",
        title: "Open policy task",
        category: "privacy",
        priority: "critical",
        status: "not_started",
        assignee: { id: "user-3", email: "critical@example.com", name: "Critical Owner" },
        evidenceArtifacts: [],
      },
    ]);

    expect(owners).toEqual([
      { id: "user-2", email: "owner@example.com", name: "Owner" },
      { id: "user-3", email: "critical@example.com", name: "Critical Owner" },
    ]);
  });
});
