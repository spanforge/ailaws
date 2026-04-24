import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const scope = searchParams.get("scope");
  const actorId = searchParams.get("actorId");
  const organizationId = searchParams.get("organizationId");
  const status = searchParams.get("status");
  const actionType = searchParams.get("actionType");

  const where: Record<string, unknown> = {};
  if (scope) where.scope = scope;
  if (actorId) where.actorId = actorId;
  if (organizationId) where.organizationId = organizationId;
  if (status) where.status = status;
  if (actionType) where.actionType = actionType;

  const [entries, total] = await Promise.all([
    prisma.actionAuditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.actionAuditLog.count({ where }),
  ]);

  return NextResponse.json({
    data: entries.map((entry) => ({
      ...entry,
      metadata: entry.metadataJson ? JSON.parse(entry.metadataJson) : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}