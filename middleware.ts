import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { REQUEST_ID_HEADER } from "@/lib/request-context";

const { auth } = NextAuth(authConfig);

const PROTECTED_PATH_PREFIXES = ["/dashboard", "/account", "/alerts", "/admin", "/evidence"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default auth((req: NextAuthRequest) => {
  const requestHeaders = new Headers(req.headers);
  const requestId = requestHeaders.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  if (!req.auth && isProtectedPath(req.nextUrl.pathname)) {
    const host = req.headers.get("host") ?? "localhost:3000";
    const protocol = req.nextUrl.protocol;
    const loginUrl = new URL(`${protocol}//${host}/login`);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
