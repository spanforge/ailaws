/**
 * Source Validation Script
 *
 * Usage:
 *   npx tsx scripts/source-validation.ts
 *   npx tsx scripts/source-validation.ts --dry-run
 *   npx tsx scripts/source-validation.ts --slug eu-ai-act
 */

import { prisma } from "@/lib/prisma";
import { runSourceValidation } from "@/lib/source-validation";

const DRY_RUN = process.argv.includes("--dry-run");
const SINGLE_SLUG = (() => {
  const i = process.argv.indexOf("--slug");
  return i !== -1 ? process.argv[i + 1] : null;
})();

async function main() {
  const summary = await runSourceValidation({ dryRun: DRY_RUN, slug: SINGLE_SLUG });

  console.log(
    `[source-validation] Checking ${summary.processed} law(s)${DRY_RUN ? " (DRY RUN)" : ""}…`,
  );

  for (const result of summary.results) {
    const icon =
      result.status === "ok"
        ? "✓"
        : result.status === "redirect"
          ? "→"
          : result.status === "blocked"
            ? "⊘"
            : result.status === "timeout"
              ? "⏱"
              : result.status === "archived"
                ? "📦"
                : "✗";

    console.log(
      `  ${result.slug}: ${icon} ${result.status} (${result.responseTimeMs}ms${result.httpStatus ? `, HTTP ${result.httpStatus}` : ""})`,
    );
  }

  // Summary
  console.log("\n[source-validation] Summary:");
  for (const [status, count] of Object.entries(summary.counts)) {
    console.log(`  ${status}: ${count}`);
  }

  const broken = summary.results.filter((result) => result.status === "broken" || result.status === "timeout");
  if (broken.length > 0) {
    console.log("\n[source-validation] Broken / timed-out sources:");
    for (const result of broken) {
      console.log(`  ${result.slug}: ${result.url} — ${result.errorMessage ?? result.status}`);
    }
  }

  if (!DRY_RUN) {
    console.log(`\n[source-validation] Results written to database.`);
  }
}

main()
  .catch((e) => {
    console.error("[source-validation] Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
