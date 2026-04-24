import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set(["open", "acknowledged", "resolved"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { alertId } = await params;
  let body: { status?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid alert status" }, { status: 400 });
  }

  const existing = await prisma.complianceAlert.findUnique({
    where: { id: alertId },
    select: { id: true, userId: true },
  });

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.complianceAlert.update({
    where: { id: alertId },
    data: {
      status: body.status,
      resolvedAt: body.status === "resolved" ? new Date() : null,
    },
  });

  return NextResponse.json({ data: updated });
}
