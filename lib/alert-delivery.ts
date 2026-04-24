import { log } from "@/lib/monitoring";

const CHANGE_TYPE_LABEL: Record<string, string> = {
  amendment: "Amendment",
  new_obligation: "New obligation",
  effective_date_change: "Effective date change",
  status_change: "Status change",
  guidance_issued: "Guidance issued",
  repeal: "Repeal",
};

export function isRegulatoryAlertDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && (process.env.AUTH_ALERTS_FROM_EMAIL || process.env.AUTH_VERIFICATION_FROM_EMAIL));
}

export function isComplianceAlertDeliveryConfigured() {
  return isRegulatoryAlertDeliveryConfigured();
}

export function isComplianceSlackDeliveryConfigured() {
  return Boolean(process.env.COMPLIANCE_SLACK_WEBHOOK_URL);
}

export async function sendRegulatoryAlertEmail(params: {
  email: string;
  name?: string | null;
  lawShortTitle: string;
  jurisdiction?: string | null;
  changeType: string;
  summary: string;
  details?: string | null;
  changedAt: Date;
}) {
  const changeLabel = CHANGE_TYPE_LABEL[params.changeType] ?? params.changeType;
  const from = process.env.AUTH_ALERTS_FROM_EMAIL || process.env.AUTH_VERIFICATION_FROM_EMAIL;

  if (!from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Regulatory alert delivery is not configured.");
    }

    log("info", "alerts.delivery.preview", {
      recipient: params.email,
      lawShortTitle: params.lawShortTitle,
      changeType: params.changeType,
    });

    return { delivered: false };
  }

  const changedOn = params.changedAt.toLocaleDateString("en-US", {
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
      subject: `${changeLabel}: ${params.lawShortTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102030;">
          <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Regulatory watchlist</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">${params.lawShortTitle}</h1>
          <p>Hello ${params.name?.trim() || "there"},</p>
          <p>A tracked law in Spanforge Compass has a new update.</p>
          <p><strong>${changeLabel}</strong>${params.jurisdiction ? ` · ${params.jurisdiction}` : ""} · ${changedOn}</p>
          <p style="font-weight: 700; margin-bottom: 6px;">${params.summary}</p>
          ${params.details ? `<p>${params.details}</p>` : ""}
          <p>Open your watchlist in Spanforge Compass to review the change and rerun affected assessments.</p>
        </div>
      `,
      text: [
        `Hello ${params.name?.trim() || "there"},`,
        "",
        `A tracked law in Spanforge Compass has a new update: ${params.lawShortTitle}`,
        `${changeLabel}${params.jurisdiction ? ` | ${params.jurisdiction}` : ""} | ${changedOn}`,
        "",
        params.summary,
        params.details || "",
        "",
        "Open your watchlist in Spanforge Compass to review the change and rerun affected assessments.",
      ].filter(Boolean).join("\n"),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend alert delivery failed: ${response.status} ${errorBody}`);
  }

  return { delivered: true };
}

export async function sendComplianceAlertEmail(params: {
  email: string;
  name?: string | null;
  title: string;
  severity: "high" | "medium" | "low";
  message: string;
  assessmentName?: string | null;
  assessmentUrl?: string | null;
}) {
  const from = process.env.AUTH_ALERTS_FROM_EMAIL || process.env.AUTH_VERIFICATION_FROM_EMAIL;

  if (!from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Compliance alert delivery is not configured.");
    }

    log("info", "compliance-alerts.delivery.preview", {
      recipient: params.email,
      title: params.title,
      severity: params.severity,
    });

    return { delivered: false };
  }

  const severityLabel = params.severity.toUpperCase();
  const actionLine = params.assessmentUrl
    ? `Open the linked assessment in Spanforge Compass to review and resolve it.`
    : "Open Spanforge Compass to review and resolve it.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.email],
      subject: `[${severityLabel}] ${params.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102030;">
          <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Continuous compliance alert</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">${params.title}</h1>
          <p>Hello ${params.name?.trim() || "there"},</p>
          <p>Spanforge Compass detected a persistent compliance issue that needs attention.</p>
          <p><strong>Severity:</strong> ${severityLabel}</p>
          ${params.assessmentName ? `<p><strong>Assessment:</strong> ${params.assessmentName}</p>` : ""}
          <p style="font-weight: 700; margin-bottom: 6px;">${params.message}</p>
          <p>${actionLine}</p>
          ${params.assessmentUrl ? `<p><a href="${params.assessmentUrl}" style="color:#0f4c81;">Open assessment</a></p>` : ""}
        </div>
      `,
      text: [
        `Hello ${params.name?.trim() || "there"},`,
        "",
        "Spanforge Compass detected a persistent compliance issue that needs attention.",
        `Title: ${params.title}`,
        `Severity: ${severityLabel}`,
        params.assessmentName ? `Assessment: ${params.assessmentName}` : "",
        "",
        params.message,
        "",
        actionLine,
        params.assessmentUrl || "",
      ].filter(Boolean).join("\n"),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend compliance alert delivery failed: ${response.status} ${errorBody}`);
  }

  return { delivered: true };
}

export async function sendComplianceAlertSlackMessage(params: {
  title: string;
  severity: "high" | "medium" | "low";
  message: string;
  assessmentName?: string | null;
  assessmentUrl?: string | null;
  webhookUrl?: string | null;
}) {
  const webhookUrl = params.webhookUrl || process.env.COMPLIANCE_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Compliance Slack delivery is not configured.");
    }

    log("info", "compliance-alerts.slack.preview", {
      title: params.title,
      severity: params.severity,
      assessmentName: params.assessmentName,
    });

    return { delivered: false };
  }

  const color = params.severity === "high" ? "#e63946" : params.severity === "medium" ? "#f4a261" : "#0f4c81";
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      attachments: [
        {
          color,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `${params.severity.toUpperCase()} compliance alert`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${params.title}*\n${params.message}`,
              },
            },
            ...(params.assessmentName ? [{
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Assessment: ${params.assessmentName}`,
                },
              ],
            }] : []),
            ...(params.assessmentUrl ? [{
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Open assessment",
                  },
                  url: params.assessmentUrl,
                },
              ],
            }] : []),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Slack compliance alert delivery failed: ${response.status} ${errorBody}`);
  }

  return { delivered: true };
}
