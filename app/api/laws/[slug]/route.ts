import { NextRequest, NextResponse } from "next/server";
import { getLawBySlug } from "@/lib/lexforge-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const law = getLawBySlug(slug);
  if (!law) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(law);
}
