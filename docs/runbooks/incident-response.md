# Incident Response Runbook

## Severity Levels

| Level | Description | Response Time |
|---|---|---|
| SEV1 | Complete outage, data loss, or security breach | Immediate (< 15 min) |
| SEV2 | Significant feature degraded, elevated error rate | < 1 hour |
| SEV3 | Non-critical feature degraded | < 4 hours |
| SEV4 | Minor issue, cosmetic, or low-impact | Next business day |

---

## Initial Triage Checklist

1. Check application health endpoint: `GET /api/health`
2. Check Sentry for recent exceptions and error spikes.
3. Check hosting platform metrics (CPU, memory, request latency).
4. Review recent deployments — was a deployment made in the last 30 minutes?
5. Check database connectivity and query performance.

---

## Common Scenarios

### Application returning 500 errors

1. Check Sentry for the root exception and stack trace.
2. Check server logs for structured JSON log entries with `"level":"error"`.
3. If database-related: check `DATABASE_URL` is set and DB is reachable.
4. If auth-related: check `AUTH_SECRET` is set correctly.
5. Roll back the last deployment if the issue coincides with a release.

### Database unresponsive

1. Verify DB server is running and accepting connections.
2. Check connection pool limits — high traffic may exhaust connections.
3. For SQLite: check disk space on the server.
4. For PostgreSQL: check `pg_stat_activity` for long-running/blocking queries.
5. If data corruption: restore from the latest backup (see `database-restore.md`).

### Elevated error rate from rules engine

1. Check `assessment_results.rulesEngineVersion` to identify the engine version in production.
2. Run the rules engine unit tests: `npm run test:unit -- tests/unit/rules-engine.test.ts`
3. Check `evaluation_trace` fields in recent assessment records for anomalies.

### Security incident (suspected breach)

1. **Immediately** rotate `AUTH_SECRET` and force all sessions to expire.
2. Review access logs for unusual patterns (IPs, user agents, endpoints hit).
3. Check admin audit log: `GET /api/admin/editorial/audit-log`
4. Notify affected users per your data breach policy.
5. Document timeline and actions taken.

---

## Post-Incident Review

After resolving any SEV1 or SEV2:

1. Write a post-mortem (timeline, root cause, action items).
2. Add a regression test to prevent recurrence.
3. Update this runbook with lessons learned.
