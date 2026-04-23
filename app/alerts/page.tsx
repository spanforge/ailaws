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
  digestMode: string;
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
  amendment: "var(--amber)",
  new_obligation: "var(--red)",
  effective_date_change: "var(--blue)",
  status_change: "var(--muted)",
  guidance_issued: "var(--green)",
  repeal: "var(--muted)",
};

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [prefs, setPrefs] = useState<AlertPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addType, setAddType] = useState<"law" | "jurisdiction">("jurisdiction");
  const [addSlug, setAddSlug] = useState("");
  const [addJx, setAddJx] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/alerts");
    if (r.ok) {
      const { data, prefs: p } = await r.json();
      setEntries(data ?? []);
      setPrefs(p ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { window.location.href = "/login"; return; }
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
      body: JSON.stringify(
        addType === "law"
          ? { lawSlug: addSlug }
          : { jurisdiction: addJx }
      ),
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

  const filtered = filterType === "all" ? entries : entries.filter((e) => e.changeType === filterType);

  if (status === "loading" || loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading alerts…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              Regulatory Alerts
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              Recent changes to AI laws and regulations you follow
            </p>
          </div>
          <button className="button" onClick={() => setShowAddPanel((v) => !v)}>
            {showAddPanel ? "✕ Cancel" : "+ Add alert"}
          </button>
        </div>

        {/* Add alert panel */}
        {showAddPanel && (
          <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem", background: "var(--surface)" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Set up a new alert</h3>
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
                onChange={(e) => setAddJx(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.95rem", minWidth: "220px" }}
              >
                <option value="">Choose jurisdiction…</option>
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.label}>{j.label}</option>
                ))}
              </select>
            ) : (
              <select
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.95rem", minWidth: "280px" }}
              >
                <option value="">Choose law…</option>
                {laws.map((l) => (
                  <option key={l.slug} value={l.slug}>{l.short_title}</option>
                ))}
              </select>
            )}

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button className="button" onClick={addPref} disabled={saving || (addType === "law" ? !addSlug : !addJx)}>
                {saving ? "Saving…" : "Save alert"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "2rem", alignItems: "start" }}>

          {/* Main feed */}
          <div>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {["all", "amendment", "new_obligation", "effective_date_change", "status_change", "guidance_issued"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.8rem",
                    borderRadius: "999px",
                    border: "1px solid var(--border)",
                    background: filterType === t ? "var(--navy)" : "transparent",
                    color: filterType === t ? "#fff" : "var(--text)",
                    cursor: "pointer",
                    fontWeight: filterType === t ? 700 : 400,
                  }}
                >
                  {t === "all" ? "All" : (CHANGE_TYPE_LABEL[t] ?? t)}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                <p style={{ fontSize: "1.1rem" }}>No alerts match this filter.</p>
                {prefs.length === 0 && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                    Add an alert preference to follow specific laws or jurisdictions.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {filtered.map((entry) => (
                  <div
                    key={entry.id}
                    className="card"
                    style={{ padding: "1rem 1.25rem", borderLeft: `4px solid ${CHANGE_TYPE_COLOR[entry.changeType] ?? "var(--border)"}` }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "999px",
                          background: `${CHANGE_TYPE_COLOR[entry.changeType]}22`,
                          color: CHANGE_TYPE_COLOR[entry.changeType],
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>
                          {CHANGE_TYPE_LABEL[entry.changeType] ?? entry.changeType}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{entry.lawShortTitle}</span>
                        {entry.lawJurisdiction && (
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{entry.lawJurisdiction}</span>
                        )}
                      </div>
                      <time style={{ fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {new Date(entry.changedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>{entry.summary}</p>
                    {entry.details && (
                      <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.55 }}>{entry.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — alert preferences */}
          <div>
            <div className="card" style={{ padding: "1rem 1.25rem" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.85rem", fontSize: "0.95rem" }}>Your Alert Preferences</h3>
              {prefs.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  No preferences yet. Add one to filter alerts to laws you care about.
                </p>
              ) : (
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0 }}>
                  {prefs.map((p) => (
                    <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                      <span>
                        {p.lawSlug
                          ? `📄 ${laws.find((l) => l.slug === p.lawSlug)?.short_title ?? p.lawSlug}`
                          : `🌍 ${p.jurisdiction}`}
                      </span>
                      <button
                        onClick={() => removePref(p.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem", lineHeight: 1 }}
                        title="Remove alert"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {prefs.length > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.85rem" }}>
                  When no preferences are set, all recent alerts are shown.
                </p>
              )}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <Link href="/dashboard" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                ← Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
