import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordActionAudit } from "@/lib/action-audit";
import { prisma } from "@/lib/prisma";

function canManageRole(role: string) {
  return role === "owner" || role === "admin";
}

async function getMembership(userId: string, organizationId: string) {
  return prisma.organizationMember.findFirst({
    where: { userId, organizationId },
    select: { role: true },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership || !canManageRole(membership.role)) {
    await recordActionAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actionType: "organization.integration.update",
      scope: "organization",
      status: "denied",
      organizationId: id,
      targetType: "organizationIntegrationSettings",
      targetId: id,
      request: req,
      metadata: { reason: "missing_manage_role" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    complianceEmailEnabled?: boolean;
    complianceSlackWebhookUrl?: string | null;
    notificationRole?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.notificationRole && !["owner", "admin", "member"].includes(body.notificationRole)) {
    return NextResponse.json({ error: "Invalid notificationRole" }, { status: 400 });
  }

  const settings = await prisma.organizationIntegrationSettings.upsert({
    where: { organizationId: id },
    update: {
      ...(typeof body.complianceEmailEnabled === "boolean" ? { complianceEmailEnabled: body.complianceEmailEnabled } : {}),
      ...(body.complianceSlackWebhookUrl !== undefined ? { complianceSlackWebhookUrl: body.complianceSlackWebhookUrl?.trim() || null } : {}),
      ...(body.notificationRole ? { notificationRole: body.notificationRole } : {}),
    },
    create: {
      organizationId: id,
      complianceEmailEnabled: body.complianceEmailEnabled ?? true,
      complianceSlackWebhookUrl: body.complianceSlackWebhookUrl?.trim() || null,
      notificationRole: body.notificationRole ?? "owner",
    },
  });

  await recordActionAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actionType: "organization.integration.update",
    scope: "organization",
    organizationId: id,
    targetType: "organizationIntegrationSettings",
    targetId: settings.id,
    request: req,
    metadata: {
      complianceEmailEnabled: settings.complianceEmailEnabled,
      notificationRole: settings.notificationRole,
      hasSlackWebhook: Boolean(settings.complianceSlackWebhookUrl),
    },
  });

  return NextResponse.json({ data: settings });
}
