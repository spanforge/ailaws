/**
 * Next.js instrumentation hook.
 * Runs once at server startup (before any request is served).
 * Used for environment validation and Sentry SDK initialization.
 */
export async function register() {
  // Only run on the Node.js server, not in the Edge runtime or client bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Validate required environment variables at startup.
  const { validateEnvironment } = await import("@/lib/env-validation");
  validateEnvironment();
}
