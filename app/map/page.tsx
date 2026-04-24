"use client";

import { useState } from "react";
import Link from "next/link";
import { laws, JURISDICTIONS } from "@/lib/lexforge-data";

const STATUS_COLOR: Record<string, string> = {
  in_force: "var(--green)",
  enacted: "var(--primary)",
  proposed: "var(--amber)",
  draft: "var(--muted)",
  repealed: "var(--red)",
};

const STATUS_BG: Record<string, string> = {
  in_force: "var(--green-light)",
  enacted: "var(--primary-light)",
  proposed: "var(--amber-light)",
  draft: "var(--surface-alt)",
  repealed: "var(--red-light)",
};

const STATUS_LABEL: Record<string, string> = {
  in_force: "In Force",
  enacted: "Enacted",
  proposed: "Proposed",
  draft: "Draft",
  repealed: "Repealed",
};

const REGION_GROUPS = [
  { label: "Europe", codes: ["EU", "UK", "FR", "ES"] },
  { label: "Americas", codes: ["US", "US-CO", "US-IL", "US-TX", "US-CA", "US-NY", "CA", "BR"] },
  { label: "Asia-Pacific", codes: ["CN", "SG", "AU", "JP", "KR", "IN", "NZ"] },
  { label: "Middle East", codes: ["AE"] },
  { label: "International", codes: ["INTL"] },
];

export default function MapPage() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Group laws by jurisdiction_code
  const byJx = laws.reduce<Record<string, typeof laws>>((acc, law) => {
    const code = law.jurisdiction_code;
    (acc[code] ??= []).push(law);
    return acc;
  }, {});

  // All unique jurisdiction codes that have laws
  const allCodes = Object.keys(byJx);

  const displayedLaws = selectedCode
    ? (byJx[selectedCode] ?? []).filter((l) => statusFilter === "all" || l.status === statusFilter)
    : laws.filter((l) => statusFilter === "all" || l.status === statusFilter);

  const selectedJxInfo = selectedCode
    ? JURISDICTIONS.find((j) => j.code === selectedCode)
    : null;

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="kicker">Jurisdictions</p>
          <h1 style={{ margin: "0.4rem 0 0.5rem", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            Jurisdiction Explorer
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "55ch" }}>
            Browse AI laws by country or region. Select a jurisdiction below to see what applies there.
          </p>
        </div>

        {/* Region selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
          {REGION_GROUPS.map((region) => {
            const regionCodes = region.codes.filter((c) => allCodes.includes(c));
            if (regionCodes.length === 0) return null;
            return (
              <div key={region.label}>
                <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.6rem" }}>
                  {region.label}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {regionCodes.map((code) => {
                    const jxLaws = byJx[code] ?? [];
                    const jxInfo = JURISDICTIONS.find((j) => j.code === code);
                    const isSelected = selectedCode === code;
                    const inForcePct = Math.round((jxLaws.filter((l) => l.status === "in_force" || l.status === "enacted").length / jxLaws.length) * 100);
                    return (
                      <button
                        key={code}
                        onClick={() => setSelectedCode(isSelected ? null : code)}
                        style={{
                          padding: "0.55rem 1rem",
                          borderRadius: "10px",
                          border: `2px solid ${isSelected ? "var(--primary)" : "var(--line)"}`,
                          background: isSelected ? "var(--primary)" : "var(--surface)",
                          color: isSelected ? "white" : "var(--text)",
                          cursor: "pointer",
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: "0.875rem",
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span>{jxInfo?.label ?? code}</span>
                        <span style={{
                          fontSize: "0.75rem",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "999px",
                          background: isSelected ? "rgba(255,255,255,0.2)" : "var(--surface)",
                          fontWeight: 700,
                        }}>
                          {jxLaws.length}
                        </span>
                        {inForcePct === 100 && <span style={{ fontSize: "0.7rem", color: isSelected ? "rgba(255,255,255,0.8)" : "#1d6e52" }}>●</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status filter + heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {selectedCode
              ? `${selectedJxInfo?.label ?? selectedCode} — ${displayedLaws.length} law${displayedLaws.length !== 1 ? "s" : ""}`
              : statusFilter === "all"
                ? `All jurisdictions — ${displayedLaws.length} laws`
                : `${STATUS_LABEL[statusFilter]} — ${displayedLaws.length} law${displayedLaws.length !== 1 ? "s" : ""}`}
          </h2>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {["all", "in_force", "enacted", "proposed", "draft"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.78rem",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  background: statusFilter === s ? "var(--navy)" : "transparent",
                  color: statusFilter === s ? "#fff" : "var(--text)",
                  cursor: "pointer",
                  fontWeight: statusFilter === s ? 700 : 400,
                }}
              >
                {s === "all" ? "All statuses" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Law cards */}
        {displayedLaws.length === 0 ? (
          <div className="content-card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            No laws match the selected filters.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {displayedLaws.map((law) => (
              <Link
                key={law.slug}
                href={`/laws/${law.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div className="content-card" style={{ padding: "1rem 1.15rem", height: "100%", cursor: "pointer", transition: "box-shadow 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: STATUS_COLOR[law.status] ?? "var(--muted)",
                      background: STATUS_BG[law.status] ?? "var(--surface-alt)",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "999px",
                    }}>
                      {STATUS_LABEL[law.status] ?? law.status}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {law.jurisdiction_code}
                    </span>
                  </div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--navy)", lineHeight: 1.3, display: "block", marginBottom: "0.4rem" }}>
                    {law.short_title}
                  </strong>
                  <p style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
                    {law.summary_short.length > 110 ? law.summary_short.slice(0, 110) + "…" : law.summary_short}
                  </p>
                  {law.effective_date && (
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.6rem", fontStyle: "italic" }}>
                      Effective: {law.effective_date}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
