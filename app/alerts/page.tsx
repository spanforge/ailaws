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

type AlertPref = {
  id: string;
  lawSlug: string | null;
  jurisdiction: string | null;
  emailEnabled: boolean;
  digestMode: "immediate" | "daily" | "weekly";
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  members: Array<{ id: string; name: string | null; email: string | null; role: string }>;
  invites: Array<{ id: string; email: string; createdAt: string; expiresAt: string }>;
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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addType, setAddType] = useState<"law" | "jurisdiction">("jurisdiction");
  const [addSlug, setAddSlug] = useState("");
  const [addJx, setAddJx] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [editingPrefId, setEditingPrefId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [alertsResponse, organizationsResponse] = await Promise.all([
      fetch("/api/alerts"),
      fetch("/api/organizations").catch(() => null),
    ]);
    if (alertsResponse.ok) {
      const { data, prefs: p } = await alertsResponse.json();
      setEntries(data ?? []);
      setPrefs(p ?? []);
    }
    if (organizationsResponse && organizationsResponse.ok) {
      const { data } = await organizationsResponse.json();
      setOrganizations(data ?? []);
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

  async function updatePref(id: string, patch: Partial<Pick<AlertPref, "emailEnabled" | "digestMode">>) {
    setEditingPrefId(id);
    await fetch("/api/alerts/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setEditingPrefId(null);
    load();
  }

  const filtered = filterType === "all" ? entries : entries.filter((entry) => entry.changeType === filterType);

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
              Regulatory alerts
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              Recent legal changes, alert routing controls, and team visibility for the laws you track.
            </p>
          </div>
          <button className="button" onClick={() => setShowAddPanel((value) => !value)}>
            {showAddPanel ? "Cancel" : "Add alert"}
          </button>
        </div>

        {showAddPanel ? (
          <div className="content-card" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem", color: "var(--navy)" }}>Set up a new alert</h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="radio" name="addType" value="jurisdiction" checked={addType === "jurisdiction"} onChange={() => setAddType("jurisdiction")} />
                By jurisdiction
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="radio" name="addType" value="law" checked={addType === "law"} onChange={() => setAddType("law")} />
                By specific law
              </label>
            </div>

            {addType === "jurisdiction" ? (
              <select
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
            ) : (
              <select
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
            )}

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button className="button button--primary" onClick={addPref} disabled={saving || (addType === "law" ? !addSlug : !addJx)}>
                {saving ? "Saving..." : "Save alert"}
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "2rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {["all", "amendment", "new_obligation", "effective_date_change", "status_change", "guidance_issued"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stack">
            <div className="content-card" style={{ padding: "1rem 1.25rem" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.85rem", fontSize: "0.95rem", color: "var(--navy)" }}>Alert routing</h3>
              {prefs.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  No preferences yet. Add one to filter alerts to laws you care about.
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
                          onClick={() => removePref(pref.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1 }}
                          title="Remove alert"
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: "0.6rem" }}>
                        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem", color: "var(--muted)" }}>
                          Email delivery
                          <input
                            type="checkbox"
                            checked={pref.emailEnabled}
                            onChange={(event) => updatePref(pref.id, { emailEnabled: event.target.checked })}
                            disabled={editingPrefId === pref.id}
                          />
                        </label>
                        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.82rem", color: "var(--muted)" }}>
                          Digest mode
                          <select
                            value={pref.digestMode}
                            onChange={(event) => updatePref(pref.id, { digestMode: event.target.value as AlertPref["digestMode"] })}
                            disabled={editingPrefId === pref.id}
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </label>
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
