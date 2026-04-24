import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncAndDeliverComplianceAlertsForUser } from "@/lib/compliance-alerts";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncAndDeliverComplianceAlertsForUser(session.user.id);
  return NextResponse.json({ ok: true, ...result });
}
