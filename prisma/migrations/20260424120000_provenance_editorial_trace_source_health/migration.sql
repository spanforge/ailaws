-- WS1/WS2/WS3: Provenance, Editorial Governance, and Rules Engine
-- Note: Column additions to laws, obligations, assessment_results are handled
-- by the preceding performance indexes migration (which redefined those tables).
-- This migration only creates the three new tables.

-- WS2: Content Edit Audit Log
CREATE TABLE IF NOT EXISTS "content_edit_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "lawId" TEXT,
    "obligationId" TEXT,
    "actorId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_edit_audit_logs_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "laws" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "content_edit_audit_logs_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "content_edit_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "content_edit_audit_logs_entityId_idx" ON "content_edit_audit_logs"("entityId");
CREATE INDEX IF NOT EXISTS "content_edit_audit_logs_actorId_idx" ON "content_edit_audit_logs"("actorId");

-- WS2: Content Approval Workflow
CREATE TABLE IF NOT EXISTS "content_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "content_approvals_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "content_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "content_approvals_entityId_idx" ON "content_approvals"("entityId");

-- WS8: Source Health Checks
CREATE TABLE IF NOT EXISTS "source_health_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawId" TEXT NOT NULL,
    "checkedUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "redirectUrl" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "responseTimeMs" INTEGER,
    CONSTRAINT "source_health_checks_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "laws" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "source_health_checks_lawId_idx" ON "source_health_checks"("lawId");
