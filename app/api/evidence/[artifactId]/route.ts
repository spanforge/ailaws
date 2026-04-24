import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ artifactId: string }> };

const VALID_STATUSES = ["collected", "linked", "verified", "stale", "rejected"] as const;

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { artifactId } = await params;
  const body = (await req.json()) as {
    status?: string;
    expiresAt?: string | null;
    description?: string | null;
    sourceUrl?: string | null;
  };

  if (body.status && !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const artifact = await prisma.evidenceArtifact.findFirst({
    where: {
      id: artifactId,
      checklistItem: {
        checklist: {
          assessment: {
            userId: session.user.id,
          },
        },
      },
    },
    select: { id: true },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus = body.status ?? undefined;
  const updated = await prisma.evidenceArtifact.update({
    where: { id: artifactId },
    data: {
      status: nextStatus,
      description: body.description === undefined ? undefined : body.description?.trim() || null,
      sourceUrl: body.sourceUrl === undefined ? undefined : body.sourceUrl?.trim() || null,
      expiresAt: body.expiresAt === undefined ? undefined : body.expiresAt ? new Date(body.expiresAt) : null,
      verifiedAt: nextStatus === "verified" ? new Date() : nextStatus ? null : undefined,
    },
  });

  return NextResponse.json(updated);
}
