import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAndDeliverComplianceAlertsForUser } from "@/lib/compliance-alerts";
import { captureException, log } from "@/lib/monitoring";
import { withRequestId } from "@/lib/request-context";

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${cronSecret}`) return true;

  const vercelCron = req.headers.get("x-vercel-cron");
  const cronHeaderSecret = req.headers.get("x-cron-secret");
  return vercelCron === "1" && cronHeaderSecret === cronSecret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        assessments: { some: {} },
      },
      select: { id: true },
    });

    const results = [];
    for (const user of users) {
      results.push({
        userId: user.id,
        ...(await syncAndDeliverComplianceAlertsForUser(user.id)),
      });
    }

    log("info", "cron.compliance_alerts.completed", {
      processedUsers: results.length,
      deliveredCount: results.reduce((sum, entry) => sum + (entry.deliveredCount ?? 0), 0),
      slackDeliveredCount: results.reduce((sum, entry) => sum + (entry.slackDeliveredCount ?? 0), 0),
      ...withRequestId(req),
    });

    return NextResponse.json({
      ok: true,
      processedUsers: results.length,
      results,
    });
  } catch (error) {
    await captureException(error, {
      tags: { surface: "cron", action: "deliver-compliance-alerts" },
    });
    return NextResponse.json({ error: "Failed to process compliance alert delivery" }, { status: 500 });
  }
}
