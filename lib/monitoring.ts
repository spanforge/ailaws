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