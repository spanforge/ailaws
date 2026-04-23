import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await prisma.savedLaw.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { lawSlug: true, createdAt: true },
  });

  return NextResponse.json({ data: saved });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lawSlug } = (await req.json()) as { lawSlug?: string };
  if (!lawSlug) return NextResponse.json({ error: "lawSlug required" }, { status: 400 });

  const saved = await prisma.savedLaw.upsert({
    where: { userId_lawSlug: { userId: session.user.id, lawSlug } },
    create: { userId: session.user.id, lawSlug },
    update: {},
  });

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const lawSlug = searchParams.get("lawSlug");
  if (!lawSlug) return NextResponse.json({ error: "lawSlug required" }, { status: 400 });

  await prisma.savedLaw.deleteMany({
    where: { userId: session.user.id, lawSlug },
  });

  return NextResponse.json({ ok: true });
}
