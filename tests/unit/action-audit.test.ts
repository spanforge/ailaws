import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    actionAuditLog: {
      create,
    },
  },
}));

describe("recordActionAudit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("persists request correlation and JSON metadata", async () => {
    create.mockResolvedValue({ id: "audit-1" });
    const { recordActionAudit } = await import("@/lib/action-audit");

    await recordActionAudit({
      actorId: "user-1",
      actorEmail: "user@example.com",
      actionType: "organization.create",
      scope: "organization",
      organizationId: "org-1",
      targetType: "organization",
      targetId: "org-1",
      request: new Request("http://localhost", { headers: { "x-request-id": "req-55" } }),
      metadata: { slug: "acme", role: "owner" },
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "user-1",
        actorEmail: "user@example.com",
        actionType: "organization.create",
        scope: "organization",
        organizationId: "org-1",
        targetType: "organization",
        targetId: "org-1",
        requestId: "req-55",
        metadataJson: JSON.stringify({ slug: "acme", role: "owner" }),
      }),
    });
  });
});