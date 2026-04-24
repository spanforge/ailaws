import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildAssessmentEvidencePackage } from "@/lib/evidence-package";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const session = await auth();
  const { id } = await params;

  const assessment = await prisma.assessment.findFirst({
    where: session?.user?.id
      ? {
          id,
          userId: session.user.id,
        }
      : {
          id,
          userId: null,
        },
    include: {
      checklists: {
        include: {
          items: {
            include: {
              evidenceArtifacts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: session?.user?.id ? "Assessment not found" : "Guest evidence package not found" }, { status: 404 });
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
