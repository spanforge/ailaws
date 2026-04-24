import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string; itemId: string }> };

const VALID_STATUSES = ["not_started", "in_progress", "completed"] as const;

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: checklistId, itemId } = await params;
  const body = (await req.json()) as { status: string };

  if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify the checklist belongs to the session user via its assessment
  const checklist = await prisma.checklist.findFirst({
    where: { id: checklistId, assessment: { userId: session.user.id } },
    select: { id: true },
  });

  if (!checklist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, checklistId },
    select: { id: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { status: body.status },
  });

  return NextResponse.json(updated);
}
