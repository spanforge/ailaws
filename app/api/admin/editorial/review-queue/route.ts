import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { log } from "@/lib/monitoring";
import { withRequestId } from "@/lib/request-context";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

// GET /api/admin/editorial/review-queue
// Returns laws + obligations that need editorial attention, sorted by risk.
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const sortBy = searchParams.get("sortBy") ?? "risk"; // risk | overdue | affected

  // Laws that need attention (not verified)
  const lawsNeedingReview = await prisma.law.findMany({
    where: {
      reviewStatus: { in: ["draft", "needs_review"] },
      isPublished: true,
    },
    select: {
      id: true,
      slug: true,
      shortTitle: true,
      jurisdiction: true,
      reviewStatus: true,
      confidenceLevel: true,
      sourceKind: true,
      sourceAuthority: true,
      sourceCitationFull: true,
      editorNotes: true,
      verifiedAt: true,
      lastReviewedAt: true,
      updatedAt: true,
      sourceHealthStatus: true,
      _count: { select: { savedBy: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });

  // Obligations that need attention
  const obligationsNeedingReview = await prisma.obligation.findMany({
    where: {
      reviewStatus: { in: ["draft", "needs_review"] },
    },
    select: {
      id: true,
      title: true,
      category: true,
      priority: true,
      sourceCitationFull: true,
      sourceExcerpt: true,
      lawId: true,
      reviewStatus: true,
      confidenceLevel: true,
      sourceKind: true,
      verifiedAt: true,
      law: { select: { slug: true, shortTitle: true, jurisdiction: true, sourceHealthStatus: true } },
    },
    take: 200,
  });

  // Pending approvals
  const pendingApprovals = await prisma.contentApproval.findMany({
    where: { status: "pending" },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: "asc" },
    take: 50,
  });

  const enrichedLaws = lawsNeedingReview.map((law) => {
    const overdueDays = law.lastReviewedAt
      ? Math.floor((Date.now() - law.lastReviewedAt.getTime()) / 86400000)
      : 9999;
    const reasons: string[] = [];
    if (law.reviewStatus === "draft") reasons.push("Not yet reviewed");
    if (law.reviewStatus === "needs_review") reasons.push("Flagged for re-review");
    if (law.sourceHealthStatus === "broken") reasons.push("Broken source link");
    if (law.sourceHealthStatus === "redirect") reasons.push("Source URL redirected");
    if (!law.sourceKind || law.sourceKind === "editorial_summary") reasons.push("Missing provenance");
    if (overdueDays > 180) reasons.push(`Source not checked in ${overdueDays} days`);
    const riskScore =
      (law.confidenceLevel === "low" ? 30 : law.confidenceLevel === "medium" ? 15 : 0) +
      (law._count.savedBy > 10 ? 20 : law._count.savedBy > 3 ? 10 : 0) +
      (law.sourceHealthStatus === "broken" ? 25 : 0) +
      (overdueDays > 180 ? 20 : overdueDays > 90 ? 10 : 0);
    return { ...law, overdueDays, reasons, riskScore, affectedUsers: law._count.savedBy };
  });

  let sortedLaws = enrichedLaws;
  if (sortBy === "overdue") sortedLaws = [...enrichedLaws].sort((a, b) => b.overdueDays - a.overdueDays);
  else if (sortBy === "affected") sortedLaws = [...enrichedLaws].sort((a, b) => b.affectedUsers - a.affectedUsers);
  else sortedLaws = [...enrichedLaws].sort((a, b) => b.riskScore - a.riskScore);

  const enrichedObligations = obligationsNeedingReview
    .map((obligation) => {
      const reasons: string[] = [];
      if (obligation.reviewStatus === "draft") reasons.push("Not yet reviewed");
      if (obligation.reviewStatus === "needs_review") reasons.push("Returned for review");
      if (!obligation.sourceKind || obligation.sourceKind === "editorial_summary") reasons.push("Weak provenance");
      if (!obligation.sourceCitationFull) reasons.push("Missing full citation");
      if (!obligation.sourceExcerpt) reasons.push("Missing source note");
      if (obligation.law.sourceHealthStatus === "broken") reasons.push("Parent law source broken");

      const riskScore =
        (obligation.priority === "critical" ? 30 : obligation.priority === "high" ? 18 : 8) +
        (obligation.confidenceLevel === "low" ? 22 : obligation.confidenceLevel === "medium" ? 10 : 0) +
        (!obligation.sourceCitationFull ? 18 : 0) +
        (!obligation.sourceExcerpt ? 12 : 0) +
        (obligation.law.sourceHealthStatus === "broken" ? 20 : 0);

      return {
        ...obligation,
        reasons,
        riskScore,
      };
    })
    .sort((a, b) => {
      if (sortBy === "overdue") return (b.verifiedAt ? b.verifiedAt.getTime() : 0) - (a.verifiedAt ? a.verifiedAt.getTime() : 0);
      if (sortBy === "affected") return (b.priority === "critical" ? 3 : b.priority === "high" ? 2 : 1) - (a.priority === "critical" ? 3 : a.priority === "high" ? 2 : 1);
      return b.riskScore - a.riskScore;
    });

  const entityIds = [
    ...sortedLaws.map((law) => law.id),
    ...enrichedObligations.map((obligation) => obligation.id),
  ];

  const auditEntries = entityIds.length > 0
    ? await prisma.contentEditAuditLog.findMany({
        where: {
          entityId: { in: entityIds },
          entityType: { in: ["law", "obligation"] },
        },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const auditEntriesByEntity = auditEntries.reduce<Record<string, typeof auditEntries>>((accumulator, entry) => {
    (accumulator[entry.entityId] ??= []).push(entry);
    return accumulator;
  }, {});

  log("info", "editorial.review_queue.viewed", {
    actorId: session.user?.id,
    lawCount: sortedLaws.length,
    obligationCount: obligationsNeedingReview.length,
    ...withRequestId(req),
  });

  return NextResponse.json({
    laws: sortedLaws.map((law) => ({
      ...law,
      recentAuditEntries: (auditEntriesByEntity[law.id] ?? []).slice(0, 5).map((entry) => ({
        ...entry,
        eventType: entry.changeReason?.toLowerCase().includes("reverted") ? "revert" : "edit",
      })),
    })),
    obligations: enrichedObligations.map((obligation) => ({
      ...obligation,
      recentAuditEntries: (auditEntriesByEntity[obligation.id] ?? []).slice(0, 5).map((entry) => ({
        ...entry,
        eventType: entry.changeReason?.toLowerCase().includes("reverted") ? "revert" : "edit",
      })),
    })),
    pendingApprovals,
    summary: {
      totalLawsNeedingReview: sortedLaws.length,
      totalObligationsNeedingReview: obligationsNeedingReview.length,
      totalPendingApprovals: pendingApprovals.length,
    },
  });
}
