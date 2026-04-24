import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureException, log } from "@/lib/monitoring";
import { withRequestId } from "@/lib/request-context";
import { normalizeSystemChangeEvent } from "@/lib/system-change-events";

function isAuthorized(req: NextRequest) {
  const secret = process.env.INTEGRATION_WEBHOOK_SECRET;
  if (!secret) return false;

  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${secret}`) return true;

  return req.headers.get("x-integration-secret") === secret;
}

function buildFingerprint(body: {
  source: string;
  eventType: string;
  environment?: string | null;
  ref?: string | null;
  commitSha?: string | null;
  occurredAt: string;
}) {
  return [
    body.source,
    body.eventType,
    body.environment ?? "",
    body.ref ?? "",
    body.commitSha ?? "",
    body.occurredAt,
  ].join(":");
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const normalized = normalizeSystemChangeEvent({
    headers: req.headers,
    body,
  });

  if (!normalized) {
    return NextResponse.json({ error: "Unsupported integration payload or missing required fields" }, { status: 400 });
  }

  const occurredAt = new Date(normalized.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 });
  }

  const fingerprint = buildFingerprint({
    source: normalized.source,
    eventType: normalized.eventType,
    environment: normalized.environment ?? null,
    ref: normalized.ref ?? null,
    commitSha: normalized.commitSha ?? null,
    occurredAt: occurredAt.toISOString(),
  });

  try {
    const event = await prisma.systemChangeEvent.upsert({
      where: { fingerprint },
      update: {
        title: normalized.title,
        summary: normalized.summary,
        actor: normalized.actor ?? null,
        metadataJson: JSON.stringify({
          recommendation: normalized.recommendation ?? null,
          ...(normalized.metadata ?? {}),
        }),
      },
      create: {
        source: normalized.source,
        eventType: normalized.eventType,
        environment: normalized.environment ?? null,
        title: normalized.title,
        summary: normalized.summary,
        ref: normalized.ref ?? null,
        commitSha: normalized.commitSha ?? null,
        actor: normalized.actor ?? null,
        fingerprint,
        metadataJson: JSON.stringify({
          recommendation: normalized.recommendation ?? null,
          ...(normalized.metadata ?? {}),
        }),
        occurredAt,
      },
    });

    log("info", "integrations.ci_event.recorded", {
      source: event.source,
      eventType: event.eventType,
      environment: event.environment,
      recommendation: normalized.recommendation,
      id: event.id,
      ...withRequestId(req),
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    await captureException(error, {
      tags: { surface: "integrations", action: "record-ci-event" },
      extra: { source: normalized.source, eventType: normalized.eventType },
    });
    return NextResponse.json({ error: "Unable to record system change event" }, { status: 500 });
  }
}
