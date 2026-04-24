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

const VALID_REVIEW_STATUSES = ["draft", "needs_review", "verified", "superseded", "archived"];

// POST /api/admin/editorial/approve
// Approves or rejects a law or obligation, recording the actor, reason, and changing reviewStatus.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const actorId = session.user!.id!;
  let body: {
    entityType?: string;
    entityId?: string;
    newStatus?: string;
    notes?: string;
    changeReason?: string;
    fieldEdits?: Record<string, string | null>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.entityType || !["law", "obligation"].includes(body.entityType)) {
    return NextResponse.json({ error: "entityType must be 'law' or 'obligation'" }, { status: 400 });
  }
  if (!body.entityId?.trim()) {
    return NextResponse.json({ error: "entityId required" }, { status: 400 });
  }
  if (!body.newStatus || !VALID_REVIEW_STATUSES.includes(body.newStatus)) {
    return NextResponse.json({ error: `newStatus must be one of: ${VALID_REVIEW_STATUSES.join(", ")}` }, { status: 400 });
  }

  const auditEntries: Array<{
    entityType: string;
    entityId: string;
    actorId: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    changeReason: string | null;
    lawId?: string;
    obligationId?: string;
  }> = [];

  if (body.entityType === "law") {
    const existing = await prisma.law.findUnique({
      where: { id: body.entityId },
      select: { reviewStatus: true, editorNotes: true },
    });
    if (!existing) return NextResponse.json({ error: "Law not found" }, { status: 404 });

    const updates: Record<string, unknown> = {
      reviewStatus: body.newStatus,
      updatedAt: new Date(),
    };
    if (body.newStatus === "verified") {
      updates.verifiedAt = new Date();
      updates.verifiedByUserId = actorId;
    }
    if (body.notes) updates.editorNotes = body.notes;

    // Apply optional field edits (e.g. correcting sourceKind, sourceCitationFull)
    if (body.fieldEdits) {
      for (const [field, value] of Object.entries(body.fieldEdits)) {
        const ALLOWED_FIELDS = ["sourceKind", "sourceAuthority", "sourceCitationFull", "editorNotes", "confidenceLevel"];
        if (ALLOWED_FIELDS.includes(field)) {
          const oldVal = (existing as Record<string, unknown>)[field] as string | null ?? null;
          updates[field] = value;
          auditEntries.push({
            entityType: "law",
            entityId: body.entityId,
            actorId,
            fieldName: field,
            oldValue: oldVal,
            newValue: value,
            changeReason: body.changeReason ?? null,
            lawId: body.entityId,
          });
        }
      }
    }

    auditEntries.push({
      entityType: "law",
      entityId: body.entityId,
      actorId,
      fieldName: "reviewStatus",
      oldValue: existing.reviewStatus,
      newValue: body.newStatus,
      changeReason: body.changeReason ?? null,
      lawId: body.entityId,
    });

    await prisma.$transaction([
      prisma.law.update({ where: { id: body.entityId }, data: updates }),
      prisma.contentEditAuditLog.createMany({ data: auditEntries }),
      prisma.contentApproval.create({
        data: {
          entityType: "law",
          entityId: body.entityId,
          reviewerId: actorId,
          approverId: actorId,
          status: body.newStatus === "verified" ? "approved" : "rejected",
          notes: body.notes ?? null,
          resolvedAt: new Date(),
        },
      }),
    ]);
  } else {
    const existing = await prisma.obligation.findUnique({
      where: { id: body.entityId },
      select: {
        reviewStatus: true,
        lawId: true,
        sourceKind: true,
        sourceCitationFull: true,
        sourceExcerpt: true,
        confidenceLevel: true,
        editorNotes: true,
      },
    });
    if (!existing) return NextResponse.json({ error: "Obligation not found" }, { status: 404 });

    const updates: Record<string, unknown> = { reviewStatus: body.newStatus };
    if (body.newStatus === "verified") updates.verifiedAt = new Date();
    if (body.changeReason) updates.changeReason = body.changeReason;
    if (body.notes) updates.editorNotes = body.notes;

    if (body.fieldEdits) {
      for (const [field, value] of Object.entries(body.fieldEdits)) {
        const ALLOWED_FIELDS = ["sourceKind", "sourceCitationFull", "sourceExcerpt", "confidenceLevel", "editorNotes"];
        if (ALLOWED_FIELDS.includes(field)) {
          const oldVal = (existing as Record<string, unknown>)[field] as string | null ?? null;
          updates[field] = value;
          auditEntries.push({
            entityType: "obligation",
            entityId: body.entityId,
            actorId,
            fieldName: field,
            oldValue: oldVal,
            newValue: value,
            changeReason: body.changeReason ?? null,
            obligationId: body.entityId,
            lawId: existing.lawId,
          });
        }
      }
    }

    auditEntries.push({
      entityType: "obligation",
      entityId: body.entityId,
      actorId,
      fieldName: "reviewStatus",
      oldValue: existing.reviewStatus,
      newValue: body.newStatus,
      changeReason: body.changeReason ?? null,
      obligationId: body.entityId,
      lawId: existing.lawId,
    });

    await prisma.$transaction([
      prisma.obligation.update({ where: { id: body.entityId }, data: updates }),
      prisma.contentEditAuditLog.createMany({ data: auditEntries }),
      prisma.contentApproval.create({
        data: {
          entityType: "obligation",
          entityId: body.entityId,
          reviewerId: actorId,
          approverId: actorId,
          status: body.newStatus === "verified" ? "approved" : "rejected",
          notes: body.notes ?? null,
          resolvedAt: new Date(),
        },
      }),
    ]);
  }

  log("info", "editorial.approval.recorded", {
    actorId,
    entityType: body.entityType,
    entityId: body.entityId,
    newStatus: body.newStatus,
    ...withRequestId(req),
  });

  return NextResponse.json({ ok: true, newStatus: body.newStatus });
}
