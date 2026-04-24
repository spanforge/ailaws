import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureException } from "@/lib/monitoring";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  isEmailVerificationDeliveryConfigured,
  normalizeCallbackUrl,
  sendVerificationEmail,
} from "@/lib/auth-verification";

export async function POST(request: NextRequest) {
  let body: { email?: string; callbackUrl?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true, message: "If an unverified account exists, a fresh verification email has been sent." });
  }

  if (process.env.NODE_ENV === "production" && !isEmailVerificationDeliveryConfigured()) {
    return NextResponse.json({ error: "Verification delivery is not configured. Set RESEND_API_KEY and AUTH_VERIFICATION_FROM_EMAIL." }, { status: 503 });
  }

  const verification = createEmailVerificationToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationTokenHash: verification.tokenHash,
      verificationTokenExpiresAt: verification.expiresAt,
    },
  });

  const verifyUrl = buildEmailVerificationUrl(verification.token, normalizeCallbackUrl(body.callbackUrl));

  try {
    const delivery = await sendVerificationEmail({
      email,
      name: user.name,
      verifyUrl,
    });

    return NextResponse.json({
      ok: true,
      message: delivery.delivered
        ? "Verification email sent."
        : "Verification link generated for local development.",
      verifyUrl: delivery.previewUrl,
    });
  } catch (error) {
    await captureException(error, {
      tags: { surface: "auth", action: "resend-verification" },
      extra: { email },
    });

    return NextResponse.json({ error: "Unable to send verification email right now" }, { status: 500 });
  }
}