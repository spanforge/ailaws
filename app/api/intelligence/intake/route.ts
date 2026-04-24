import { NextRequest, NextResponse } from "next/server";
import { buildRateLimitHeaders, getRequestFingerprint, takeRateLimit } from "@/lib/rate-limit";
import { buildIntakeAssistantWithLLM } from "@/lib/ai-assistant";
import type { AssessmentInput } from "@/lib/rules-engine";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimit = takeRateLimit({
    key: `intake-assistant:${getRequestFingerprint(request)}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
    label: "intake-assistant",
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many assistant requests. Please wait a moment and try again." },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  let body: AssessmentInput;
  try {
    body = (await request.json()) as AssessmentInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const assistant = await buildIntakeAssistantWithLLM(body);
  return NextResponse.json(assistant, { headers: buildRateLimitHeaders(rateLimit) });
}