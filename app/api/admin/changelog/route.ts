import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === "admin" ? session : null;
}

const VALID_CHANGE_TYPES = [
  "amendment",
  "new_obligation",
  "effective_date_change",
  "status_change",
  "guidance_issued",
  "repeal",
];

// GET /api/admin/changelog — list all entries, newest first
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await prisma.lawChangelog.findMany({
    orderBy: { changedAt: "desc" },
    take: 100,
  });

  // Enrich with law short titles
  const slugs = [...new Set(entries.map((e) => e.lawSlug))];
  const lawsData = await prisma.law.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, shortTitle: true, jurisdiction: true },
  });
  const lawMap = Object.fromEntries(lawsData.map((l) => [l.slug, l]));

  return NextResponse.json({
    data: entries.map((e) => ({
      ...e,
      lawShortTitle: lawMap[e.lawSlug]?.shortTitle ?? e.lawSlug,
      lawJurisdiction: lawMap[e.lawSlug]?.jurisdiction ?? "",
    })),
  });
}

// POST /api/admin/changelog — create a new entry
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    lawSlug?: string;
    changeType?: string;
    summary?: string;
    details?: string;
    changedAt?: string;
  };

  if (!body.lawSlug?.trim()) return NextResponse.json({ error: "lawSlug required" }, { status: 400 });
  if (!body.changeType || !VALID_CHANGE_TYPES.includes(body.changeType)) {
    return NextResponse.json({ error: `changeType must be one of: ${VALID_CHANGE_TYPES.join(", ")}` }, { status: 400 });
  }
  if (!body.summary?.trim()) return NextResponse.json({ error: "summary required" }, { status: 400 });

  // Verify the law slug exists
  const law = await prisma.law.findUnique({ where: { slug: body.lawSlug.trim() } });
  if (!law) return NextResponse.json({ error: `No law found with slug "${body.lawSlug}"` }, { status: 400 });

  const entry = await prisma.lawChangelog.create({
    data: {
      lawSlug: body.lawSlug.trim(),
      changeType: body.changeType,
      summary: body.summary.trim(),
      details: body.details?.trim() || null,
      changedAt: body.changedAt ? new Date(body.changedAt) : new Date(),
    },
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}

// DELETE /api/admin/changelog?id=...
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const entry = await prisma.lawChangelog.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.lawChangelog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
