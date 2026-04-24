import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email?.trim().toLowerCase();

  if (!userId || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const invites = await prisma.organizationInvite.findMany({
    where: {
      email,
      acceptedAt: null,
      expiresAt: { gt: now },
      organization: {
        members: {
          none: { userId },
        },
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: invites.map((invite) => ({
      id: invite.id,
      token: invite.token,
      email: invite.email,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      organization: invite.organization,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email?.trim().toLowerCase();

  if (!userId || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { inviteId?: string; token?: string };

  if (!body.inviteId && !body.token) {
    return NextResponse.json({ error: "Invite id or token is required" }, { status: 400 });
  }

  const invite = await prisma.organizationInvite.findFirst({
    where: {
      ...(body.inviteId ? { id: body.inviteId } : { token: body.token }),
      email,
      acceptedAt: null,
    },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  await prisma.$transaction(async (transaction) => {
    const existingMembership = await transaction.organizationMember.findFirst({
      where: { organizationId: invite.organizationId, userId },
    });

    if (!existingMembership) {
      await transaction.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: "member",
        },
      });
    }

    await transaction.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return NextResponse.json({
    data: {
      id: invite.id,
      organization: invite.organization,
      accepted: true,
    },
  });
}