type MonitoringContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

declare global {
  var __lexforgeSentryInitialized: boolean | undefined;
}

async function getSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

  if (!dsn) {
    return null;
  }

  const Sentry = typeof window === "undefined"
    ? await import("@sentry/node")
    : await import("@sentry/browser");

  if (!globalThis.__lexforgeSentryInitialized) {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: 0.05,
      enabled: true,
    });

    globalThis.__lexforgeSentryInitialized = true;
  }

  return Sentry;
}

export async function captureException(error: unknown, context?: MonitoringContext) {
  const Sentry = await getSentry();

  if (!Sentry) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureException(error);
  });
}

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured log emitter. Writes JSON-structured lines to stdout/stderr
 * and optionally forwards warnings/errors to Sentry as breadcrumbs.
 *
 * @param level  Severity level
 * @param event  Machine-readable event name, e.g. "editorial.approval.recorded"
 * @param context Optional key-value payload to include in the log entry
 */
export function log(
  level: LogLevel,
  event: string,
  context?: Record<string, unknown>,
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV ?? "development",
    ...(context ?? {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }

  // Forward warns and errors to Sentry as breadcrumbs (fire-and-forget)
  if (level === "warn" || level === "error") {
    getSentry()
      .then((Sentry) => {
        if (!Sentry) return;
        Sentry.addBreadcrumb({ category: event, level: level as import("@sentry/nextjs").SeverityLevel, data: context });
      })
      .catch(() => {
        // Swallow Sentry errors so logging never throws
      });
  }
}