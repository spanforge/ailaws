import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { captureException } from "@/lib/monitoring";
import { getRequestFingerprint, takeRateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.toString().trim().toLowerCase() ?? "";
        const password = credentials?.password?.toString() ?? "";

        if (!email || !password) return null;

        const rateLimit = takeRateLimit({
          key: `auth:login:${getRequestFingerprint(request)}:${email}`,
          limit: 8,
          windowMs: 10 * 60 * 1000,
        });

        if (!rateLimit.allowed) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (error) {
          await captureException(error, {
            tags: { surface: "auth", action: "credentials-login" },
            extra: { email },
          });
          return null;
        }
      },
    }),
  ],
});
