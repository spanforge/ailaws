type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  label?: string;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

declare global {
  var __lexforgeRateLimitStore: Map<string, RateLimitRecord> | undefined;
  var __lexforgeRateLimitMetrics: Map<string, { attempts: number; blocked: number; lastSeenAt: number; maxLimit: number; windowMs: number }> | undefined;
}

const store = globalThis.__lexforgeRateLimitStore ?? new Map<string, RateLimitRecord>();
const metrics = globalThis.__lexforgeRateLimitMetrics ?? new Map<string, { attempts: number; blocked: number; lastSeenAt: number; maxLimit: number; windowMs: number }>();

if (!globalThis.__lexforgeRateLimitStore) {
  globalThis.__lexforgeRateLimitStore = store;
}

if (!globalThis.__lexforgeRateLimitMetrics) {
  globalThis.__lexforgeRateLimitMetrics = metrics;
}

function getMetricLabel(input: RateLimitOptions) {
  return input.label ?? (input.key.split(":").slice(0, 2).join(":") || input.key);
}

function recordMetric(input: RateLimitOptions, blocked: boolean, now: number) {
  const label = getMetricLabel(input);
  const current = metrics.get(label) ?? {
    attempts: 0,
    blocked: 0,
    lastSeenAt: now,
    maxLimit: input.limit,
    windowMs: input.windowMs,
  };

  current.attempts += 1;
  current.lastSeenAt = now;
  current.maxLimit = input.limit;
  current.windowMs = input.windowMs;
  if (blocked) {
    current.blocked += 1;
  }

  metrics.set(label, current);
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getRequestFingerprint(input: Request | Headers | null | undefined) {
  const headers = input instanceof Request ? input.headers : input;

  if (!headers) {
    return "anonymous";
  }

  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const userAgent = headers.get("user-agent")?.slice(0, 80) ?? "unknown-agent";
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown-ip";

  return `${ip}:${userAgent}`;
}

export function takeRateLimit({ key, limit, windowMs, label }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);
  const options = { key, limit, windowMs, label };

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextRecord = {
      count: 1,
      resetAt: now + windowMs,
    };

    store.set(key, nextRecord);
  recordMetric(options, false, now);

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      resetAt: nextRecord.resetAt,
    };
  }

  if (existing.count >= limit) {
    recordMetric(options, true, now);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);
  recordMetric(options, false, now);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    resetAt: existing.resetAt,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function getRateLimitMetricsSnapshot() {
  return [...metrics.entries()]
    .map(([label, metric]) => ({ label, ...metric }))
    .sort((left, right) => right.blocked - left.blocked || right.attempts - left.attempts);
}