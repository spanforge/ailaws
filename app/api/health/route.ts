import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}