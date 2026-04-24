import { getAuthBaseUrl } from "@/lib/auth-verification";
import { log } from "@/lib/monitoring";

function getWorkspaceFromEmail() {
  return process.env.AUTH_WORKSPACE_FROM_EMAIL || process.env.AUTH_VERIFICATION_FROM_EMAIL;
}

export function isWorkspaceEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && getWorkspaceFromEmail());
}

export function buildWorkspaceInviteUrl(token: string) {
  const inviteUrl = new URL("/join", getAuthBaseUrl());
  inviteUrl.searchParams.set("token", token);
  return inviteUrl.toString();
}

export async function sendWorkspaceCreatedEmail(params: {
  email: string;
  recipientName?: string | null;
  workspaceName: string;
  workspaceSlug: string;
}) {
  const from = getWorkspaceFromEmail();

  if (!from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Workspace email delivery is not configured.");
    }

    log("info", "workspace.delivery.preview.created", {
      recipient: params.email,
      workspaceName: params.workspaceName,
      workspaceSlug: params.workspaceSlug,
    });

    return { delivered: false };
  }

  const dashboardUrl = new URL("/dashboard", getAuthBaseUrl()).toString();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.email],
      subject: `Workspace created: ${params.workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102030;">
          <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Workspace ready</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">${params.workspaceName}</h1>
          <p>Hello ${params.recipientName?.trim() || "there"},</p>
          <p>Your Spanforge Compass workspace has been created successfully.</p>
          <p><strong>Workspace slug:</strong> ${params.workspaceSlug}</p>
          <p>Next steps: invite your team, run your first assessment, and start exporting evidence from one shared workspace.</p>
          <p>
            <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 16px; background: #123b63; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Open dashboard
            </a>
          </p>
        </div>
      `,
      text: [
        `Hello ${params.recipientName?.trim() || "there"},`,
        "",
        `Your Spanforge Compass workspace \"${params.workspaceName}\" is ready.`,
        `Workspace slug: ${params.workspaceSlug}`,
        "",
        "Next steps: invite your team, run your first assessment, and start exporting evidence.",
        dashboardUrl,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend workspace-created delivery failed: ${response.status} ${errorBody}`);
  }

  return { delivered: true };
}

export async function sendWorkspaceInviteEmail(params: {
  email: string;
  inviterName?: string | null;
  workspaceName: string;
  acceptUrl: string;
  expiresAt: Date;
}) {
  const from = getWorkspaceFromEmail();

  if (!from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Workspace email delivery is not configured.");
    }

    log("info", "workspace.delivery.preview.invite", {
      recipient: params.email,
      workspaceName: params.workspaceName,
      acceptUrl: params.acceptUrl,
    });

    return { delivered: false, previewUrl: params.acceptUrl };
  }

  const expiresOn = params.expiresAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.email],
      subject: `Invitation to join ${params.workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102030;">
          <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Workspace invitation</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">Join ${params.workspaceName}</h1>
          <p>Hello,</p>
          <p>${params.inviterName?.trim() || "A teammate"} invited you to join the workspace <strong>${params.workspaceName}</strong> in Spanforge Compass.</p>
          <p>This invitation expires on ${expiresOn}.</p>
          <p>
            <a href="${params.acceptUrl}" style="display: inline-block; padding: 10px 16px; background: #123b63; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Accept invitation
            </a>
          </p>
          <p>If the button does not work, copy this URL into your browser:</p>
          <p><a href="${params.acceptUrl}">${params.acceptUrl}</a></p>
        </div>
      `,
      text: [
        "Hello,",
        "",
        `${params.inviterName?.trim() || "A teammate"} invited you to join ${params.workspaceName} in Spanforge Compass.`,
        `This invitation expires on ${expiresOn}.`,
        "",
        params.acceptUrl,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend workspace-invite delivery failed: ${response.status} ${errorBody}`);
  }

  return { delivered: true, previewUrl: null };
}