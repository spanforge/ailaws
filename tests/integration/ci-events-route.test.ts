import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const upsert = vi.fn();
const captureException = vi.fn();
const log = vi.fn();
const normalizeSystemChangeEvent = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    systemChangeEvent: {
      upsert,
    },
  },
}));

vi.mock("@/lib/monitoring", () => ({
  captureException,
  log,
}));

vi.mock("@/lib/system-change-events", () => ({
  normalizeSystemChangeEvent,
}));

describe("POST /api/integrations/ci/events", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.INTEGRATION_WEBHOOK_SECRET = "integration-secret";
  });

  it("rejects unauthorized payloads", async () => {
    const { POST } = await import("@/app/api/integrations/ci/events/route");
    const request = new NextRequest("http://localhost/api/integrations/ci/events", {
      method: "POST",
      body: JSON.stringify({ source: "github" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("records normalized events and includes request correlation in logs", async () => {
    normalizeSystemChangeEvent.mockReturnValue({
      source: "github",
      eventType: "deployment",
      environment: "production",
      title: "Deploy completed",
      summary: "Main branch deployed",
      ref: "refs/heads/main",
      commitSha: "abc123",
      actor: "octocat",
      occurredAt: "2026-04-24T12:00:00.000Z",
      recommendation: "Re-run compliance checks",
      metadata: { workflow: "deploy" },
    });

    upsert.mockResolvedValue({
      id: "evt-1",
      source: "github",
      eventType: "deployment",
      environment: "production",
    });

    const { POST } = await import("@/app/api/integrations/ci/events/route");
    const request = new NextRequest("http://localhost/api/integrations/ci/events", {
      method: "POST",
      headers: {
        authorization: "Bearer integration-secret",
        "content-type": "application/json",
        "x-request-id": "req-ci-1",
      },
      body: JSON.stringify({ event: "deployment" }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.id).toBe("evt-1");
    expect(upsert).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      "info",
      "integrations.ci_event.recorded",
      expect.objectContaining({ requestId: "req-ci-1", id: "evt-1", source: "github" }),
    );
  });
});