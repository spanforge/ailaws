-- CreateTable
CREATE TABLE "action_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actionType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "organizationId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "requestId" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "action_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "action_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "action_audit_logs_actorId_idx" ON "action_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "action_audit_logs_organizationId_idx" ON "action_audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "action_audit_logs_scope_createdAt_idx" ON "action_audit_logs"("scope", "createdAt");

-- CreateIndex
CREATE INDEX "action_audit_logs_actionType_createdAt_idx" ON "action_audit_logs"("actionType", "createdAt");