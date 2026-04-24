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

const REVERTIBLE_LAW_FIELDS = new Set([
  "sourceKind",
  "sourceAuthority",
  "sourceCitationFull",
  "confidenceLevel",
  "editorNotes",
  "reviewStatus",
]);

const REVERTIBLE_OBLIGATION_FIELDS = new Set([
  "sourceKind",
  "sourceCitationFull",
  "sourceExcerpt",
  "confidenceLevel",
  "editorNotes",
  "reviewStatus",
]);

function normalizeValue(value: unknown) {
  return value == null ? null : String(value);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { auditLogId?: string; changeReason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.auditLogId?.trim()) {
    return NextResponse.json({ error: "auditLogId required" }, { status: 400 });
  }

  const auditEntry = await prisma.contentEditAuditLog.findUnique({
    where: { id: body.auditLogId },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      lawId: true,
      obligationId: true,
      fieldName: true,
      oldValue: true,
      newValue: true,
    },
  });

  if (!auditEntry) {
    return NextResponse.json({ error: "Audit entry not found" }, { status: 404 });
  }

  const actorId = session.user!.id!;
  const changeReason = body.changeReason?.trim() || `Reverted from audit entry ${auditEntry.id}`;

  if (auditEntry.entityType === "law") {
    if (!REVERTIBLE_LAW_FIELDS.has(auditEntry.fieldName)) {
      return NextResponse.json({ error: "This law field cannot be reverted" }, { status: 400 });
    }

    const existing = await prisma.law.findUnique({
      where: { id: auditEntry.entityId },
      select: {
        id: true,
        sourceKind: true,
        sourceAuthority: true,
        sourceCitationFull: true,
        confidenceLevel: true,
        editorNotes: true,
        reviewStatus: true,
        verifiedAt: true,
        verifiedByUserId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Law not found" }, { status: 404 });
    }

    const currentValue = normalizeValue((existing as Record<string, unknown>)[auditEntry.fieldName]);
    if (currentValue !== normalizeValue(auditEntry.newValue)) {
      return NextResponse.json(
        { error: "Field has changed since this audit entry and cannot be safely reverted" },
        { status: 409 },
      );
    }

    const updates: Record<string, unknown> = {
      [auditEntry.fieldName]: auditEntry.oldValue,
      updatedAt: new Date(),
    };

    if (auditEntry.fieldName === "reviewStatus") {
      if (auditEntry.oldValue === "verified") {
        updates.verifiedAt = existing.verifiedAt ?? new Date();
        updates.verifiedByUserId = existing.verifiedByUserId ?? actorId;
      } else {
        updates.verifiedAt = null;
        updates.verifiedByUserId = null;
      }
    }

    await prisma.$transaction([
      prisma.law.update({
        where: { id: auditEntry.entityId },
        data: updates,
      }),
      prisma.contentEditAuditLog.create({
        data: {
          entityType: "law",
          entityId: auditEntry.entityId,
          lawId: auditEntry.lawId ?? auditEntry.entityId,
          actorId,
          fieldName: auditEntry.fieldName,
          oldValue: auditEntry.newValue,
          newValue: auditEntry.oldValue,
          changeReason,
        },
      }),
    ]);
  } else if (auditEntry.entityType === "obligation") {
    if (!REVERTIBLE_OBLIGATION_FIELDS.has(auditEntry.fieldName)) {
      return NextResponse.json({ error: "This obligation field cannot be reverted" }, { status: 400 });
    }

    const existing = await prisma.obligation.findUnique({
      where: { id: auditEntry.entityId },
      select: {
        id: true,
        lawId: true,
        sourceKind: true,
        sourceCitationFull: true,
        sourceExcerpt: true,
        confidenceLevel: true,
        editorNotes: true,
        reviewStatus: true,
        verifiedAt: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
    }

    const currentValue = normalizeValue((existing as Record<string, unknown>)[auditEntry.fieldName]);
    if (currentValue !== normalizeValue(auditEntry.newValue)) {
      return NextResponse.json(
        { error: "Field has changed since this audit entry and cannot be safely reverted" },
        { status: 409 },
      );
    }

    const updates: Record<string, unknown> = {
      [auditEntry.fieldName]: auditEntry.oldValue,
    };

    if (auditEntry.fieldName === "reviewStatus") {
      updates.verifiedAt = auditEntry.oldValue === "verified" ? existing.verifiedAt ?? new Date() : null;
    }

    await prisma.$transaction([
      prisma.obligation.update({
        where: { id: auditEntry.entityId },
        data: updates,
      }),
      prisma.contentEditAuditLog.create({
        data: {
          entityType: "obligation",
          entityId: auditEntry.entityId,
          lawId: existing.lawId,
          obligationId: auditEntry.obligationId ?? auditEntry.entityId,
          actorId,
          fieldName: auditEntry.fieldName,
          oldValue: auditEntry.newValue,
          newValue: auditEntry.oldValue,
          changeReason,
        },
      }),
    ]);
  } else {
    return NextResponse.json({ error: "Unsupported entity type" }, { status: 400 });
  }

  log("info", "editorial.revert.recorded", {
    actorId,
    auditLogId: auditEntry.id,
    entityType: auditEntry.entityType,
    entityId: auditEntry.entityId,
    fieldName: auditEntry.fieldName,
    ...withRequestId(req),
  });

  return NextResponse.json({ ok: true });
}
