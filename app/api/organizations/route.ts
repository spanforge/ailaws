import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { captureException } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { sendWorkspaceCreatedEmail } from "@/lib/workspace-email";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          invites: {
            where: { acceptedAt: null },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({
    data: memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      members: membership.organization.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      })),
      invites: membership.organization.invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string; slug?: string };
  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  if (session.user.email) {
    try {
      await sendWorkspaceCreatedEmail({
        email: session.user.email,
        recipientName: session.user.name,
        workspaceName: organization.name,
        workspaceSlug: organization.slug,
      });
    } catch (error) {
      await captureException(error, {
        tags: { surface: "workspace", action: "send-created-email" },
        extra: { organizationId: organization.id, userId: session.user.id },
      });
    }
  }

  return NextResponse.json({ data: organization }, { status: 201 });
}
