import { describe, expect, it } from "vitest";
import { buildDriftTriggers } from "@/lib/workspace-intelligence";

describe("workspace intelligence drift triggers", () => {
  it("flags system-change drift for post-assessment production deployments", () => {
    const triggers = buildDriftTriggers({
      createdAt: "2026-04-01T00:00:00.000Z",
      results: [
        {
          law_slug: "eu-ai-act",
          applicability_status: "likely_applies",
          law_short_title: "EU AI Act",
          lastReviewed: "2026-04-10T00:00:00.000Z",
        },
      ] as never,
      systemChangeEvents: [
        {
          occurredAt: "2026-04-15T00:00:00.000Z",
          source: "github-actions",
          eventType: "deployment",
          summary: "Production release for hiring classifier",
          environment: "production",
        },
      ],
    });

    expect(triggers.some((trigger) => trigger.title === "System-change drift")).toBe(true);
    expect(triggers.find((trigger) => trigger.title === "System-change drift")?.severity).toBe("high");
  });
});
