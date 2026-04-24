import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordActionAudit } from "@/lib/action-audit";
import { prisma } from "@/lib/prisma";
import { syncAndDeliverComplianceAlertsForUser } from "@/lib/compliance-alerts";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { userId?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const targetUsers = body.userId
    ? [body.userId]
    : (await prisma.user.findMany({
        where: {
          assessments: { some: {} },
        },
        select: { id: true },
      })).map((user) => user.id);

  const results = [];
  for (const userId of targetUsers) {
    results.push({
      userId,
      ...(await syncAndDeliverComplianceAlertsForUser(userId)),
    });
  }

  await recordActionAudit({
    actorId: session.user?.id,
    actorEmail: session.user?.email,
    actionType: "admin.alerts.deliver",
    scope: "admin",
    targetType: "complianceAlert",
    request: req,
    metadata: { processedUsers: results.length, userId: body.userId ?? null },
  });

  return NextResponse.json({
    ok: true,
    triggeredBy: session.user?.id,
    processedUsers: results.length,
    results,
  });
}
