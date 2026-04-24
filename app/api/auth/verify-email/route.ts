import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashEmailVerificationToken } from "@/lib/auth-verification";

function redirectToLogin(status: "success" | "invalid" | "expired") {
  const url = new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  url.searchParams.set("verification", status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return redirectToLogin("invalid");
  }

  const user = await prisma.user.findFirst({
    where: {
      verificationTokenHash: hashEmailVerificationToken(token),
    },
  });

  if (!user) {
    return redirectToLogin("invalid");
  }

  if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt <= new Date()) {
    return redirectToLogin("expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    },
  });

  return redirectToLogin("success");
}