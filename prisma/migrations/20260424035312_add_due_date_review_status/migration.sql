-- AlterTable
ALTER TABLE "checklist_items" ADD COLUMN "dueDate" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT,
    "companyProfile" TEXT NOT NULL,
    "productProfile" TEXT NOT NULL,
    "technicalProfile" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_assessments" ("companyProfile", "createdAt", "id", "name", "productProfile", "technicalProfile", "userId") SELECT "companyProfile", "createdAt", "id", "name", "productProfile", "technicalProfile", "userId" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
