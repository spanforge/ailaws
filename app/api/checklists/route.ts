import { NextRequest, NextResponse } from "next/server";
import { getLawBySlug } from "@/lib/lexforge-data";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessment_id } = (await req.json()) as { assessment_id: string };

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessment_id },
    include: { results: true },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const applicableLaws = assessment.results.filter(
    (r) => r.applicabilityStatus === "likely_applies" || r.applicabilityStatus === "may_apply"
  );

  const items = applicableLaws.flatMap((result) => {
    const law = getLawBySlug(result.lawSlug);
    if (!law) return [];
    return law.obligations.map((ob) => ({
      lawSlug: result.lawSlug,
      title: ob.title,
      description: ob.description ?? null,
      category: ob.category ?? null,
      citation: ob.citation ?? null,
      priority: ob.priority ?? null,
      status: "not_started",
    }));
  });

  const checklist = await prisma.checklist.create({
    data: {
      assessmentId: assessment_id,
      title: "Compliance Checklist",
      items: { create: items },
    },
    include: { items: true },
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
    include: { items: { orderBy: { priority: "asc" } } },
  });

  if (!checklist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(checklist);
}
