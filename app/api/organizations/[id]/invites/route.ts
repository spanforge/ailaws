import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { captureException } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { buildWorkspaceInviteUrl, sendWorkspaceInviteEmail } from "@/lib/workspace-email";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: id,
      userId: session.user.id,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await req.json() as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const duplicateInvite = await prisma.organizationInvite.findFirst({
    where: {
      organizationId: id,
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (duplicateInvite) {
    try {
      await sendWorkspaceInviteEmail({
        email,
        inviterName: session.user.name,
        workspaceName: organization.name,
        acceptUrl: buildWorkspaceInviteUrl(duplicateInvite.token),
        expiresAt: duplicateInvite.expiresAt,
      });
    } catch (error) {
      await captureException(error, {
        tags: { surface: "workspace", action: "send-invite-email" },
        extra: { organizationId: organization.id, inviteId: duplicateInvite.id, email },
      });
    }

    return NextResponse.json({ data: duplicateInvite }, { status: 200 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: id,
      email,
      expiresAt,
    },
  });

  try {
    await sendWorkspaceInviteEmail({
      email,
      inviterName: session.user.name,
      workspaceName: organization.name,
      acceptUrl: buildWorkspaceInviteUrl(invite.token),
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    await captureException(error, {
      tags: { surface: "workspace", action: "send-invite-email" },
      extra: { organizationId: organization.id, inviteId: invite.id, email },
    });
  }

  return NextResponse.json({ data: invite }, { status: 201 });
}
