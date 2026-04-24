import { NextRequest, NextResponse } from "next/server";
import { laws } from "@/lib/lexforge-data";
import { runRulesEngine, type AssessmentInput } from "@/lib/rules-engine";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { captureException } from "@/lib/monitoring";
import { buildRateLimitHeaders, takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const rateLimit = takeRateLimit({
    key: `assessments:create:${userId}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many assessment runs. Please wait a moment and try again." },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  let body: AssessmentInput & { name?: string };

  try {
    body = (await req.json()) as AssessmentInput & { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.hq_region || !body.target_markets || !Array.isArray(body.target_markets)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const results = runRulesEngine(laws, body);

    const assessment = await prisma.assessment.create({
      data: {
        userId,
        name: body.name ?? null,
        companyProfile: JSON.stringify({
          company_name: body.company_name ?? "",
          hq_region: body.hq_region,
          company_size: body.company_size,
          industry: body.industry ?? "",
          target_markets: body.target_markets,
        }),
        productProfile: JSON.stringify({
          product_preset: body.product_preset ?? "",
          product_type: body.product_type,
          use_cases: body.use_cases,
          deployment_context: body.deployment_context,
        }),
        technicalProfile: JSON.stringify({
          uses_ai: body.uses_ai,
          uses_biometric_data: body.uses_biometric_data,
          processes_personal_data: body.processes_personal_data,
          processes_eu_personal_data: body.processes_eu_personal_data,
          automated_decisions: body.automated_decisions,
          risk_self_assessment: body.risk_self_assessment ?? "limited",
        }),
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
  } catch (error) {
    await captureException(error, {
      tags: { surface: "assessments", action: "create" },
      extra: { userId },
    });
    return NextResponse.json({ error: "Unable to run assessment right now" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessments = await prisma.assessment.findMany({
    where: { userId: session.user.id },
    include: {
      results: true,
      checklists: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: assessments });
}
