import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashEmailVerificationToken, normalizeCallbackUrl } from "@/lib/auth-verification";

function redirectToLogin(status: "success" | "invalid" | "expired", callbackUrl?: string | null) {
  const url = new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  url.searchParams.set("verification", status);
  const safeCallbackUrl = normalizeCallbackUrl(callbackUrl);
  if (safeCallbackUrl) {
    url.searchParams.set("callbackUrl", safeCallbackUrl);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

  if (!token) {
    return redirectToLogin("invalid", callbackUrl);
  }

  const user = await prisma.user.findFirst({
    where: {
      verificationTokenHash: hashEmailVerificationToken(token),
    },
  });

  if (!user) {
    return redirectToLogin("invalid", callbackUrl);
  }

  if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt <= new Date()) {
    return redirectToLogin("expired", callbackUrl);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    },
  });

  return redirectToLogin("success", callbackUrl);
}