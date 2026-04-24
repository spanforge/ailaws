import { NextRequest, NextResponse } from "next/server";
import { captureException, log } from "@/lib/monitoring";
import { withRequestId } from "@/lib/request-context";
import { runSourceValidation } from "@/lib/source-validation";

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

  const slug = req.nextUrl.searchParams.get("slug");
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  try {
    const summary = await runSourceValidation({ dryRun, slug });

    log("info", "cron.source_validation.completed", {
      processed: summary.processed,
      counts: summary.counts,
      dryRun,
      slug,
      ...withRequestId(req),
    });

    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    await captureException(error, {
      tags: { surface: "cron", action: "source-validation" },
      extra: withRequestId(req, { dryRun, slug }),
    });

    return NextResponse.json({ error: "Failed to validate source health" }, { status: 500 });
  }
}