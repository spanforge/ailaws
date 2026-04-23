import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string; itemId: string }> };

const VALID_STATUSES = ["not_started", "in_progress", "completed"] as const;

export async function PATCH(req: NextRequest, { params }: Props) {
  const { itemId } = await params;
  const body = (await req.json()) as { status: string };

  if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const updated = await prisma.checklistItem.update({
      where: { id: itemId },
      data: { status: body.status },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
}
