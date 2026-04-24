ALTER TABLE "users" ADD COLUMN "emailVerified" DATETIME;
ALTER TABLE "users" ADD COLUMN "verificationTokenHash" TEXT;
ALTER TABLE "users" ADD COLUMN "verificationTokenExpiresAt" DATETIME;