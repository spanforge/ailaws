import { createHash, randomBytes } from "node:crypto";

const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export function createEmailVerificationToken() {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(Date.now() + VERIFICATION_WINDOW_MS),
  };
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAuthBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function buildEmailVerificationUrl(token: string) {
  const verifyUrl = new URL("/api/auth/verify-email", getAuthBaseUrl());
  verifyUrl.searchParams.set("token", token);
  return verifyUrl.toString();
}

export function isEmailVerificationDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_VERIFICATION_FROM_EMAIL);
}

export async function sendVerificationEmail({
  email,
  name,
  verifyUrl,
}: {
  email: string;
  name?: string | null;
  verifyUrl: string;
}) {
  if (!isEmailVerificationDeliveryConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email verification delivery is not configured.");
    }

    return {
      delivered: false,
      previewUrl: verifyUrl,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_VERIFICATION_FROM_EMAIL,
      to: [email],
      subject: "Verify your Spanforge Compass account",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102030;">
          <h1 style="font-size: 20px; margin-bottom: 12px;">Verify your email</h1>
          <p>Hello ${name?.trim() || "there"},</p>
          <p>Confirm your email to activate your Spanforge Compass account and save assessments, evidence, and team workspace activity.</p>
          <p>
            <a href="${verifyUrl}" style="display: inline-block; padding: 10px 16px; background: #123b63; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Verify email
            </a>
          </p>
          <p>If the button does not work, copy this URL into your browser:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
      text: [
        `Hello ${name?.trim() || "there"},`,
        "",
        "Verify your Spanforge Compass account by visiting the link below:",
        verifyUrl,
        "",
        "This link expires in 24 hours.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend delivery failed: ${response.status} ${errorBody}`);
  }

  return {
    delivered: true,
    previewUrl: null,
  };
}