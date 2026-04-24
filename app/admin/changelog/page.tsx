"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { laws, type Law } from "@/lib/lexforge-data";

function getOverdueLaws(): Array<Law & { daysOverdue: number }> {
  const now = Date.now();
  return laws
    .filter((law) => law.last_reviewed_at && law.freshness_sla_days)
    .map((law) => {
      const daysSince = (now - new Date(law.last_reviewed_at!).getTime()) / 86_400_000;
      return { ...law, daysOverdue: Math.round(daysSince - law.freshness_sla_days!) };
    })
    .filter((law) => law.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

const CHANGE_TYPES = [
  { value: "amendment", label: "Amendment" },
  { value: "new_obligation", label: "New Obligation" },
  { value: "effective_date_change", label: "Effective Date Change" },
  { value: "status_change", label: "Status Change" },
  { value: "guidance_issued", label: "Guidance Issued" },
  { value: "repeal", label: "Repealed" },
];

const CHANGE_TYPE_COLOR: Record<string, string> = {
  amendment: "#b45309",
  new_obligation: "#c1121f",
  effective_date_change: "#1a56db",
  status_change: "#6b7280",
  guidance_issued: "#1d6e52",
  repeal: "#6b7280",
};

type Entry = {
  id: string;
  lawSlug: string;
  lawShortTitle: string;
  lawJurisdiction: string;
  changeType: string;
  summary: string;
  details: string | null;
  changedAt: string;
};

const EMPTY_FORM = {
  lawSlug: "",
  changeType: "amendment",
  summary: "",
  details: "",
  changedAt: new Date().toISOString().slice(0, 10),
};

export default function AdminChangelogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/changelog");
    if (r.ok) {
      const { data } = await r.json();
      setEntries(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    if (!isAdmin) { router.push("/dashboard"); return; }
    load();
  }, [status, isAdmin, router, load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const r = await fetch("/api/admin/changelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        changedAt: form.changedAt ? new Date(form.changedAt).toISOString() : undefined,
      }),
    });

    const body = await r.json();
    if (r.ok) {
      setSuccess("Entry added successfully.");
      setForm({ ...EMPTY_FORM, changedAt: new Date().toISOString().slice(0, 10) });
      load();
    } else {
      setError(body.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this changelog entry?")) return;
    setDeleting(id);
    await fetch(`/api/admin/changelog?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  if (status === "loading" || loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            Admin
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Regulatory Changelog
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Log new law changes, amendments, and updates that surface to users as alerts.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2.5rem", alignItems: "start" }}>

          {/* Entry list */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
              All entries ({entries.length})
            </h2>
            {entries.length === 0 ? (
              <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                No changelog entries yet. Add the first one →
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className="card"
                    style={{ padding: "0.85rem 1rem", borderLeft: `4px solid ${CHANGE_TYPE_COLOR[e.changeType] ?? "#ccc"}` }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.45rem",
                            borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.04em",
                            background: `${CHANGE_TYPE_COLOR[e.changeType]}22`,
                            color: CHANGE_TYPE_COLOR[e.changeType] ?? "#333",
                          }}>
                            {CHANGE_TYPES.find((t) => t.value === e.changeType)?.label ?? e.changeType}
                          </span>
                          <strong style={{ fontSize: "0.875rem" }}>{e.lawShortTitle}</strong>
                          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{e.lawJurisdiction}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginLeft: "auto" }}>
                            {new Date(e.changedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.2rem" }}>{e.summary}</p>
                        {e.details && (
                          <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>{e.details}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteEntry(e.id)}
                        disabled={deleting === e.id}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--muted)", fontSize: "1.1rem", lineHeight: 1,
                          padding: "0.1rem 0.25rem", flexShrink: 0,
                        }}
                        title="Delete entry"
                      >
                        {deleting === e.id ? "…" : "×"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add form */}
          <div>
            <div className="card" style={{ padding: "1.25rem 1.5rem", position: "sticky", top: "1.5rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }}>Log a new update</h2>
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Law *
                  <select
                    required
                    value={form.lawSlug}
                    onChange={(e) => setForm((f) => ({ ...f, lawSlug: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Choose law…</option>
                    {laws.map((l) => (
                      <option key={l.slug} value={l.slug}>{l.short_title} — {l.jurisdiction}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Change type *
                  <select
                    required
                    value={form.changeType}
                    onChange={(e) => setForm((f) => ({ ...f, changeType: e.target.value }))}
                    style={inputStyle}
                  >
                    {CHANGE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Date of change *
                  <input
                    type="date"
                    required
                    value={form.changedAt}
                    onChange={(e) => setForm((f) => ({ ...f, changedAt: e.target.value }))}
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Summary * <span style={{ fontWeight: 400, color: "var(--muted)" }}>(shown in alert feed)</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GPAI obligations now in effect"
                    value={form.summary}
                    onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Details <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional, shown expanded)</span>
                  <textarea
                    rows={4}
                    placeholder="Longer explanation of what changed and what it means for companies…"
                    value={form.details}
                    onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </label>

                {error && (
                  <p style={{ color: "var(--red)", fontSize: "0.85rem", background: "#fde8ea", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                    {error}
                  </p>
                )}
                {success && (
                  <p style={{ color: "var(--green)", fontSize: "0.85rem", background: "#e8f5ef", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                    {success}
                  </p>
                )}

                <button type="submit" className="button button--primary" disabled={saving}>
                  {saving ? "Saving…" : "Add entry"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Content review queue */}
        {(() => {
          const overdue = getOverdueLaws();
          if (overdue.length === 0) return null;
          return (
            <div style={{ marginTop: "3rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
                Content review queue
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {overdue.length} law{overdue.length !== 1 ? "s" : ""} past their freshness SLA and need content review before re-publishing.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {overdue.map((law) => (
                  <div
                    key={law.slug}
                    className="card"
                    style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderLeft: "4px solid var(--amber, #b45309)" }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.2rem" }}>
                        {law.draft_status === "draft" && (
                          <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db", fontWeight: 600 }}>
                            Draft
                          </span>
                        )}
                        <strong style={{ fontSize: "0.875rem" }}>{law.short_title}</strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{law.jurisdiction}</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                        Last reviewed {law.last_reviewed_at} · SLA {law.freshness_sla_days}d · <span style={{ color: "var(--amber, #b45309)", fontWeight: 600 }}>{law.daysOverdue}d overdue</span>
                      </p>
                    </div>
                    <a href={`/laws/${law.slug}`} target="_blank" rel="noopener noreferrer" className="button" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", textDecoration: "none", flexShrink: 0 }}>
                      View law →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  width: "100%",
};
