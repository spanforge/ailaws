"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { laws as allLaws, JURISDICTIONS, type Law } from "@/lib/lexforge-data";

function CompareTool() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("add");

  const [selected, setSelected] = useState<Law[]>(() => {
    if (initialSlug) {
      const law = allLaws.find((l) => l.slug === initialSlug);
      return law ? [law] : [];
    }
    return [];
  });

  const [search, setSearch] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");

  const filteredLaws = allLaws.filter((law) => {
    const matchesSearch =
      !search ||
      law.short_title.toLowerCase().includes(search.toLowerCase()) ||
      law.jurisdiction.toLowerCase().includes(search.toLowerCase());
    const matchesJurisdiction =
      jurisdiction === "all" || law.jurisdiction_code === jurisdiction;
    return matchesSearch && matchesJurisdiction && !selected.find((s) => s.id === law.id);
  });

  function addLaw(law: Law) {
    if (selected.length >= 4) return;
    setSelected((prev) => [...prev, law]);
  }

  function removeLaw(id: string) {
    setSelected((prev) => prev.filter((l) => l.id !== id));
  }

  const STATUS_LABEL: Record<string, string> = {
    in_force: "✅ In Force",
    enacted: "✅ Enacted",
    proposed: "🕐 Proposed",
    draft: "📝 Draft",
  };

  const CONTENT_TYPE_LABEL: Record<string, string> = {
    regulation: "Regulation",
    directive: "Directive",
    act: "Act",
    executive_order: "Executive Order",
    framework: "Framework",
    guideline: "Guideline",
  };

  const dimensions = [
    { key: "jurisdiction", label: "Jurisdiction", render: (l: Law) => l.jurisdiction },
    { key: "status", label: "Status", render: (l: Law) => STATUS_LABEL[l.status] ?? l.status },
    { key: "content_type", label: "Type", render: (l: Law) => CONTENT_TYPE_LABEL[l.content_type] ?? l.content_type },
    { key: "effective_date", label: "Effective Date", render: (l: Law) => l.effective_date || "—" },
    { key: "issuing_body", label: "Issuing Body", render: (l: Law) => l.issuing_body },
    { key: "obligations", label: "Obligations", render: (l: Law) => `${l.obligations.length} documented` },
    { key: "topics", label: "Key Topics", render: (l: Law) => l.topics.slice(0, 3).join(", ") },
    { key: "summary_short", label: "Summary", render: (l: Law) => l.summary_short },
  ];

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <p className="kicker">Compare</p>
        <h1 style={{ margin: "0.4rem 0 0.5rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
          Compare AI regulations
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Select up to 4 laws to compare side-by-side.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem", alignItems: "start" }}>
          {/* Law selector */}
          <div>
            <div className="sidebar-card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.85rem" }}>Add a law</h3>
              <div className="field" style={{ marginBottom: "0.65rem" }}>
                <input
                  type="search"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="field" style={{ marginBottom: "0.85rem" }}>
                <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
                  <option value="all">All jurisdictions</option>
                  {JURISDICTIONS.map((j) => (
                    <option key={j.code} value={j.code}>{j.label}</option>
                  ))}
                </select>
              </div>
              <div className="stack stack--compact">
                {filteredLaws.map((law) => (
                  <button
                    key={law.id}
                    type="button"
                    className="button"
                    onClick={() => addLaw(law)}
                    disabled={selected.length >= 4}
                    style={{ justifyContent: "flex-start", fontSize: "0.88rem", padding: "0.55rem 0.9rem", textAlign: "left" }}
                  >
                    + {law.short_title}
                  </button>
                ))}
                {filteredLaws.length === 0 && (
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>No laws to add.</p>
                )}
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div>
            {selected.length === 0 ? (
              <div className="callout">
                <p>Select at least one law from the panel to start comparing.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "180px", textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.82rem", color: "var(--muted)", fontWeight: 700 }}>
                        Dimension
                      </th>
                      {selected.map((law) => (
                        <th key={law.id} style={{ textAlign: "left", padding: "0.5rem 0.75rem", minWidth: "220px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem" }}>
                            <span style={{ color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1rem" }}>{law.short_title}</span>
                            <button
                              type="button"
                              onClick={() => removeLaw(law.id)}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "999px", border: "1px solid rgba(16,32,48,0.15)", background: "rgba(230,57,70,0.1)", color: "var(--red)", cursor: "pointer", fontSize: "0.8rem", flexShrink: 0 }}
                            >
                              ✕
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dimensions.map((dim) => (
                      <tr key={dim.key}>
                        <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", verticalAlign: "top" }}>
                          {dim.label}
                        </td>
                        {selected.map((law) => (
                          <td
                            key={law.id}
                            style={{
                              padding: "0.65rem 0.75rem",
                              fontSize: "0.9rem",
                              color: "var(--navy)",
                              background: "rgba(255,255,255,0.7)",
                              borderRadius: "12px",
                              verticalAlign: "top",
                              lineHeight: 1.5,
                            }}
                          >
                            {dim.render(law)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" }}>
                        Actions
                      </td>
                      {selected.map((law) => (
                        <td key={law.id} style={{ padding: "0.65rem 0.75rem" }}>
                          <Link href={`/laws/${law.slug}`} className="button" style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}>
                            Full details →
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="shell" style={{ paddingTop: "3rem" }}><p style={{ color: "var(--muted)" }}>Loading…</p></div>}>
      <CompareTool />
    </Suspense>
  );
}
