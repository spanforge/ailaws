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
  const body = (await req.json()) as { status?: string; assigneeId?: string | null };

  if (body.status && !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
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

  let nextAssigneeId: string | null | undefined = undefined;
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null || body.assigneeId === "") {
      nextAssigneeId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: body.assigneeId },
        select: { id: true },
      });
      if (!assignee) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
      }
      if (body.assigneeId !== session.user.id) {
        const sharedMembership = await prisma.organizationMember.findFirst({
          where: {
            userId: session.user.id,
            organization: {
              members: {
                some: { userId: body.assigneeId },
              },
            },
          },
          select: { id: true },
        });
        if (!sharedMembership) {
          return NextResponse.json({ error: "Assignee must share a workspace with you" }, { status: 400 });
        }
      }
      nextAssigneeId = body.assigneeId;
    }
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(nextAssigneeId !== undefined ? { assigneeId: nextAssigneeId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
