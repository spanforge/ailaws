# LexForge Environment Variables Reference

All variables should be set in `.env.local` (development) or via your hosting platform's secrets manager (production).

---

## Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Prisma connection URL for your database | `file:./dev.db` (SQLite) or `postgresql://user:pass@host/db` |
| `AUTH_SECRET` | NextAuth.js secret used to sign JWTs and cookies. Must be ≥ 32 characters random string. | `openssl rand -base64 32` |

---

## Recommended in Production

| Variable | Description | Example |
|---|---|---|
| `NEXTAUTH_URL` | Public canonical URL of your deployment. Required for OAuth redirects. | `https://lexforge.example.com` |
| `RESEND_API_KEY` | API key used to deliver email verification messages for credential signups. | `re_xxxxxxxxx` |
| `AUTH_VERIFICATION_FROM_EMAIL` | Verified sender address used for verification emails. | `Spanforge Compass <auth@yourdomain.com>` |
| `AUTH_ALERTS_FROM_EMAIL` | Optional sender address for regulatory watchlist emails. Falls back to `AUTH_VERIFICATION_FROM_EMAIL` when omitted. | `Spanforge Compass Alerts <alerts@yourdomain.com>` |
| `AUTH_WORKSPACE_FROM_EMAIL` | Optional sender address for workspace creation and invite emails. Falls back to `AUTH_VERIFICATION_FROM_EMAIL` when omitted. | `Spanforge Compass Workspace <workspace@yourdomain.com>` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Data Source Name for client-side error capture. | `https://xxx@sentry.io/12345` |
| `SENTRY_DSN` | Sentry DSN for server-side error capture (can match above). | `https://xxx@sentry.io/12345` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source-map upload during build. | Obtain from Sentry project settings |
| `SENTRY_ORG` | Your Sentry organisation slug. | `acme-corp` |
| `SENTRY_PROJECT` | Your Sentry project slug. | `lexforge` |

---

## Optional SSO Providers

### Google

| Variable | Description | Example |
|---|---|---|
| `AUTH_GOOGLE_CLIENT_ID` | Google OAuth client id. | `1234567890-abc.apps.googleusercontent.com` |
| `AUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret. | `GOCSPX-...` |

### Microsoft Entra ID

| Variable | Description | Example |
|---|---|---|
| `AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID` | Entra application client id. | `00000000-0000-0000-0000-000000000000` |
| `AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET` | Entra application client secret. | `secret-value` |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Tenant id used to build the issuer URL. | `11111111-1111-1111-1111-111111111111` |

SSO buttons appear automatically on the login and registration pages when these variables are configured.

---

## Credential Signup and Verification

Credential-based signups now require email verification before the user can sign in.

In development, if `RESEND_API_KEY` and `AUTH_VERIFICATION_FROM_EMAIL` are not set, the app returns a local verification link after registration so the flow remains testable.

In production, configure both values before enabling credential signup.

Regulatory watchlist emails also use `RESEND_API_KEY`. If `AUTH_ALERTS_FROM_EMAIL` is not set, watchlist delivery uses `AUTH_VERIFICATION_FROM_EMAIL`.

Workspace creation confirmations and workspace invite emails also use `RESEND_API_KEY`. If `AUTH_WORKSPACE_FROM_EMAIL` is not set, workspace delivery uses `AUTH_VERIFICATION_FROM_EMAIL`.

---

## Generating Secrets

```bash
# Generate AUTH_SECRET
openssl rand -base64 32
```

---

## SQLite → PostgreSQL Migration

When moving from SQLite to PostgreSQL:

1. Update `DATABASE_URL` to a Postgres connection string.
2. Update `prisma/schema.prisma`: change `provider = "sqlite"` → `provider = "postgresql"`.
3. Run `npx prisma migrate deploy` to apply migrations.
4. Run `npm run db:seed` to re-seed initial data.
