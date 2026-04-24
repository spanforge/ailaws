import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string; itemId: string }> };

const VALID_SOURCE_TYPES = ["manual_note", "document", "log", "url", "screenshot", "export", "policy"] as const;
const VALID_STATUSES = ["collected", "linked", "verified", "stale", "rejected"] as const;

async function getAuthorizedChecklistItem(checklistId: string, itemId: string, userId: string) {
  return prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      checklistId,
      checklist: {
        assessment: {
          userId,
        },
      },
    },
    include: {
      checklist: {
        select: {
          assessmentId: true,
        },
      },
      evidenceArtifacts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function GET(_req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: checklistId, itemId } = await params;
  const item = await getAuthorizedChecklistItem(checklistId, itemId, session.user.id);

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: item.id,
    title: item.title,
    evidenceArtifacts: item.evidenceArtifacts,
  });
}

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: checklistId, itemId } = await params;
  const item = await getAuthorizedChecklistItem(checklistId, itemId, session.user.id);

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    artifactType?: string;
    sourceType?: string;
    sourceUrl?: string;
    status?: string;
    expiresAt?: string;
  };

  if (!body.title?.trim() || !body.artifactType?.trim()) {
    return NextResponse.json({ error: "title and artifactType are required" }, { status: 400 });
  }

  const sourceType = body.sourceType?.trim() || "manual_note";
  const status = body.status?.trim() || "collected";

  if (!VALID_SOURCE_TYPES.includes(sourceType as (typeof VALID_SOURCE_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const artifact = await prisma.evidenceArtifact.create({
    data: {
      checklistItemId: item.id,
      assessmentId: item.checklist.assessmentId,
      createdByUserId: session.user.id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      artifactType: body.artifactType.trim(),
      sourceType,
      sourceUrl: body.sourceUrl?.trim() || null,
      status,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json(artifact, { status: 201 });
}
