-- AlterTable
ALTER TABLE "assessment_results" ADD COLUMN "evaluationTrace" TEXT;
ALTER TABLE "assessment_results" ADD COLUMN "rulesEngineVersion" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_law_changelog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawSlug" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorName" TEXT,
    "changeReason" TEXT,
    "isCorrectionNotUpdate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "law_changelog_lawSlug_fkey" FOREIGN KEY ("lawSlug") REFERENCES "laws" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_law_changelog" ("actorId", "actorName", "changeReason", "changeType", "changedAt", "details", "id", "isCorrectionNotUpdate", "lawSlug", "summary") SELECT "actorId", "actorName", "changeReason", "changeType", "changedAt", "details", "id", coalesce("isCorrectionNotUpdate", false) AS "isCorrectionNotUpdate", "lawSlug", "summary" FROM "law_changelog";
DROP TABLE "law_changelog";
ALTER TABLE "new_law_changelog" RENAME TO "law_changelog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
