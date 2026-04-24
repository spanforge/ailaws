"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  eventType: "edit" | "revert";
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeReason: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

export default function EditorialAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"all" | "edit" | "revert">("all");

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);
      try {
        const suffix = eventType === "all" ? "" : `&eventType=${eventType}`;
        const response = await fetch(`/api/admin/editorial/audit-log?limit=100${suffix}`);
        const data = await response.json();
        setEntries(data.data ?? []);
      } catch {
        setError("Failed to load audit log.");
      } finally {
        setLoading(false);
      }
    }

    void loadEntries();
  }, [eventType]);

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.8rem", color: "var(--navy)" }}>
              Editorial Audit Log
            </h1>
            <p style={{ margin: "0.4rem 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Review field edits and rollback events across laws and obligations.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Link href="/admin/editorial" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Review Queue
            </Link>
            <Link href={`/api/admin/editorial/audit-log?format=csv${eventType === "all" ? "" : `&eventType=${eventType}`}`} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Export CSV
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {(["all", "edit", "revert"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setEventType(value)}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: eventType === value ? "var(--navy)" : "transparent",
                color: eventType === value ? "#fff" : "var(--text)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {value === "all" ? "All events" : value === "revert" ? "Rollback events" : "Edits only"}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color: "var(--text-muted)" }}>Loading audit log...</p> : null}
        {error ? <p style={{ color: "var(--red)" }}>{error}</p> : null}

        {!loading && !error ? (
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: entry.eventType === "revert" ? "rgba(230,57,70,0.05)" : "var(--surface)",
                  border: entry.eventType === "revert" ? "1px solid rgba(230,57,70,0.18)" : "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "1rem 1.1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--navy)" }}>{entry.fieldName}</strong>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: entry.eventType === "revert" ? "var(--red)" : "var(--green)",
                    }}>
                      {entry.eventType === "revert" ? "Rollback" : "Edit"}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {entry.entityType} {entry.entityId}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {new Date(entry.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.35rem", color: "var(--text-muted)", fontSize: "0.84rem" }}>
                  <strong>From:</strong> {entry.oldValue || "empty"} <strong>To:</strong> {entry.newValue || "empty"}
                </p>
                {entry.changeReason ? (
                  <p style={{ margin: "0 0 0.35rem", color: "var(--navy)", fontSize: "0.84rem" }}>
                    Reason: {entry.changeReason}
                  </p>
                ) : null}
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {entry.actor?.name ?? entry.actor?.email ?? "Unknown actor"}
                </p>
              </div>
            ))}
            {entries.length === 0 ? (
              <div style={{ padding: "2rem", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
                No audit entries matched the selected filter.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
