import { NextRequest, NextResponse } from "next/server";
import { laws } from "@/lib/lexforge-data";
import { runRulesEngine, type AssessmentInput } from "@/lib/rules-engine";
import { buildActionPlan, getActionTimelineLabel } from "@/lib/smb";
import { normalizeAssessmentInput } from "@/lib/compliance-analysis";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function parseAssessmentInput(companyProfile: string, productProfile: string, technicalProfile: string): AssessmentInput {
  return {
    ...JSON.parse(companyProfile ?? "{}"),
    ...JSON.parse(productProfile ?? "{}"),
    ...JSON.parse(technicalProfile ?? "{}"),
  } as AssessmentInput;
}

function dueDateForTimeline(timeline: "this_week" | "this_month" | "later") {
  const date = new Date();
  if (timeline === "this_week") {
    date.setDate(date.getDate() + 7);
  } else if (timeline === "this_month") {
    date.setDate(date.getDate() + 30);
  } else {
    date.setDate(date.getDate() + 90);
  }
  return date;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessment_id } = (await req.json()) as { assessment_id: string };

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessment_id },
    include: { results: true, checklists: { select: { id: true }, take: 1 } },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.checklists.length > 0) {
    const existing = await prisma.checklist.findUnique({
      where: { id: assessment.checklists[0].id },
      include: { items: { include: { evidenceArtifacts: true, assignee: { select: { id: true, name: true, email: true } } } } },
    });
    return NextResponse.json(existing, { status: 200 });
  }

  const input = normalizeAssessmentInput(
    parseAssessmentInput(assessment.companyProfile, assessment.productProfile, assessment.technicalProfile),
  );
  const results = runRulesEngine(laws, input);
  const actionPlan = buildActionPlan(results);

  const items = actionPlan.allActions.map((action) => ({
    lawSlug: action.lawSlug,
    title: action.title,
    description: `Owner: ${action.owner}. Target window: ${getActionTimelineLabel(action.timeline)}. ${action.whyItMatters}`,
    category: action.owner,
    citation: action.citation || null,
    priority: action.urgency === "urgent" ? "critical" : action.urgency === "soon" ? "high" : "medium",
    status: "not_started",
    dueDate: dueDateForTimeline(action.timeline),
  }));

  const checklist = await prisma.checklist.create({
    data: {
      assessmentId: assessment_id,
      title: "Compliance Action Plan",
      items: { create: items },
    },
    include: { items: { include: { evidenceArtifacts: true, assignee: { select: { id: true, name: true, email: true } } } } },
  });

  return NextResponse.json(checklist, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const checklist = await prisma.checklist.findUnique({
    where: { id },
    include: { items: { include: { evidenceArtifacts: true, assignee: { select: { id: true, name: true, email: true } } }, orderBy: { priority: "asc" } } },
  });

  if (!checklist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(checklist);
}
