import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildAssessmentEvidencePackage } from "@/lib/evidence-package";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      checklists: {
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const evidencePackage = buildAssessmentEvidencePackage(assessment);

  return new NextResponse(JSON.stringify(evidencePackage, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="spanforge-compass-evidence-${assessment.id}.json"`,
    },
  });
}
