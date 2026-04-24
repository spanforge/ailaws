/**
 * Startup environment validation.
 * Call this from instrumentation.ts or the top of any server entrypoint.
 * Throws with a descriptive message if required environment variables are missing.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  { name: "DATABASE_URL", required: true, description: "Prisma database connection URL" },
  { name: "AUTH_SECRET", required: true, description: "NextAuth secret for JWT signing (≥32 chars)" },
  { name: "NEXTAUTH_URL", required: false, description: "Public URL of the application (set in production)" },
  { name: "AUTH_GOOGLE_CLIENT_ID", required: false, description: "Google OAuth client id for optional SSO" },
  { name: "AUTH_GOOGLE_CLIENT_SECRET", required: false, description: "Google OAuth client secret for optional SSO" },
  { name: "AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID", required: false, description: "Microsoft Entra client id for optional SSO" },
  { name: "AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET", required: false, description: "Microsoft Entra client secret for optional SSO" },
  { name: "AUTH_MICROSOFT_ENTRA_ID_TENANT_ID", required: false, description: "Microsoft Entra tenant id for optional SSO" },
  { name: "AUTH_VERIFICATION_FROM_EMAIL", required: false, description: "Verified sender for email verification messages" },
  { name: "RESEND_API_KEY", required: false, description: "Resend API key for email verification delivery" },
  { name: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry DSN for error monitoring" },
  { name: "SENTRY_AUTH_TOKEN", required: false, description: "Sentry auth token for source-map uploads" },
  { name: "AI_ASSISTANT_API_URL", required: false, description: "Chat-completions endpoint for optional LLM-backed intake assistance" },
  { name: "AI_ASSISTANT_API_KEY", required: false, description: "API key for the optional assistant model endpoint" },
  { name: "AI_ASSISTANT_MODEL", required: false, description: "Optional model name sent to the assistant endpoint when required" },
  { name: "AI_ASSISTANT_API_KEY_HEADER", required: false, description: "Optional auth header name for the assistant endpoint (default: authorization)" },
  { name: "AI_ASSISTANT_AUTH_SCHEME", required: false, description: "Optional auth scheme for Authorization header (default: Bearer)" },
];

export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    const val = process.env[v.name];
    if (!val) {
      if (v.required) {
        missing.push(`  ${v.name}: ${v.description}`);
      } else {
        warnings.push(`  ${v.name} (optional): ${v.description}`);
      }
    }
  }

  // Special: AUTH_SECRET should be at least 32 characters
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length < 32) {
    missing.push("  AUTH_SECRET: must be at least 32 characters long");
  }

  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_CLIENT_SECRET);
  if (googleConfigured && !(process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET)) {
    missing.push("  AUTH_GOOGLE_CLIENT_ID / AUTH_GOOGLE_CLIENT_SECRET: both must be set to enable Google SSO");
  }

  const entraConfigured = Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID ||
    process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET ||
    process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
  );
  if (
    entraConfigured &&
    !(
      process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
    )
  ) {
    missing.push(
      "  AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID / AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET / AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: all must be set to enable Microsoft Entra SSO",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    !(process.env.RESEND_API_KEY && process.env.AUTH_VERIFICATION_FROM_EMAIL)
  ) {
    warnings.push("  RESEND_API_KEY + AUTH_VERIFICATION_FROM_EMAIL (recommended): required for credential-signup email verification in production");
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      "[lexforge] Optional environment variables not set:\n" + warnings.join("\n"),
    );
  }

  if (missing.length > 0) {
    throw new Error(
      "[lexforge] Required environment variables are missing or invalid:\n" +
        missing.join("\n") +
        "\n\nSee docs/env-reference.md for configuration instructions.",
    );
  }
}
