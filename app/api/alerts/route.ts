import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET /api/alerts
 * Returns recent changelog entries filtered by user's alert preferences.
 * If user has no preferences, returns all recent entries (last 90 days).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.alertPreference.findMany({
    where: { userId: session.user.id },
  });

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  let entries;
  if (prefs.length === 0) {
    // No preferences set — return all recent
    entries = await prisma.lawChangelog.findMany({
      where: { changedAt: { gte: ninetyDaysAgo } },
      orderBy: { changedAt: "desc" },
      take: 50,
    });
  } else {
    // Collect slugs and jurisdictions from preferences
    const lawSlugs = prefs.flatMap((p) => (p.lawSlug ? [p.lawSlug] : []));
    const jurisdictions = prefs.flatMap((p) => (p.jurisdiction ? [p.jurisdiction] : []));

    // Get laws matching jurisdiction preferences
    const jurisdictionLaws = jurisdictions.length > 0
      ? await prisma.law.findMany({
          where: { jurisdiction: { in: jurisdictions } },
          select: { slug: true },
        })
      : [];
    const allSlugs = [...new Set([...lawSlugs, ...jurisdictionLaws.map((l) => l.slug)])];

    entries = await prisma.lawChangelog.findMany({
      where: { lawSlug: { in: allSlugs } },
      orderBy: { changedAt: "desc" },
      take: 50,
    });
  }

  // Enrich with law metadata
  const slugs = [...new Set(entries.map((e) => e.lawSlug))];
  const lawsData = await prisma.law.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, shortTitle: true, jurisdiction: true },
  });
  const lawMap = Object.fromEntries(lawsData.map((l) => [l.slug, l]));

  const enriched = entries.map((e) => ({
    ...e,
    lawShortTitle: lawMap[e.lawSlug]?.shortTitle ?? e.lawSlug,
    lawJurisdiction: lawMap[e.lawSlug]?.jurisdiction ?? "",
  }));

  return NextResponse.json({ data: enriched, prefs });
}
