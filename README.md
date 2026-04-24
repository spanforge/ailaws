# LexForge

LexForge is a production-grade AI regulation intelligence platform for software teams. It helps you discover which AI laws apply to your product, assess your obligations, track compliance posture, and generate actionable work items.

## Architecture

- **Framework**: Next.js 15 (App Router, React 19)
- **Auth**: Auth.js v5 (credentials provider, session-based)
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma 5
- **Observability**: Sentry + structured logging (`lib/monitoring.ts`)
- **Testing**: Vitest 4 (unit + smoke tests)

## Quick Start

```bash
npm install
npm run db:migrate      # apply Prisma migrations
npx prisma db seed      # seed law data
npm run dev             # start dev server at http://localhost:3000
```

## Environment Variables

See [docs/env-reference.md](docs/env-reference.md) for the full list. Required variables:

```
DATABASE_URL=          # Prisma connection string
AUTH_SECRET=           # >= 32 characters, random secret for Auth.js
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply pending Prisma migrations |
| `npm run typecheck` | TypeScript type-check |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:smoke` | Run smoke tests only |
| `npm run source:validate` | Validate official law URLs |
| `npm run make-admin` | Promote a user to admin |

## Documentation

- [docs/env-reference.md](docs/env-reference.md) — Environment variable reference
- [docs/deployment.md](docs/deployment.md) — Deployment guide
- [docs/security.md](docs/security.md) — Security model
- [docs/testing.md](docs/testing.md) — Testing guide
- [docs/content-ops.md](docs/content-ops.md) — Adding/updating law content
- [docs/runbooks/database-restore.md](docs/runbooks/database-restore.md) — Database backup & restore
- [docs/runbooks/incident-response.md](docs/runbooks/incident-response.md) — Incident response

## Key Features

- **30+ AI laws** across 15+ jurisdictions with sourced provenance metadata
- **Rules engine** (versioned, traceable) that scores laws against your product profile
- **Assessment wizard** with SMB-tuned output: action plans, obligations, checklist generation
- **Editorial governance** — review queue, approval workflow, audit log
- **Source integrity checks** — automated HTTP validation of official law URLs
- **Workspace intelligence** — clause gap analysis, drift triggers, trust scorecard
- **Evidence package export** — PDF-ready compliance evidence bundles
- **WCAG-aligned accessibility** — skip-to-content, focus-visible, prefers-reduced-motion

## License

See [LICENSE](LICENSE).
