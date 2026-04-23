import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/alerts/:path*", "/alerts", "/admin/:path*"],
};
