import { describe, expect, it } from "vitest";
import { getSystemChangeRecommendation, normalizeSystemChangeEvent } from "@/lib/system-change-events";

describe("system change event normalization", () => {
  it("normalizes generic direct webhook payloads", () => {
    const event = normalizeSystemChangeEvent({
      headers: new Headers(),
      body: {
        source: "github-actions",
        eventType: "deployment",
        environment: "production",
        title: "Production deploy",
        summary: "Released hiring model changes",
        occurredAt: "2026-04-24T10:00:00.000Z",
      },
    });

    expect(event?.source).toBe("github-actions");
    expect(event?.recommendation).toContain("Rerun the latest assessment");
  });

  it("normalizes GitHub deployment_status payloads", () => {
    const event = normalizeSystemChangeEvent({
      headers: new Headers({ "x-github-event": "deployment_status" }),
      body: {
        deployment_status: {
          state: "success",
          environment: "production",
          updated_at: "2026-04-24T10:00:00.000Z",
          creator: { login: "octocat" },
        },
        deployment: {
          ref: "refs/heads/main",
          sha: "abcdef1234567890",
        },
        repository: {
          full_name: "spanforge/compass",
        },
      },
    });

    expect(event?.source).toBe("github");
    expect(event?.eventType).toBe("deployment");
    expect(event?.environment).toBe("production");
    expect(event?.summary).toContain("production");
  });
});

describe("system change recommendations", () => {
  it("treats production deployments as reassessment triggers", () => {
    expect(getSystemChangeRecommendation("deployment", "production")).toContain("Rerun the latest assessment");
  });
});
