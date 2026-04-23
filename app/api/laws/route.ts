import { NextRequest, NextResponse } from "next/server";
import { searchLaws } from "@/lib/lexforge-data";

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

  const total = all.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);

  return NextResponse.json({ data, total, page, totalPages, limit });
}
