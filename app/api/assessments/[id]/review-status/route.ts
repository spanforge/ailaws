import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["draft", "reviewed", "approved"] as const;
type ReviewStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: { reviewStatus?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reviewStatus } = body;
  if (!reviewStatus || !VALID_STATUSES.includes(reviewStatus as ReviewStatus)) {
    return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.assessment.update({
    where: { id },
    data: { reviewStatus },
  });

  return NextResponse.json({ data: { reviewStatus: updated.reviewStatus } });
}
