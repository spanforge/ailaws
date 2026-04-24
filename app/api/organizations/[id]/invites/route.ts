import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ data: invite }, { status: 201 });
}
