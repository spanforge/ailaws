# Testing Guide

## Overview

LexForge uses **Vitest 4** for unit, integration, and smoke tests. Tests live in `tests/`.

```
tests/
  integration/
    ci-events-route.test.ts
    cron-source-validation-route.test.ts
  unit/
    rules-engine.test.ts   # 17 tests — rules engine logic
    lexforge-data.test.ts  # 17 tests — law data integrity
    rate-limit.test.ts     # 6 tests — rate limiter behaviour
  smoke/
    smoke.test.ts          # 6 tests — critical path integration
```

## Running Tests

```bash
npm test                  # run all tests once
npm run test:integration  # route-level integration tests
npm run test:unit         # unit tests only
npm run test:smoke        # smoke tests only
npm run test:watch        # watch mode (re-runs on file change)
npm run test:coverage     # generate coverage report
```

## Writing Tests

Tests use the Vitest API (`describe`, `it`, `expect`). Path alias `@/` resolves to the workspace root.

### Unit test example

```ts
import { describe, it, expect } from "vitest";
import { runRulesEngine } from "@/lib/rules-engine";
import { laws } from "@/lib/lexforge-data";

describe("runRulesEngine", () => {
  it("returns a result for every law", () => {
    const results = runRulesEngine(laws, { /* input */ });
    expect(results).toHaveLength(laws.length);
  });
});
```

### Smoke test conventions

Smoke tests in `tests/smoke/` verify end-to-end critical paths using real production code (no mocks). They should:

- Cover the happy path only (leave error cases for unit tests).
- Run in under 5 seconds total.
- Not require a database or network connection.

### Integration test conventions

Integration tests in `tests/integration/` should:

- exercise a real route module or service boundary
- mock only external infrastructure edges such as Prisma, mail, or network delivery
- assert auth, input validation, and the primary side effect for the route under test

## CI Integration

The repository CI pipeline already runs:

```yaml
- name: Type check
  run: npm run typecheck

- name: Unit tests
  run: npm run test:unit

- name: Integration tests
  run: npm run test:integration

- name: Smoke tests
  run: npm run test:smoke
```

## Test Coverage Goals

| Area | Target |
|---|---|
| Rules engine logic | 90%+ |
| Law data integrity | 100% (all laws have required fields) |
| Rate limiter | 100% |
| API routes | Integration coverage for critical routes + smoke coverage |

## Debugging Failing Tests

Run a single test file:

```bash
npx vitest run tests/unit/rules-engine.test.ts
```

Run tests matching a name pattern:

```bash
npx vitest run -t "EU AI Act"
```

Enable verbose output:

```bash
npx vitest run --reporter=verbose
```
