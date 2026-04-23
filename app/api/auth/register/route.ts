import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { captureException } from "@/lib/monitoring";
import { buildRateLimitHeaders, getRequestFingerprint, takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rateLimit = takeRateLimit({
    key: `auth:register:${getRequestFingerprint(req)}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again shortly." },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, name } = (body ?? {}) as {
    email?: string;
    password?: string;
    name?: string;
  };

  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const normalizedName = name?.trim() || null;

  if (!normalizedEmail || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // bcrypt truncates input after 72 bytes, so reject longer passwords explicitly.
  if (password.length > 72) {
    return NextResponse.json({ error: "Password must be 72 characters or fewer" }, { status: 400 });
  }

  if (normalizedEmail.length > 320) {
    return NextResponse.json({ error: "Email address is too long" }, { status: 400 });
  }

  if (normalizedName && normalizedName.length > 80) {
    return NextResponse.json({ error: "Name must be 80 characters or fewer" }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed, name: normalizedName },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    await captureException(error, {
      tags: { surface: "auth", action: "register" },
      extra: { email: normalizedEmail },
    });
    return NextResponse.json({ error: "Unable to create account right now" }, { status: 500 });
  }
}
