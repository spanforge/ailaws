import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildAssessmentIntelligence } from "@/lib/server-intelligence";
import { getLawBySlug } from "@/lib/lexforge-data";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const assessment = await prisma.assessment.findFirst({
    where: { id, userId: session.user.id },
    include: {
      results: true,
      checklists: {
        include: {
          items: {
            include: {
              evidenceArtifacts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resultSlugs = [...new Set(
    assessment.results
      .filter((result) => result.applicabilityStatus === "likely_applies" || result.applicabilityStatus === "may_apply")
      .map((result) => result.lawSlug),
  )];

  const changelogEntries = resultSlugs.length > 0
    ? await prisma.lawChangelog.findMany({
        where: { lawSlug: { in: resultSlugs } },
        orderBy: { changedAt: "desc" },
        take: 25,
      })
    : [];

  const systemChangeEvents = await prisma.systemChangeEvent.findMany({
    where: { occurredAt: { gte: assessment.createdAt } },
    orderBy: { occurredAt: "desc" },
    take: 25,
  });

  const data = buildAssessmentIntelligence({
    assessment,
    changelogEntries: changelogEntries.map((entry) => ({
      id: entry.id,
      lawSlug: entry.lawSlug,
      lawShortTitle: getLawBySlug(entry.lawSlug)?.short_title ?? entry.lawSlug,
      summary: entry.summary,
      changedAt: entry.changedAt.toISOString(),
    })),
    systemChangeEvents: systemChangeEvents.map((event) => ({
      occurredAt: event.occurredAt.toISOString(),
      source: event.source,
      eventType: event.eventType,
      summary: event.summary,
      environment: event.environment,
      recommendation: (() => {
        try {
          const metadata = event.metadataJson ? JSON.parse(event.metadataJson) as Record<string, unknown> : null;
          return typeof metadata?.recommendation === "string" ? metadata.recommendation : null;
        } catch {
          return null;
        }
      })(),
    })),
  });

  return NextResponse.json({ data });
}