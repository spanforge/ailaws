# Deployment Guide

## Prerequisites

- Node.js 20+
- A PostgreSQL database (recommended for production) or SQLite (development only)
- Environment variables configured — see [env-reference.md](env-reference.md)

## Build

```bash
npm install
npm run db:migrate      # applies all Prisma migrations
npx prisma db seed      # seeds law and reference data (first deploy only)
npm run build           # Next.js production build
npm start               # starts production server on port 3000
```

## Vercel (recommended)

1. Push to your Git remote.
2. Import the repository into Vercel.
3. Set environment variables in the Vercel project settings (see `docs/env-reference.md`).
4. Set the **Build Command** to: `npm run db:migrate && npm run build`
5. Set the **Output Directory** to: `.next`

Vercel will run migrations automatically before each deployment.

## Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

## Database

### SQLite (development)

```
DATABASE_URL="file:./dev.db"
```

Run `npm run db:migrate` to apply migrations. The database file is at `prisma/dev.db`.

### PostgreSQL (production)

```
DATABASE_URL="postgresql://user:password@host:5432/lexforge"
```

Migrations are idempotent — safe to run `npx prisma migrate deploy` on every deploy.

## First Deploy Checklist

- [ ] `DATABASE_URL` points to an empty or migrated database
- [ ] `AUTH_SECRET` is set to a cryptographically random string ≥ 32 chars
- [ ] `NEXTAUTH_URL` matches the public URL (e.g. `https://app.example.com`)
- [ ] Run `npx prisma db seed` to load law data
- [ ] Run `npm run make-admin -- --email admin@example.com` to create the first admin user
- [ ] Optionally set `NEXT_PUBLIC_SENTRY_DSN` for error tracking

## Promoting a User to Admin

```bash
npx tsx scripts/make-admin.ts --email user@example.com
```

## Source URL Validation

Run periodically to verify all law official URLs are live:

```bash
npm run source:validate
```

Results are written to the `SourceHealthCheck` table and reflected as `sourceHealthStatus` on each law.
