import { describe, expect, it } from "vitest";
import { getOrganizationAlertRecipients } from "@/lib/organization-alert-routing";

describe("organization alert routing", () => {
  it("routes only to members at or above the configured role threshold", () => {
    const recipients = getOrganizationAlertRecipients([
      {
        id: "org-1",
        name: "Spanforge",
        slug: "spanforge",
        integrationSettings: {
          complianceEmailEnabled: true,
          complianceSlackWebhookUrl: "https://hooks.slack.test/1",
          notificationRole: "owner",
        },
        members: [
          { role: "owner", user: { id: "owner-1", email: "owner@test.com", name: "Owner" } },
          { role: "member", user: { id: "member-1", email: "member@test.com", name: "Member" } },
        ],
      },
    ], "source-user");

    expect(recipients.emailRecipients).toHaveLength(1);
    expect(recipients.emailRecipients[0]?.email).toBe("owner@test.com");
    expect(recipients.slackWebhooks).toHaveLength(1);
  });
});
