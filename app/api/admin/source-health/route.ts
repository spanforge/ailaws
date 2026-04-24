import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getRateLimitMetricsSnapshot } from "@/lib/rate-limit";
import { laws } from "@/lib/lexforge-data";
import { isRegulatoryAlertDeliveryConfigured } from "@/lib/alert-delivery";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === "admin" ? session : null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dbLaws = await prisma.law.findMany({
    select: {
      slug: true,
      shortTitle: true,
      title: true,
      jurisdiction: true,
      sourceHealthStatus: true,
      sourceCheckedAt: true,
      reviewStatus: true,
      lastReviewedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const latestChecks = await prisma.sourceHealthCheck.findMany({
    orderBy: { checkedAt: "desc" },
    take: 20,
    include: {
      law: { select: { slug: true, shortTitle: true, title: true } },
    },
  });

  const freshnessMeta = new Map(laws.map((law) => [law.slug, law.freshness_sla_days ?? 180]));
  const staleLaws = dbLaws
    .map((law) => {
      const slaDays = freshnessMeta.get(law.slug) ?? 180;
      const reviewedAt = law.lastReviewedAt ?? law.sourceCheckedAt;
      const overdueDays = reviewedAt
        ? Math.floor((Date.now() - reviewedAt.getTime()) / 86_400_000) - slaDays
        : slaDays + 1;

      return {
        slug: law.slug,
        title: law.shortTitle ?? law.title,
        jurisdiction: law.jurisdiction,
        sourceHealthStatus: law.sourceHealthStatus,
        sourceCheckedAt: law.sourceCheckedAt?.toISOString() ?? null,
        reviewStatus: law.reviewStatus,
        overdueDays,
      };
    })
    .filter((law) => law.overdueDays > 0)
    .sort((left, right) => right.overdueDays - left.overdueDays)
    .slice(0, 12);

  return NextResponse.json({
    summary: {
      totalLaws: dbLaws.length,
      staleLaws: staleLaws.length,
      brokenSources: dbLaws.filter((law) => law.sourceHealthStatus === "broken" || law.sourceHealthStatus === "timeout").length,
      blockedSources: dbLaws.filter((law) => law.sourceHealthStatus === "blocked").length,
      alertDeliveryConfigured: isRegulatoryAlertDeliveryConfigured(),
    },
    staleLaws,
    latestChecks: latestChecks.map((check) => ({
      id: check.id,
      slug: check.law.slug,
      title: check.law.shortTitle ?? check.law.title,
      status: check.status,
      checkedAt: check.checkedAt.toISOString(),
      httpStatus: check.httpStatus,
      responseTimeMs: check.responseTimeMs,
      redirectUrl: check.redirectUrl,
      errorMessage: check.errorMessage,
    })),
    rateLimitMetrics: getRateLimitMetricsSnapshot().slice(0, 8).map((metric) => ({
      ...metric,
      lastSeenAt: new Date(metric.lastSeenAt).toISOString(),
    })),
  });
}