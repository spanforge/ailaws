import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.alertPreference.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: prefs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    lawSlug?: string;
    jurisdiction?: string;
    emailEnabled?: boolean;
    digestMode?: string;
  };

  // Must supply either lawSlug or jurisdiction
  if (!body.lawSlug && !body.jurisdiction) {
    return NextResponse.json({ error: "Provide lawSlug or jurisdiction" }, { status: 400 });
  }

  // Avoid exact duplicates
  const existing = await prisma.alertPreference.findFirst({
    where: {
      userId: session.user.id,
      lawSlug: body.lawSlug ?? null,
      jurisdiction: body.jurisdiction ?? null,
    },
  });
  if (existing) {
    return NextResponse.json({ data: existing }, { status: 200 });
  }

  const pref = await prisma.alertPreference.create({
    data: {
      userId: session.user.id,
      lawSlug: body.lawSlug ?? null,
      jurisdiction: body.jurisdiction ?? null,
      emailEnabled: body.emailEnabled ?? true,
      digestMode: body.digestMode ?? "immediate",
    },
  });
  return NextResponse.json({ data: pref }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const pref = await prisma.alertPreference.findUnique({ where: { id } });
  if (!pref || pref.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.alertPreference.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
