import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
}

// GET /api/admin/editorial/audit-log
// Returns paginated audit log for all law/obligation field changes.
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");
  const actorId = searchParams.get("actorId");
  const format = searchParams.get("format");

  const where: Record<string, unknown> = {};
  if (entityId) where.entityId = entityId;
  if (entityType) where.entityType = entityType;
  if (actorId) where.actorId = actorId;

  const [entries, total] = await Promise.all([
    prisma.contentEditAuditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contentEditAuditLog.count({ where }),
  ]);

  if (format === "csv") {
    const rows = [
      ["createdAt", "entityType", "entityId", "fieldName", "oldValue", "newValue", "changeReason", "actorName", "actorEmail"],
      ...entries.map((entry) => [
        entry.createdAt.toISOString(),
        entry.entityType,
        entry.entityId,
        entry.fieldName,
        entry.oldValue ?? "",
        entry.newValue ?? "",
        entry.changeReason ?? "",
        entry.actor?.name ?? "",
        entry.actor?.email ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="editorial-audit-log.csv"',
      },
    });
  }

  return NextResponse.json({
    data: entries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
