# Database Backup & Restore Runbook

## Overview

LexForge uses Prisma with SQLite (development) or PostgreSQL (production). This runbook covers backup, restore, and recovery procedures.

---

## SQLite (Development / Single-Server)

### Backup

```bash
# Backup the database file
cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)
```

### Restore

```bash
# Stop the application first, then restore
cp prisma/dev.db.bak-<timestamp> prisma/dev.db
```

---

## PostgreSQL (Production)

### Automated Backup (pg_dump)

```bash
pg_dump -Fc $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).pgdump
```

Store backups in a separate storage location (e.g., S3, Azure Blob, GCS).  
**Target RPO**: 24 hours. **Target RTO**: 1 hour.

### Restore from pg_dump

```bash
# 1. Create a new empty database
createdb lexforge_restore

# 2. Restore
pg_restore -d lexforge_restore backup-<timestamp>.pgdump

# 3. Update DATABASE_URL to point to the restored database
# 4. Restart the application
```

### Restore drill discipline

Run a restore drill at least once per quarter:

1. Restore the latest backup into a non-production database.
2. Run the integrity checks below.
3. Start the app against the restored database and verify `/api/health`.
4. Record the restore timestamp, operator, backup artifact used, and result.

### Verifying Restore Integrity

```bash
# Check law count matches expected
psql $DATABASE_URL -c "SELECT COUNT(*) FROM laws;"

# Check user count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Check latest migration applied
psql $DATABASE_URL -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;"
```

---

## Migration Runbook

### Before Applying a Migration

1. **Back up the database** (see above).
2. Run `npx prisma migrate diff` to preview SQL changes.
3. Test the migration on a staging database first.
4. Announce a maintenance window if the migration alters large tables.

### Applying a Migration

```bash
# Apply all pending migrations
npm run db:migrate
# or
npx prisma migrate deploy
```

### Rolling Back a Migration

Prisma does not support automatic rollbacks. To roll back:

1. Restore the pre-migration backup.
2. Remove the migration folder from `prisma/migrations/`.
3. Run `npx prisma migrate resolve --rolled-back <migration_name>` if needed.
4. Fix the migration and re-apply.

### Deployment rollback checklist

1. Confirm the target pre-change backup artifact exists.
2. Stop writes to the application.
3. Restore the backup into the rollback target database.
4. Point `DATABASE_URL` at the restored database.
5. Redeploy the last known good application build.
6. Run verification checks for health, latest migration record, law count, and a sample authenticated workflow.

---

## Emergency Contacts

- Primary DBA / On-call: (add your contact here)
- Hosting provider status: (add link)
- Incident response runbook: `docs/runbooks/incident-response.md`
