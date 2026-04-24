import { laws } from "@/lib/lexforge-data";
import { prisma } from "@/lib/prisma";

export type SourceHealthStatus =
  | "ok"
  | "redirect"
  | "broken"
  | "timeout"
  | "blocked"
  | "archived"
  | "content_changed"
  | "unknown";

export interface SourceValidationResult {
  slug: string;
  url: string;
  status: SourceHealthStatus;
  httpStatus: number | null;
  redirectUrl: string | null;
  errorMessage: string | null;
  responseTimeMs: number;
}

export interface RunSourceValidationOptions {
  dryRun?: boolean;
  slug?: string | null;
  userAgent?: string;
}

export interface RunSourceValidationSummary {
  processed: number;
  results: SourceValidationResult[];
  counts: Record<string, number>;
}

const TIMEOUT_MS = 15_000;
const DEFAULT_USER_AGENT =
  "LexForge-SourceValidator/1.0 (+https://github.com/your-org/ailaws; contact@example.com)";

function shouldDowngradeConfidence(status: SourceHealthStatus) {
  return status === "blocked" || status === "broken" || status === "timeout" || status === "unknown";
}

async function checkUrl(url: string, userAgent: string): Promise<Omit<SourceValidationResult, "slug">> {
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
          "User-Agent": userAgent,
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
  } catch (error: unknown) {
    const responseTimeMs = Date.now() - start;
    const isTimeout =
      error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"));

    return {
      url,
      status: isTimeout ? "timeout" : "unknown",
      httpStatus: null,
      redirectUrl: null,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs,
    };
  }
}

async function persistSourceValidationResult(result: SourceValidationResult) {
  const checkedAt = new Date();
  const law = await prisma.law.findFirst({
    where: { slug: result.slug },
    select: {
      id: true,
      reviewStatus: true,
      confidenceLevel: true,
      sourceArchiveUrl: true,
    },
  });

  if (!law) {
    return;
  }

  const nextConfidenceLevel = shouldDowngradeConfidence(result.status)
    ? law.confidenceLevel === "high"
      ? "medium"
      : "low"
    : law.confidenceLevel;

  const nextReviewStatus = shouldDowngradeConfidence(result.status) || result.status === "archived"
    ? law.reviewStatus === "archived" || law.reviewStatus === "superseded"
      ? law.reviewStatus
      : "needs_review"
    : law.reviewStatus;

  await prisma.$transaction([
    prisma.sourceHealthCheck.create({
      data: {
        lawId: law.id,
        checkedUrl: result.url,
        status: result.status,
        httpStatus: result.httpStatus,
        redirectUrl: result.redirectUrl,
        errorMessage: result.errorMessage,
        responseTimeMs: result.responseTimeMs,
        checkedAt,
      },
    }),
    prisma.law.update({
      where: { id: law.id },
      data: {
        sourceHealthStatus: result.status,
        sourceCheckedAt: checkedAt,
        sourceArchiveUrl: result.redirectUrl ?? law.sourceArchiveUrl,
        reviewStatus: nextReviewStatus,
        confidenceLevel: nextConfidenceLevel,
      },
    }),
  ]);
}

export async function runSourceValidation(
  options: RunSourceValidationOptions = {},
): Promise<RunSourceValidationSummary> {
  const targetLaws = options.slug ? laws.filter((law) => law.slug === options.slug) : laws;

  if (targetLaws.length === 0) {
    throw new Error(`No law found for slug: ${options.slug}`);
  }

  const results: SourceValidationResult[] = [];
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  for (const law of targetLaws) {
    const result = {
      slug: law.slug,
      ...(await checkUrl(law.official_url, userAgent)),
    };

    results.push(result);

    if (!options.dryRun) {
      await persistSourceValidationResult(result);
    }
  }

  const counts = results.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.status] = (accumulator[result.status] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    processed: results.length,
    results,
    counts,
  };
}