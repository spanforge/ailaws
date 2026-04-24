type OrganizationMemberForRouting = {
  role: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
};

type OrganizationForRouting = {
  id: string;
  name: string;
  slug: string;
  integrationSettings: {
    complianceEmailEnabled: boolean;
    complianceSlackWebhookUrl: string | null;
    notificationRole: string;
  } | null;
  members: OrganizationMemberForRouting[];
};

function roleRank(role: string) {
  if (role === "owner") return 3;
  if (role === "admin") return 2;
  return 1;
}

export function getOrganizationAlertRecipients(
  organizations: OrganizationForRouting[],
  sourceUserId: string,
) {
  const recipients = new Map<string, { email: string; name: string | null; organizationName: string }>();
  const slackWebhooks = new Map<string, { webhookUrl: string; organizationName: string }>();

  for (const organization of organizations) {
    const settings = organization.integrationSettings;
    if (!settings) continue;

    const minimumRoleRank = roleRank(settings.notificationRole);

    if (settings.complianceEmailEnabled) {
      for (const member of organization.members) {
        if (member.user.id === sourceUserId) continue;
        if (!member.user.email) continue;
        if (roleRank(member.role) < minimumRoleRank) continue;

        recipients.set(`${organization.id}:${member.user.email}`, {
          email: member.user.email,
          name: member.user.name,
          organizationName: organization.name,
        });
      }
    }

    if (settings.complianceSlackWebhookUrl) {
      slackWebhooks.set(organization.id, {
        webhookUrl: settings.complianceSlackWebhookUrl,
        organizationName: organization.name,
      });
    }
  }

  return {
    emailRecipients: Array.from(recipients.values()),
    slackWebhooks: Array.from(slackWebhooks.values()),
  };
}
