# Security Model

## Authentication

LexForge uses **Auth.js v5** (NextAuth) with a credentials provider (email + bcrypt-hashed password). Sessions are JWT-based and stored as HTTP-only cookies.

- Session tokens are signed with `AUTH_SECRET` — keep this secret ≥ 32 chars.
- Passwords are hashed with `bcryptjs` (cost factor 10) before storage.
- The `/api/auth/register` endpoint is rate-limited to prevent brute-force account creation.

## Authorization

All API routes that access user data enforce ownership checks:

- Every route calls `auth()` from Auth.js and returns `401` if no session.
- User-scoped resources (assessments, checklists, saved laws) are queried with `userId: session.user.id` in the WHERE clause — users cannot access other users' data.
- Admin routes (editorial governance, changelog) use a `requireAdmin()` helper that checks `session.user.role === "admin"`.

### Authorization matrix

| Surface | Who can access | Enforcement |
|---|---|---|
| `/api/assessments` `GET` | Signed-in owner | `where: { userId: session.user.id }` |
| `/api/assessments` `POST` | Guest or signed-in user | rate-limited request fingerprint or user id |
| `/api/checklists/:id/items/:itemId` | Assessment owner or assigned org member | assessment ownership chain + assignee validation |
| `/api/evidence/*` | Assessment owner | checklist/assessment ownership lookup |
| `/api/alerts/*` | Signed-in owner | `userId === session.user.id` checks |
| `/api/organizations` `GET` | Signed-in member | membership query scoped by `userId` |
| `/api/organizations` `POST` | Signed-in user | creates owner membership for actor only |
| `/api/organizations/:id/invites` | Org `owner` or `admin` | membership lookup with role allowlist |
| `/api/organizations/:id/integrations` | Org `owner` or `admin` | membership lookup with role allowlist |
| `/api/organizations/invites` accept | Invited signed-in email only | invite email match + expiration + replay guard |
| `/api/admin/*` | Platform admin only | `requireAdmin()` role check |

### Sensitive action auditing

Sensitive admin and organization mutations are persisted to `ActionAuditLog`:

- workspace creation
- workspace invite creation and resend
- workspace invite acceptance and expiration denials
- workspace integration settings changes
- manual admin compliance-alert delivery
- changelog create/delete actions

Read-only access is available at `GET /api/admin/action-audit` for admin users.

## Rate Limiting

In-memory sliding-window rate limiter (`lib/rate-limit.ts`) is applied to:

- `/api/auth/register` — 5 requests / 15 minutes per IP
- `/api/assessments` — 20 requests / minute per user

## Input Validation

- All request bodies are validated before database writes.
- Enum fields (status, priority, reviewStatus, etc.) are validated against allowlists.
- Numeric IDs and slugs are validated as expected types before use in queries.

## OWASP Top 10 Mitigations

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | Per-route ownership checks, `requireAdmin()` for admin routes |
| A02 Cryptographic Failures | bcrypt for passwords, Auth.js JWT signing, HTTPS enforced in prod |
| A03 Injection | Prisma parameterised queries — no raw SQL with user input |
| A04 Insecure Design | Checklist items verify ownership through assessment chain |
| A05 Security Misconfiguration | `validateEnvironment()` at startup; documented env vars |
| A07 Auth Failures | Rate limiting on auth endpoints, session invalidation on logout |
| A09 Logging Failures | Structured `log()` function, request correlation via `x-request-id`, persisted action audit trail, Sentry breadcrumbs for warn/error |

## Secrets Management

- Never commit `.env` or `.env.local` files — they are in `.gitignore`.
- Rotate `AUTH_SECRET` by updating the env var and redeploying. All existing sessions are invalidated.
- Use a secrets manager (e.g. Vercel env, AWS Secrets Manager) for production credentials.

## Dependency Security

```bash
npm audit            # check for known vulnerabilities
npm audit fix        # auto-fix where possible
```

Run `npm audit` before each production deploy and resolve critical/high findings.
