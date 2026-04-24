import { NextRequest, NextResponse } from "next/server";
import { searchLaws } from "@/lib/lexforge-data";

function lawPriorityScore(law: {
  review_status?: string;
  confidence_level?: string;
  last_reviewed_at?: string;
  freshness_sla_days?: number;
}) {
  const reviewScore = law.review_status === "verified" ? 3 : law.review_status === "needs_review" ? 1 : 2;
  const confidenceScore = law.confidence_level === "high" ? 3 : law.confidence_level === "medium" ? 2 : 1;

  let freshnessScore = 0;
  if (law.last_reviewed_at && law.freshness_sla_days) {
    const ageDays = (Date.now() - new Date(law.last_reviewed_at).getTime()) / 86_400_000;
    freshnessScore = ageDays <= law.freshness_sla_days ? 2 : 0;
  }

  return reviewScore * 100 + confidenceScore * 10 + freshnessScore;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const all = searchLaws({
    search: searchParams.get("search") ?? undefined,
    jurisdiction: searchParams.get("jurisdiction") ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  const sorted = [...all].sort((left, right) => lawPriorityScore(right) - lawPriorityScore(left));

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);

  return NextResponse.json({ data, total, page, totalPages, limit });
}
