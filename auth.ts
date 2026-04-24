import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { captureException } from "@/lib/monitoring";
import { getRequestFingerprint, takeRateLimit } from "@/lib/rate-limit";

const oauthProviders: Provider[] = [];

if (process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
) {
  oauthProviders.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...oauthProviders,
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
          label: "auth:login",
        });

        if (!rateLimit.allowed) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) return null;
          if (!user.emailVerified) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified ?? null,
          };
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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();
      if (!email) {
        return false;
      }

      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? profile?.name ?? null,
          emailVerified: new Date(),
          verificationTokenHash: null,
          verificationTokenExpiresAt: null,
        },
        create: {
          email,
          name: user.name ?? profile?.name ?? null,
          role: "user",
          emailVerified: new Date(),
        },
      });

      user.id = dbUser.id;
      user.role = dbUser.role;
      user.emailVerified = dbUser.emailVerified ?? null;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role ?? "user";
        token.emailVerified = user.emailVerified?.toISOString() ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified ? new Date(token.emailVerified as string) : null;
      }
      return session;
    },
  },
});
