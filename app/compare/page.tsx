"use client";

import { useState, useRef, Suspense } from "react";
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
  const [showComparison, setShowComparison] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

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
    setShowComparison(false); // reset so user clicks Compare again
  }

  function removeLaw(id: string) {
    setSelected((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (next.length < 2) setShowComparison(false);
      return next;
    });
  }

  function handleCompare() {
    setShowComparison(true);
    setTimeout(() => {
      comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const STATUS_LABEL: Record<string, string> = {
    in_force: "In Force",
    enacted: "Enacted",
    proposed: "Proposed",
    draft: "Draft",
  };

  const STATUS_COLOR: Record<string, string> = {
    in_force: "var(--green)",
    enacted: "var(--green)",
    proposed: "var(--amber)",
    draft: "var(--muted)",
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
    {
      key: "status", label: "Status", render: (l: Law) => (
        <span style={{ color: STATUS_COLOR[l.status] ?? "var(--muted)", fontWeight: 600 }}>
          {STATUS_LABEL[l.status] ?? l.status}
        </span>
      )
    },
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
        {/* Page header */}
        <p className="kicker">Compare</p>
        <h1 style={{ margin: "0.4rem 0 0.5rem", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
          Compare AI regulations
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Add up to 4 laws, then click <strong>Compare</strong> to see a side-by-side breakdown.
        </p>

        {/* Search controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            type="search"
            placeholder="Search laws by name or jurisdiction…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "0.95rem" }}
          />
          <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
            <option value="all">All jurisdictions</option>
            {JURISDICTIONS.map((j) => (
              <option key={j.code} value={j.code}>{j.label}</option>
            ))}
          </select>
        </div>

        {/* Selected laws strip */}
        {selected.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            padding: "0.85rem 1rem",
            background: "var(--primary-light)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1rem",
          }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
              Selected ({selected.length}/4)
            </span>
            {selected.map((law) => (
              <span key={law.id} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.5rem 0.3rem 0.75rem",
                background: "#fff",
                border: "1px solid rgba(37,99,235,0.25)",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text)",
              }}>
                {law.short_title}
                <button
                  type="button"
                  onClick={() => removeLaw(law.id)}
                  title={`Remove ${law.short_title}`}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: "none", background: "rgba(220,38,38,0.1)", color: "var(--red)",
                    cursor: "pointer", fontSize: "0.7rem", lineHeight: 1, padding: 0,
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
            <div style={{ flex: 1 }} />
            {selected.length < 2 ? (
              <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Add {2 - selected.length} more to compare</span>
            ) : (
              <button
                type="button"
                className="button button--primary"
                onClick={handleCompare}
                style={{ fontSize: "0.9rem", padding: "0.5rem 1.1rem" }}
              >
                Compare {selected.length} laws →
              </button>
            )}
          </div>
        )}

        {/* Law list */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.5rem", marginBottom: "2rem" }}>
          {filteredLaws.map((law) => (
            <button
              key={law.id}
              type="button"
              onClick={() => addLaw(law)}
              disabled={selected.length >= 4}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.65rem 0.9rem",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-xs)",
                cursor: selected.length >= 4 ? "not-allowed" : "pointer",
                opacity: selected.length >= 4 ? 0.5 : 1,
                textAlign: "left",
                fontSize: "0.88rem",
                fontWeight: 500,
                color: "var(--text)",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { if (selected.length < 4) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)"; }}
            >
              <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1rem", lineHeight: 1 }}>+</span>
              <span style={{ flex: 1 }}>{law.short_title}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{law.jurisdiction_code?.toUpperCase()}</span>
            </button>
          ))}
          {filteredLaws.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0, gridColumn: "1 / -1" }}>No laws match your search.</p>
          )}
        </div>

        {/* Comparison table */}
        {showComparison && selected.length >= 2 && (
          <div ref={comparisonRef} style={{ scrollMarginTop: "80px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                Side-by-side comparison
              </h2>
              <button
                type="button"
                className="button btn--sm"
                onClick={() => setShowComparison(false)}
              >
                Hide
              </button>
            </div>
            <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${selected.length * 220 + 180}px` }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{
                      width: "160px", textAlign: "left", padding: "0.85rem 1rem",
                      fontSize: "0.78rem", color: "var(--muted)", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      background: "var(--surface-alt)",
                    }}>
                      Dimension
                    </th>
                    {selected.map((law) => (
                      <th key={law.id} style={{
                        textAlign: "left", padding: "0.85rem 1rem",
                        background: "var(--surface-alt)",
                        borderLeft: "1px solid var(--line)",
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                          <div>
                            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
                              {law.short_title}
                            </p>
                            <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
                              {law.jurisdiction}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLaw(law.id)}
                            title="Remove"
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: "22px", height: "22px", flexShrink: 0,
                              borderRadius: "50%", border: "1px solid var(--line)",
                              background: "var(--red-light)", color: "var(--red)",
                              cursor: "pointer", fontSize: "0.72rem",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dimensions.map((dim, i) => (
                    <tr key={dim.key} style={{ borderBottom: "1px solid var(--line)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-alt)" }}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", verticalAlign: "top" }}>
                        {dim.label}
                      </td>
                      {selected.map((law) => (
                        <td
                          key={law.id}
                          style={{
                            padding: "0.75rem 1rem",
                            fontSize: "0.9rem",
                            color: "var(--text)",
                            borderLeft: "1px solid var(--line)",
                            verticalAlign: "top",
                            lineHeight: 1.55,
                          }}
                        >
                          {dim.render(law)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid var(--line)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>
                      Actions
                    </td>
                    {selected.map((law) => (
                      <td key={law.id} style={{ padding: "0.75rem 1rem", borderLeft: "1px solid var(--line)" }}>
                        <Link href={`/laws/${law.slug}`} className="button btn--sm">
                          Full details →
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
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
