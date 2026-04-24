import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: ReturnType<typeof auth> extends Promise<infer T> ? T : never }) => {
  if (!req.auth) {
    const host = req.headers.get("host") ?? "localhost:3000";
    const protocol = req.nextUrl.protocol;
    const loginUrl = new URL(`${protocol}//${host}/login`);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/alerts/:path*",
    "/alerts",
    "/admin/:path*",
    "/assess",
    "/assess/:path*",
    "/templates/:path*",
  ],
};
