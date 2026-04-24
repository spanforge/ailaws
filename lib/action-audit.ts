import { prisma } from "@/lib/prisma";
import { getRequestId } from "@/lib/request-context";

type AuditScope = "admin" | "organization" | "alerts" | "auth";
type AuditStatus = "success" | "denied" | "failed";

export interface ActionAuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actionType: string;
  scope: AuditScope;
  status?: AuditStatus;
  organizationId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: Request | { headers: Headers } | null;
}

export async function recordActionAudit(input: ActionAuditInput) {
  return prisma.actionAuditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      actionType: input.actionType,
      scope: input.scope,
      status: input.status ?? "success",
      organizationId: input.organizationId ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      requestId: input.request ? getRequestId(input.request) : null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}