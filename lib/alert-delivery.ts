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