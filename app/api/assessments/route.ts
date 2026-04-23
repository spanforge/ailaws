import { NextRequest, NextResponse } from "next/server";
import { laws } from "@/lib/lexforge-data";
import { runRulesEngine, type AssessmentInput } from "@/lib/rules-engine";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AssessmentInput & { name?: string };

  if (!body.hq_region || !body.target_markets || !Array.isArray(body.target_markets)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Run rules engine
  const results = runRulesEngine(laws, body);

  // Persist to DB
  const assessment = await prisma.assessment.create({
    data: {
      userId,
      name: body.name ?? null,
      companyProfile: JSON.stringify({ hq_region: body.hq_region, company_size: body.company_size }),
      productProfile: JSON.stringify({ use_cases: body.use_cases, deployment_regions: body.target_markets }),
      technicalProfile: JSON.stringify({ uses_ai: body.uses_ai }),
      results: {
        create: results.map((r) => ({
          lawSlug: r.law_slug,
          relevanceScore: r.relevance_score,
          applicabilityStatus: r.applicability_status,
          rationale: r.rationale,
        })),
      },
    },
  });

  return NextResponse.json({ id: assessment.id, results }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessments = await prisma.assessment.findMany({
    where: { userId: session.user.id },
    include: { results: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: assessments });
}
