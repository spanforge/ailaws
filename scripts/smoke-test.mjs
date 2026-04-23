import { randomUUID } from "node:crypto";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3001";
const cookieJar = new Map();

function updateCookies(response) {
  const setCookies = response.headers.getSetCookie?.() ?? [];

  for (const cookie of setCookies) {
    const [pair] = cookie.split(";");
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    cookieJar.set(name, value);
  }
}

function getCookieHeader() {
  return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  const cookieHeader = getCookieHeader();

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...init,
    headers,
  });

  updateCookies(response);
  return response;
}

async function expectStatus(name, response, expectedStatuses) {
  if (!expectedStatuses.includes(response.status)) {
    const text = await response.text();
    throw new Error(`${name} failed with ${response.status}: ${text}`);
  }
}

async function main() {
  const email = `smoke-${randomUUID()}@example.com`;
  const password = `LaunchReady!42`;

  const publicRoutes = ["/", "/compare", "/penalties", "/timeline", "/guides", "/map", "/glossary", "/login", "/register"];

  for (const route of publicRoutes) {
    const response = await request(route);
    await expectStatus(`GET ${route}`, response, [200]);
  }

  const health = await request("/api/health");
  await expectStatus("GET /api/health", health, [200]);

  const healthJson = await health.json();
  if (healthJson.status !== "ok") {
    throw new Error(`/api/health returned unexpected payload: ${JSON.stringify(healthJson)}`);
  }

  const register = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Smoke Test", email, password }),
  });
  await expectStatus("POST /api/auth/register", register, [201]);

  const csrf = await request("/api/auth/csrf");
  await expectStatus("GET /api/auth/csrf", csrf, [200]);
  const { csrfToken } = await csrf.json();

  const loginBody = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/dashboard`,
    json: "true",
  });

  const login = await request("/api/auth/callback/credentials?json=true", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody.toString(),
  });
  await expectStatus("POST /api/auth/callback/credentials", login, [200, 302]);

  const dashboard = await request("/dashboard");
  await expectStatus("GET /dashboard", dashboard, [200]);

  const assessment = await request("/api/assessments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Smoke Test Assessment",
      company_name: "Smoke Test Co",
      hq_region: "US",
      company_size: "startup",
      industry: "saas",
      target_markets: ["US", "EU"],
      product_type: "saas",
      use_cases: ["general_purpose"],
      deployment_context: "public",
      uses_ai: true,
      uses_biometric_data: false,
      processes_personal_data: true,
      processes_eu_personal_data: true,
      automated_decisions: false,
      risk_self_assessment: "limited",
    }),
  });
  await expectStatus("POST /api/assessments", assessment, [201]);

  const assessmentJson = await assessment.json();
  if (!assessmentJson.id || !Array.isArray(assessmentJson.results)) {
    throw new Error(`/api/assessments returned unexpected payload: ${JSON.stringify(assessmentJson)}`);
  }

  console.log(`Smoke tests passed against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});