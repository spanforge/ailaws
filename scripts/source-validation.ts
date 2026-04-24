/**
 * Source Validation Script
 *
 * HTTP-validates each law's official_url and persists results to the
 * SourceHealthCheck table in the database. Updates law.sourceHealthStatus
 * and law.sourceCheckedAt accordingly.
 *
 * Usage:
 *   npx tsx scripts/source-validation.ts
 *   npx tsx scripts/source-validation.ts --dry-run   (log only, no DB writes)
 *   npx tsx scripts/source-validation.ts --slug eu-ai-act  (single law)
 */

import { PrismaClient } from "@prisma/client";
import { laws } from "../lib/lexforge-data";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");
const SINGLE_SLUG = (() => {
  const i = process.argv.indexOf("--slug");
  return i !== -1 ? process.argv[i + 1] : null;
})();

const TIMEOUT_MS = 15_000;
const USER_AGENT =
  "LexForge-SourceValidator/1.0 (+https://github.com/your-org/ailaws; contact@example.com)";

type HealthStatus =
  | "ok"
  | "redirect"
  | "broken"
  | "timeout"
  | "blocked"
  | "archived"
  | "content_changed"
  | "unknown";

interface CheckResult {
  slug: string;
  url: string;
  status: HealthStatus;
  httpStatus: number | null;
  redirectUrl: string | null;
  errorMessage: string | null;
  responseTimeMs: number;
}

async function checkUrl(url: string): Promise<Omit<CheckResult, "slug">> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,*/*",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    const responseTimeMs = Date.now() - start;
    const redirected = response.redirected;
    const finalUrl = response.url;

    if (response.ok) {
      // Check for Wayback Machine archive indicators
      const body = await response.text();
      const isArchived =
        finalUrl.includes("web.archive.org") ||
        body.includes("The Wayback Machine") ||
        body.includes("Internet Archive");

      if (isArchived) {
        return {
          url,
          status: "archived",
          httpStatus: response.status,
          redirectUrl: finalUrl !== url ? finalUrl : null,
          errorMessage: null,
          responseTimeMs,
        };
      }

      return {
        url,
        status: redirected ? "redirect" : "ok",
        httpStatus: response.status,
        redirectUrl: redirected && finalUrl !== url ? finalUrl : null,
        errorMessage: null,
        responseTimeMs,
      };
    }

    // 403/429 = likely blocked by bot protection
    if (response.status === 403 || response.status === 429) {
      return {
        url,
        status: "blocked",
        httpStatus: response.status,
        redirectUrl: null,
        errorMessage: `HTTP ${response.status}`,
        responseTimeMs,
      };
    }

    return {
      url,
      status: "broken",
      httpStatus: response.status,
      redirectUrl: null,
      errorMessage: `HTTP ${response.status}`,
      responseTimeMs,
    };
  } catch (err: unknown) {
    const responseTimeMs = Date.now() - start;
    const isTimeout =
      err instanceof Error && (err.name === "AbortError" || err.message.includes("timeout"));

    return {
      url,
      status: isTimeout ? "timeout" : "unknown",
      httpStatus: null,
      redirectUrl: null,
      errorMessage: err instanceof Error ? err.message : String(err),
      responseTimeMs,
    };
  }
}

async function main() {
  const targetLaws = SINGLE_SLUG
    ? laws.filter((l) => l.slug === SINGLE_SLUG)
    : laws;

  if (targetLaws.length === 0) {
    console.error(`No law found for slug: ${SINGLE_SLUG}`);
    process.exit(1);
  }

  console.log(
    `[source-validation] Checking ${targetLaws.length} law(s)${DRY_RUN ? " (DRY RUN)" : ""}…`,
  );

  const results: CheckResult[] = [];

  for (const law of targetLaws) {
    process.stdout.write(`  Checking ${law.slug} — ${law.official_url} … `);
    const checkResult = await checkUrl(law.official_url);
    const result: CheckResult = { slug: law.slug, ...checkResult };
    results.push(result);

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
      `${icon} ${result.status} (${result.responseTimeMs}ms${result.httpStatus ? `, HTTP ${result.httpStatus}` : ""})`,
    );

    if (!DRY_RUN) {
      const checkedAt = new Date();

      try {
        // Find the law in DB by slug
        const dbLaw = await prisma.law.findFirst({ where: { slug: law.slug }, select: { id: true } });

        if (dbLaw) {
          // Persist SourceHealthCheck record
          await prisma.sourceHealthCheck.create({
            data: {
              lawId: dbLaw.id,
              checkedUrl: result.url,
              status: result.status,
              httpStatus: result.httpStatus,
              redirectUrl: result.redirectUrl,
              errorMessage: result.errorMessage,
              responseTimeMs: result.responseTimeMs,
              checkedAt,
            },
          });

          // Update law's cached health fields
          await prisma.law.update({
            where: { id: dbLaw.id },
            data: {
              sourceHealthStatus: result.status,
              sourceCheckedAt: checkedAt,
              ...(result.redirectUrl ? { sourceArchiveUrl: result.redirectUrl } : {}),
            },
          });
        }
      } catch (e) {
        console.error(`    DB write failed for ${law.slug}:`, e);
      }
    }
  }

  // Summary
  console.log("\n[source-validation] Summary:");
  const byStatus: Record<string, number> = {};
  for (const r of results) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status}: ${count}`);
  }

  const broken = results.filter((r) => r.status === "broken" || r.status === "timeout");
  if (broken.length > 0) {
    console.log("\n[source-validation] Broken / timed-out sources:");
    for (const r of broken) {
      console.log(`  ${r.slug}: ${r.url} — ${r.errorMessage ?? r.status}`);
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
