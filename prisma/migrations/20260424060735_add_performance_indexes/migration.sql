-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_laws" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "jurisdiction" TEXT,
    "topics" TEXT,
    "issuingBody" TEXT,
    "status" TEXT,
    "contentType" TEXT,
    "summaryShort" TEXT,
    "summaryLong" TEXT,
    "officialUrl" TEXT,
    "adoptedDate" DATETIME,
    "effectiveDate" DATETIME,
    "lastReviewedAt" DATETIME,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceKind" TEXT,
    "sourceAuthority" TEXT,
    "sourceJurisdiction" TEXT,
    "sourceCitationFull" TEXT,
    "verifiedAt" DATETIME,
    "verifiedByUserId" TEXT,
    "confidenceLevel" TEXT NOT NULL DEFAULT 'medium',
    "reviewStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "supersededById" TEXT,
    "editorNotes" TEXT,
    "rulesEngineVersion" TEXT,
    "sourceHealthStatus" TEXT,
    "sourceCheckedAt" DATETIME,
    "sourceArchiveUrl" TEXT,
    CONSTRAINT "laws_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_laws" ("adoptedDate", "confidenceLevel", "contentType", "createdAt", "editorNotes", "effectiveDate", "id", "isPublished", "issuingBody", "jurisdiction", "lastReviewedAt", "officialUrl", "reviewStatus", "rulesEngineVersion", "shortTitle", "slug", "sourceArchiveUrl", "sourceAuthority", "sourceCheckedAt", "sourceCitationFull", "sourceHealthStatus", "sourceJurisdiction", "sourceKind", "status", "summaryLong", "summaryShort", "supersededById", "title", "topics", "updatedAt", "verifiedAt", "verifiedByUserId") SELECT "adoptedDate", "confidenceLevel", "contentType", "createdAt", "editorNotes", "effectiveDate", "id", "isPublished", "issuingBody", "jurisdiction", "lastReviewedAt", "officialUrl", "reviewStatus", "rulesEngineVersion", "shortTitle", "slug", "sourceArchiveUrl", "sourceAuthority", "sourceCheckedAt", "sourceCitationFull", "sourceHealthStatus", "sourceJurisdiction", "sourceKind", "status", "summaryLong", "summaryShort", "supersededById", "title", "topics", "updatedAt", "verifiedAt", "verifiedByUserId" FROM "laws";
DROP TABLE "laws";
ALTER TABLE "new_laws" RENAME TO "laws";
CREATE UNIQUE INDEX "laws_slug_key" ON "laws"("slug");
CREATE INDEX "laws_jurisdiction_idx" ON "laws"("jurisdiction");
CREATE INDEX "laws_reviewStatus_idx" ON "laws"("reviewStatus");
CREATE INDEX "laws_sourceHealthStatus_idx" ON "laws"("sourceHealthStatus");
CREATE INDEX "laws_isPublished_idx" ON "laws"("isPublished");
CREATE TABLE "new_obligations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT,
    "citation" TEXT,
    "actionRequired" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceKind" TEXT,
    "sourceCitationFull" TEXT,
    "sourceExcerpt" TEXT,
    "confidenceLevel" TEXT NOT NULL DEFAULT 'medium',
    "reviewStatus" TEXT NOT NULL DEFAULT 'draft',
    "changeReason" TEXT,
    "editorNotes" TEXT,
    "verifiedAt" DATETIME,
    CONSTRAINT "obligations_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "laws" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_obligations" ("actionRequired", "category", "changeReason", "citation", "confidenceLevel", "createdAt", "description", "editorNotes", "id", "lawId", "priority", "reviewStatus", "sourceCitationFull", "sourceExcerpt", "sourceKind", "title", "updatedAt", "verifiedAt") SELECT "actionRequired", "category", "changeReason", "citation", "confidenceLevel", "createdAt", "description", "editorNotes", "id", "lawId", "priority", "reviewStatus", "sourceCitationFull", "sourceExcerpt", "sourceKind", "title", "updatedAt", "verifiedAt" FROM "obligations";
DROP TABLE "obligations";
ALTER TABLE "new_obligations" RENAME TO "obligations";
CREATE INDEX "obligations_lawId_idx" ON "obligations"("lawId");
CREATE INDEX "obligations_reviewStatus_idx" ON "obligations"("reviewStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "assessment_results_assessmentId_idx" ON "assessment_results"("assessmentId");

-- CreateIndex
CREATE INDEX "assessment_results_lawSlug_idx" ON "assessment_results"("lawSlug");

-- CreateIndex
CREATE INDEX "assessments_userId_idx" ON "assessments"("userId");
