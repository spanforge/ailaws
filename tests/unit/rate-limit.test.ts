import { describe, it, expect } from "vitest";
import { takeRateLimit, getRequestFingerprint } from "@/lib/rate-limit";

describe("takeRateLimit", () => {
  it("allows the first request", () => {
    const result = takeRateLimit({ key: `test:${Date.now()}`, limit: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks after limit is exceeded", () => {
    const key = `test-block:${Date.now()}`;
    const opts = { key, limit: 3, windowMs: 60000 };
    takeRateLimit(opts);
    takeRateLimit(opts);
    takeRateLimit(opts);
    const fourth = takeRateLimit(opts);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("each key is independent", () => {
    const t = Date.now();
    const r1 = takeRateLimit({ key: `key-a:${t}`, limit: 2, windowMs: 60000 });
    const r2 = takeRateLimit({ key: `key-b:${t}`, limit: 2, windowMs: 60000 });
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.remaining).toBe(1);
  });

  it("returns resetAt in the future", () => {
    const result = takeRateLimit({ key: `reset-check:${Date.now()}`, limit: 5, windowMs: 60000 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});

describe("getRequestFingerprint", () => {
  it("returns anonymous for null input", () => {
    expect(getRequestFingerprint(null)).toBe("anonymous");
  });

  it("returns a string for a Headers object", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4", "user-agent": "test-agent" });
    const fp = getRequestFingerprint(headers);
    expect(typeof fp).toBe("string");
    expect(fp).toContain("1.2.3.4");
  });
});
