"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { laws, JURISDICTIONS } from "@/lib/lexforge-data";

type ChangeEntry = {
  id: string;
  lawSlug: string;
  lawShortTitle: string;
  lawJurisdiction: string;
  changeType: string;
  summary: string;
  details: string | null;
  changedAt: string;
};

type AssessmentMini = {
  id: string;
  name: string | null;
  createdAt: string;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  results: Array<{ lawSlug: string; applicabilityStatus: string }>;
};

type AlertPref = {
  id: string;
  lawSlug: string | null;
  jurisdiction: string | null;
  emailEnabled?: boolean;
  digestMode?: string;
};

type ComplianceAlert = {
  id: string;
  assessmentId: string | null;
  alertType: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
  updatedAt: string;
  assessment?: {
    id: string;
    name: string | null;
    createdAt: string;
  } | null;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  members: Array<{ id: string; name: string | null; email: string | null; role: string }>;
  invites: Array<{ id: string; email: string; createdAt: string; expiresAt: string }>;
  integrationSettings?: {
    id: string;
    complianceEmailEnabled: boolean;
    complianceSlackWebhookUrl: string | null;
    notificationRole: string;
  } | null;
};

const CHANGE_TYPE_LABEL: Record<string, string> = {
  amendment: "Amendment",
  new_obligation: "New Obligation",
  effective_date_change: "Effective Date Change",
  status_change: "Status Change",
  guidance_issued: "Guidance Issued",
  repeal: "Repealed",
};

const CHANGE_TYPE_COLOR: Record<string, string> = {
  amendment: "#f4a261",
  new_obligation: "#e63946",
  effective_date_change: "#2b6cb0",
  status_change: "#6b7280",
  guidance_issued: "#2a7b62",
  repeal: "#6b7280",
};

export default function AlertsPage() {
  const { status } = useSession();
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [prefs, setPrefs] = useState<AlertPref[]>([]);
  const [deliveryConfigured, setDeliveryConfigured] = useState(false);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assessments, setAssessments] = useState<AssessmentMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addType, setAddType] = useState<"law" | "jurisdiction">("jurisdiction");
  const [addSlug, setAddSlug] = useState("");
  const [addJx, setAddJx] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingPrefId, setUpdatingPrefId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [alertFilter, setAlertFilter] = useState<"all" | "open" | "acknowledged">("all");
  const [refreshingCompliance, setRefreshingCompliance] = useState(false);
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
  const [orgRoutingDrafts, setOrgRoutingDrafts] = useState<Record<string, { complianceSlackWebhookUrl: string; notificationRole: string; complianceEmailEnabled: boolean }>>({});
  const [updatingOrgId, setUpdatingOrgId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [alertsResponse, organizationsResponse, assessmentsResponse] = await Promise.all([
      fetch("/api/alerts"),
      fetch("/api/organizations").catch(() => null),
      fetch("/api/assessments").catch(() => null),
    ]);
    if (alertsResponse.ok) {
      const { data, prefs: p, deliveryConfigured: deliveryReady, complianceAlerts: workspaceAlerts } = await alertsResponse.json();
      setEntries(data ?? []);
      setPrefs(p ?? []);
      setDeliveryConfigured(Boolean(deliveryReady));
      setComplianceAlerts(workspaceAlerts ?? []);
    }
    if (organizationsResponse && organizationsResponse.ok) {
      const { data } = await organizationsResponse.json();
      setOrganizations(data ?? []);
    }
    if (assessmentsResponse && assessmentsResponse.ok) {
      const { data } = await assessmentsResponse.json();
      setAssessments(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;
    load();
  }, [status, load]);

  async function addPref() {
    if (addType === "law" && !addSlug) return;
    if (addType === "jurisdiction" && !addJx) return;
    setSaving(true);
    await fetch("/api/alerts/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addType === "law" ? { lawSlug: addSlug } : { jurisdiction: addJx }),
    });
    setAddSlug("");
    setAddJx("");
    setShowAddPanel(false);
    setSaving(false);
    load();
  }

  async function removePref(id: string) {
    await fetch(`/api/alerts/preferences?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  }

  async function updatePref(id: string, patch: { emailEnabled?: boolean; digestMode?: string }) {
    setUpdatingPrefId(id);
    await fetch("/api/alerts/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setUpdatingPrefId(null);
    load();
  }

  const filtered = filterType === "all" ? entries : entries.filter((entry) => entry.changeType === filterType);
  const filteredComplianceAlerts = complianceAlerts.filter((alert) => alertFilter === "all" ? true : alert.status === alertFilter);

  async function refreshComplianceAlerts() {
    setRefreshingCompliance(true);
    await fetch("/api/alerts/refresh", { method: "POST" });
    setRefreshingCompliance(false);
    load();
  }

  async function updateComplianceAlert(alertId: string, nextStatus: "acknowledged" | "resolved") {
    setUpdatingAlertId(alertId);
    await fetch(`/api/alerts/compliance/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setUpdatingAlertId(null);
    load();
  }

  function setOrgDraft(organizationId: string, patch: Partial<{ complianceSlackWebhookUrl: string; notificationRole: string; complianceEmailEnabled: boolean }>) {
    setOrgRoutingDrafts((current) => ({
      ...current,
      [organizationId]: {
        complianceSlackWebhookUrl: current[organizationId]?.complianceSlackWebhookUrl ?? "",
        notificationRole: current[organizationId]?.notificationRole ?? "owner",
        complianceEmailEnabled: current[organizationId]?.complianceEmailEnabled ?? true,
        ...patch,
      },
    }));
  }

  async function updateOrganizationRouting(organization: Organization) {
    setUpdatingOrgId(organization.id);
    const draft = orgRoutingDrafts[organization.id] ?? {
      complianceSlackWebhookUrl: organization.integrationSettings?.complianceSlackWebhookUrl ?? "",
      notificationRole: organization.integrationSettings?.notificationRole ?? "owner",
      complianceEmailEnabled: organization.integrationSettings?.complianceEmailEnabled ?? true,
    };
    await fetch(`/api/organizations/${organization.id}/integrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setUpdatingOrgId(null);
    load();
  }

  if (status === "loading" || loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading alerts...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)" }}>
              Regulatory watchlist
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              Recent legal changes, in-app watchlists, and team visibility for the laws you track.
            </p>
          </div>
          <button type="button" className="button" onClick={() => setShowAddPanel((value) => !value)} aria-expanded={showAddPanel} aria-controls="watchlist-add-panel">
            {showAddPanel ? "Cancel" : "Add alert"}
          </button>
        </div>

        {showAddPanel ? (
          <div id="watchlist-add-panel" className="content-card" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem", color: "var(--navy)" }}>Add a law to your watchlist</h3>
            <fieldset style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", border: 0, padding: 0 }}>
              <legend style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.45rem" }}>Watchlist type</legend>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="radio" name="addType" value="jurisdiction" checked={addType === "jurisdiction"} onChange={() => setAddType("jurisdiction")} />
                By jurisdiction
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="radio" name="addType" value="law" checked={addType === "law"} onChange={() => setAddType("law")} />
                By specific law
              </label>
            </fieldset>

            {addType === "jurisdiction" ? (
              <>
                <label htmlFor="watchlist-jurisdiction" style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem" }}>Jurisdiction</label>
                <select
                id="watchlist-jurisdiction"
                value={addJx}
                onChange={(event) => setAddJx(event.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.95rem", minWidth: "220px" }}
              >
                <option value="">Choose jurisdiction...</option>
                {JURISDICTIONS.map((jurisdiction) => (
                  <option key={jurisdiction.code} value={jurisdiction.label}>
                    {jurisdiction.label}
                  </option>
                ))}
              </select>
              </>
            ) : (
              <>
                <label htmlFor="watchlist-law" style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem" }}>Law</label>
                <select
                id="watchlist-law"
                value={addSlug}
                onChange={(event) => setAddSlug(event.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.95rem", minWidth: "280px" }}
              >
                <option value="">Choose law...</option>
                {laws.map((law) => (
                  <option key={law.slug} value={law.slug}>
                    {law.short_title}
                  </option>
                ))}
              </select>
              </>
            )}

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button type="button" className="button button--primary" onClick={addPref} disabled={saving || (addType === "law" ? !addSlug : !addJx)}>
                {saving ? "Saving..." : "Save watchlist"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="content-card" style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem", background: deliveryConfigured ? "rgba(22,163,74,0.06)" : "rgba(244,162,97,0.09)", borderColor: deliveryConfigured ? "rgba(22,163,74,0.22)" : "rgba(244,162,97,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>Delivery status</p>
              <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                {deliveryConfigured
                  ? "Immediate email alerts are enabled for watchlist entries marked for email delivery. New changelog items continue to appear in this in-app feed as well."
                  : "This workspace is currently using the in-app feed only. Configure alert email delivery to send immediate watchlist updates to matched users."}
              </p>
            </div>
            <span style={{ alignSelf: "flex-start", padding: "0.25rem 0.6rem", borderRadius: "999px", background: deliveryConfigured ? "rgba(22,163,74,0.14)" : "rgba(244,162,97,0.18)", color: deliveryConfigured ? "var(--green)" : "#915a1e", fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {deliveryConfigured ? "Email live" : "In-app only"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "2rem", alignItems: "start" }}>
          <div>
            <div className="content-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem", background: "rgba(230,57,70,0.04)", borderColor: "rgba(230,57,70,0.16)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.85rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "1rem" }}>Continuous compliance alerts</h3>
                  <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
                    Persistent alerts generated from assessment age, law drift, execution gaps, and evidence freshness.
                  </p>
                </div>
                <button type="button" className="button" onClick={refreshComplianceAlerts} disabled={refreshingCompliance}>
                  {refreshingCompliance ? "Refreshing..." : "Refresh workspace alerts"}
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: filteredComplianceAlerts.length > 0 ? "0.9rem" : 0 }}>
                {(["all", "open", "acknowledged"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setAlertFilter(status)}
                    aria-pressed={alertFilter === status}
                    style={{
                      padding: "0.35rem 0.85rem",
                      fontSize: "0.8rem",
                      borderRadius: "999px",
                      border: "1px solid var(--border)",
                      background: alertFilter === status ? "var(--navy)" : "transparent",
                      color: alertFilter === status ? "#fff" : "var(--text)",
                      cursor: "pointer",
                      fontWeight: alertFilter === status ? 700 : 400,
                    }}
                  >
                    {status === "all" ? "All workspace alerts" : status === "open" ? "Open" : "Acknowledged"}
                  </button>
                ))}
              </div>
              {filteredComplianceAlerts.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                  No persistent compliance alerts match this filter.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  {filteredComplianceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: "0.95rem 1rem",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.82)",
                        border: "1px solid rgba(16,32,48,0.08)",
                        borderLeft: `4px solid ${alert.severity === "high" ? "var(--red)" : alert.severity === "medium" ? "#915a1e" : "var(--navy)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
                          <strong style={{ color: "var(--navy)" }}>{alert.title}</strong>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: alert.severity === "high" ? "var(--red)" : alert.severity === "medium" ? "#915a1e" : "var(--navy)" }}>
                            {alert.severity}
                          </span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: alert.status === "acknowledged" ? "#915a1e" : "var(--red)" }}>
                            {alert.status}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                          {new Date(alert.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 0.45rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>
                        {alert.message}
                      </p>
                      {alert.assessment ? (
                        <p style={{ margin: "0 0 0.7rem", color: "var(--navy)", fontSize: "0.82rem" }}>
                          {alert.assessment.name ?? `Assessment from ${new Date(alert.assessment.createdAt).toLocaleDateString("en-GB")}`}
                        </p>
                      ) : null}
                      <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                        {alert.assessmentId ? (
                          <Link href={`/assess/results/${alert.assessmentId}`} className="button" style={{ fontSize: "0.8rem" }}>
                            Open assessment
                          </Link>
                        ) : null}
                        {alert.status === "open" ? (
                          <button type="button" className="button" onClick={() => updateComplianceAlert(alert.id, "acknowledged")} disabled={updatingAlertId === alert.id}>
                            {updatingAlertId === alert.id ? "Updating..." : "Acknowledge"}
                          </button>
                        ) : null}
                        <button type="button" className="button" onClick={() => updateComplianceAlert(alert.id, "resolved")} disabled={updatingAlertId === alert.id}>
                          {updatingAlertId === alert.id ? "Updating..." : "Resolve"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {["all", "amendment", "new_obligation", "effective_date_change", "status_change", "guidance_issued"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFilterType(type)}
                  aria-pressed={filterType === type}
                  style={{
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.8rem",
                    borderRadius: "999px",
                    border: "1px solid var(--border)",
                    background: filterType === type ? "var(--navy)" : "transparent",
                    color: filterType === type ? "#fff" : "var(--text)",
                    cursor: "pointer",
                    fontWeight: filterType === type ? 700 : 400,
                  }}
                >
                  {type === "all" ? "All" : (CHANGE_TYPE_LABEL[type] ?? type)}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="content-card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                <p style={{ fontSize: "1.1rem" }}>No alerts match this filter.</p>
                {prefs.length === 0 ? (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                    Add an alert preference to follow specific laws or jurisdictions.
                  </p>
                ) : null}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {filtered.map((entry) => (
                  <div
                    key={entry.id}
                    className="content-card"
                    style={{ padding: "1rem 1.25rem", borderLeft: `4px solid ${CHANGE_TYPE_COLOR[entry.changeType] ?? "var(--border)"}` }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "999px",
                            background: `${CHANGE_TYPE_COLOR[entry.changeType]}22`,
                            color: CHANGE_TYPE_COLOR[entry.changeType],
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {CHANGE_TYPE_LABEL[entry.changeType] ?? entry.changeType}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--navy)" }}>{entry.lawShortTitle}</span>
                        {entry.lawJurisdiction ? (
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{entry.lawJurisdiction}</span>
                        ) : null}
                      </div>
                      <time style={{ fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {new Date(entry.changedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <p style={{ fontWeight: 600, marginBottom: "0.3rem", color: "var(--navy)" }}>{entry.summary}</p>
                    {entry.details ? (
                      <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.55 }}>{entry.details}</p>
                    ) : null}
                    <div style={{ marginTop: "0.75rem" }}>
                      <button
                        className="button"
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => {
                          const affected = assessments.find((a) =>
                            a.results.some((r) => r.lawSlug === entry.lawSlug && (r.applicabilityStatus === "likely_applies" || r.applicabilityStatus === "may_apply"))
                          );
                          if (affected) {
                            const input = {
                              ...JSON.parse(affected.companyProfile ?? "{}"),
                              ...JSON.parse(affected.productProfile ?? "{}"),
                              ...JSON.parse(affected.technicalProfile ?? "{}"),
                            };
                            sessionStorage.setItem("compass_prefill", JSON.stringify(input));
                          }
                          window.location.href = "/assess";
                        }}
                      >
                        Re-run assessment for {entry.lawShortTitle} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stack">
            <div className="content-card" style={{ padding: "1rem 1.25rem" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.85rem", fontSize: "0.95rem", color: "var(--navy)" }}>Watchlist coverage</h3>
              {prefs.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  No watchlist filters yet. Add one to focus the in-app change feed on laws you care about.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {prefs.map((pref) => (
                    <div key={pref.id} style={{ padding: "0.85rem 0.9rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center", marginBottom: "0.65rem" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--navy)", fontWeight: 700 }}>
                          {pref.lawSlug ? laws.find((law) => law.slug === pref.lawSlug)?.short_title ?? pref.lawSlug : pref.jurisdiction}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePref(pref.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1 }}
                          title="Remove alert"
                          aria-label={`Remove alert for ${pref.lawSlug ? laws.find((law) => law.slug === pref.lawSlug)?.short_title ?? pref.lawSlug : pref.jurisdiction ?? "watchlist entry"}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5 }}>
                        This filter narrows the in-app change feed and reassessment prompts for your account.
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.7rem", alignItems: "center" }}>
                        <label style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.8rem", color: "var(--muted)" }}>
                          <input
                            type="checkbox"
                            checked={pref.emailEnabled ?? true}
                            disabled={updatingPrefId === pref.id}
                            onChange={(event) => void updatePref(pref.id, { emailEnabled: event.target.checked })}
                          />
                          Email enabled
                        </label>
                        <select
                          aria-label="Alert delivery cadence"
                          value={pref.digestMode ?? "immediate"}
                          disabled={updatingPrefId === pref.id}
                          onChange={(event) => void updatePref(pref.id, { digestMode: event.target.value })}
                          style={{ padding: "0.35rem 0.55rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.78rem" }}
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="content-card" style={{ padding: "1rem 1.25rem" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.85rem", fontSize: "0.95rem", color: "var(--navy)" }}>Team visibility</h3>
              {organizations.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  No shared workspace yet. Create one from the dashboard to route alerts around a team.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {organizations.map((organization) => (
                    <div key={organization.id} style={{ padding: "0.85rem 0.9rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                      <strong style={{ color: "var(--navy)" }}>{organization.name}</strong>
                      <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                        {organization.members.length} member{organization.members.length === 1 ? "" : "s"} · {organization.invites.length} pending invite{organization.invites.length === 1 ? "" : "s"}
                      </p>
                      <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.7rem" }}>
                        <label style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.8rem", color: "var(--muted)" }}>
                          <input
                            type="checkbox"
                            checked={orgRoutingDrafts[organization.id]?.complianceEmailEnabled ?? organization.integrationSettings?.complianceEmailEnabled ?? true}
                            disabled={updatingOrgId === organization.id}
                            onChange={(event) => setOrgDraft(organization.id, { complianceEmailEnabled: event.target.checked })}
                          />
                          Route compliance alert emails to workspace
                        </label>
                        <label htmlFor={`workspace-routing-role-${organization.id}`} style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          Notify this workspace role
                        </label>
                        <select
                          id={`workspace-routing-role-${organization.id}`}
                          value={orgRoutingDrafts[organization.id]?.notificationRole ?? organization.integrationSettings?.notificationRole ?? "owner"}
                          disabled={updatingOrgId === organization.id}
                          onChange={(event) => setOrgDraft(organization.id, { notificationRole: event.target.value })}
                          style={{ padding: "0.35rem 0.55rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.78rem" }}
                        >
                          <option value="owner">Owners only</option>
                          <option value="admin">Admins and owners</option>
                          <option value="member">All members</option>
                        </select>
                        <label htmlFor={`workspace-routing-slack-${organization.id}`} style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          Slack webhook URL
                        </label>
                        <input
                          id={`workspace-routing-slack-${organization.id}`}
                          value={orgRoutingDrafts[organization.id]?.complianceSlackWebhookUrl ?? organization.integrationSettings?.complianceSlackWebhookUrl ?? ""}
                          disabled={updatingOrgId === organization.id}
                          onChange={(event) => setOrgDraft(organization.id, { complianceSlackWebhookUrl: event.target.value })}
                          placeholder="Workspace Slack webhook URL"
                        />
                        <button type="button" className="button" onClick={() => updateOrganizationRouting(organization)} disabled={updatingOrgId === organization.id}>
                          {updatingOrgId === organization.id ? "Saving..." : "Save workspace routing"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Link href="/dashboard" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
