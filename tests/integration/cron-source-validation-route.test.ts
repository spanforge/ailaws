import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const runSourceValidation = vi.fn();
const captureException = vi.fn();
const log = vi.fn();

vi.mock("@/lib/source-validation", () => ({
  runSourceValidation,
}));

vi.mock("@/lib/monitoring", () => ({
  captureException,
  log,
}));

describe("POST /api/cron/source-validation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("@/app/api/cron/source-validation/route");
    const request = new NextRequest("http://localhost/api/cron/source-validation", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(runSourceValidation).not.toHaveBeenCalled();
  });

  it("runs validation and logs the request id", async () => {
    runSourceValidation.mockResolvedValue({
      processed: 1,
      counts: { ok: 1 },
      results: [
        {
          slug: "eu-ai-act",
          url: "https://example.com",
          status: "ok",
          httpStatus: 200,
          redirectUrl: null,
          errorMessage: null,
          responseTimeMs: 120,
        },
      ],
    });

    const { POST } = await import("@/app/api/cron/source-validation/route");
    const request = new NextRequest("http://localhost/api/cron/source-validation?slug=eu-ai-act&dryRun=1", {
      method: "POST",
      headers: {
        authorization: "Bearer cron-secret",
        "x-request-id": "req-123",
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(runSourceValidation).toHaveBeenCalledWith({ dryRun: true, slug: "eu-ai-act" });
    expect(log).toHaveBeenCalledWith(
      "info",
      "cron.source_validation.completed",
      expect.objectContaining({ requestId: "req-123", dryRun: true, slug: "eu-ai-act" }),
    );
  });
});