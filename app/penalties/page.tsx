"use client";

import { useState } from "react";

type FineStructure = {
  lawSlug: string;
  shortTitle: string;
  jurisdiction: string;
  tiers: {
    label: string;
    fixedMax?: number;    // fixed maximum in currency units
    revenueRate?: number; // fraction of annual revenue (e.g. 0.07 for 7%)
    currency: string;
    description: string;
    severity: "critical" | "high" | "medium";
  }[];
};

const FINE_DATA: FineStructure[] = [
  {
    lawSlug: "eu-ai-act",
    shortTitle: "EU AI Act",
    jurisdiction: "European Union",
    tiers: [
      { label: "Prohibited AI (Art. 5)", fixedMax: 35_000_000, revenueRate: 0.07, currency: "EUR", description: "Deploying a banned AI system", severity: "critical" },
      { label: "High-Risk violations (Art. 6–51)", fixedMax: 15_000_000, revenueRate: 0.03, currency: "EUR", description: "Non-compliance with high-risk requirements", severity: "high" },
      { label: "Incorrect information (Art. 8)", fixedMax: 7_500_000, revenueRate: 0.015, currency: "EUR", description: "Supplying incorrect information to notified bodies", severity: "medium" },
    ],
  },
  {
    lawSlug: "eu-gdpr-ai",
    shortTitle: "EU GDPR",
    jurisdiction: "European Union",
    tiers: [
      { label: "Major violations (Art. 83(5))", fixedMax: 20_000_000, revenueRate: 0.04, currency: "EUR", description: "Breaches of core principles, rights of data subjects, or international transfers", severity: "critical" },
      { label: "Minor violations (Art. 83(4))", fixedMax: 10_000_000, revenueRate: 0.02, currency: "EUR", description: "Non-compliance with processor obligations, DPO requirements, certification", severity: "high" },
    ],
  },
  {
    lawSlug: "colorado-ai-act",
    shortTitle: "Colorado AI Act",
    jurisdiction: "Colorado, USA",
    tiers: [
      { label: "Civil penalty", fixedMax: 20_000, currency: "USD", description: "Per violation of consumer AI rights (SB 24-205)", severity: "medium" },
      { label: "Pattern of violations", fixedMax: 500_000, currency: "USD", description: "Repeated or systemic non-compliance", severity: "high" },
    ],
  },
  {
    lawSlug: "illinois-ai-video-interview-act",
    shortTitle: "IL Video Interview Act",
    jurisdiction: "Illinois, USA",
    tiers: [
      { label: "Civil penalty", fixedMax: 15_000, currency: "USD", description: "Misuse of AI in video interview analysis", severity: "medium" },
    ],
  },
  {
    lawSlug: "nyc-local-law-144",
    shortTitle: "NYC Local Law 144",
    jurisdiction: "New York City, USA",
    tiers: [
      { label: "First violation", fixedMax: 500, currency: "USD", description: "Per day for initial non-compliance", severity: "medium" },
      { label: "Subsequent violations", fixedMax: 1_500, currency: "USD", description: "Per day for continued non-compliance", severity: "high" },
    ],
  },
  {
    lawSlug: "uk-ai-pro-innovation-framework",
    shortTitle: "UK AI Framework",
    jurisdiction: "United Kingdom",
    tiers: [
      { label: "ICO enforcement (GDPR-UK)", fixedMax: 17_500_000, revenueRate: 0.04, currency: "GBP", description: "UK GDPR / Data Protection Act violations involving AI", severity: "high" },
    ],
  },
  {
    lawSlug: "california-ccpa-cpra",
    shortTitle: "CA Privacy (CCPA/CPRA)",
    jurisdiction: "California, USA",
    tiers: [
      { label: "Intentional violation", fixedMax: 7_500, currency: "USD", description: "Per consumer per incident (CCPA/CPRA — applies to AI profiling and automated decisions)", severity: "high" },
      { label: "Unintentional violation", fixedMax: 2_500, currency: "USD", description: "Per consumer per incident", severity: "medium" },
    ],
  },
  {
    lawSlug: "brazil-ai-bill",
    shortTitle: "Brazil AI Bill",
    jurisdiction: "Brazil",
    tiers: [
      { label: "Per violation", revenueRate: 0.02, currency: "BRL", description: "Up to 2% of Brazil revenue, capped at R$50 million per violation", severity: "high" },
    ],
  },
  {
    lawSlug: "china-ai-regulations",
    shortTitle: "China AI Regulations",
    jurisdiction: "China",
    tiers: [
      { label: "Business operations penalty", fixedMax: 1_000_000, currency: "CNY", description: "For non-compliant generative AI services", severity: "high" },
      { label: "Serious violations", fixedMax: 10_000_000, currency: "CNY", description: "Criminal referral possible", severity: "critical" },
    ],
  },
  {
    lawSlug: "india-dpdp-act",
    shortTitle: "India DPDP Act",
    jurisdiction: "India",
    tiers: [
      { label: "Data principal rights", fixedMax: 100_000_000, currency: "INR", description: "Failure to honour data principal rights (₹10 crore)", severity: "high" },
      { label: "Major breaches", fixedMax: 2_500_000_000, currency: "INR", description: "Major data breaches (₹250 crore)", severity: "critical" },
    ],
  },
];

const CURRENCY_LABELS: Record<string, string> = {
  EUR: "EUR (€)",
  USD: "USD ($)",
  GBP: "GBP (£)",
  BRL: "BRL (R$)",
  CNY: "CNY (¥)",
  INR: "INR (₹)",
};

const SEVERITY_COLOR = {
  critical: { bg: "#fee2e2", text: "#b91c1c" },
  high: { bg: "#fef3c7", text: "#b45309" },
  medium: { bg: "#dbeafe", text: "#1d4ed8" },
};

function fmt(n: number, currency: string): string {
  const sym = { EUR: "€", USD: "$", GBP: "£", BRL: "R$", CNY: "¥", INR: "₹" }[currency] ?? "";
  if (n >= 1_000_000_000) return `${sym}${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(0)}K`;
  return `${sym}${n.toLocaleString()}`;
}

export default function PenaltiesPage() {
  const [revenue, setRevenue] = useState<string>("");
  const [currency, setCurrency] = useState("EUR");
  const [selected, setSelected] = useState<Set<string>>(new Set(["eu-ai-act", "eu-gdpr-ai"]));

  const revNum = parseFloat(revenue.replace(/[^0-9.]/g, "")) || 0;

  type Exposure = {
    lawSlug: string;
    shortTitle: string;
    jurisdiction: string;
    tierLabel: string;
    description: string;
    severity: "critical" | "high" | "medium";
    maxFine: number;
    currency: string;
  };

  const exposures: Exposure[] = [];
  for (const law of FINE_DATA) {
    if (!selected.has(law.lawSlug)) continue;
    for (const tier of law.tiers) {
      let maxFine = tier.fixedMax ?? 0;
      if (tier.revenueRate && revNum > 0) {
        const revBased = revNum * tier.revenueRate;
        maxFine = Math.max(maxFine, revBased);
      }
      if (maxFine === 0 && revNum === 0 && tier.revenueRate) {
        // show a placeholder
        exposures.push({ ...law, tierLabel: tier.label, description: tier.description, severity: tier.severity, maxFine: 0, currency: tier.currency });
        continue;
      }
      if (maxFine === 0) continue;
      exposures.push({ ...law, tierLabel: tier.label, description: tier.description, severity: tier.severity, maxFine, currency: tier.currency });
    }
  }

  exposures.sort((a, b) => {
    const sev = { critical: 3, high: 2, medium: 1 };
    if (sev[b.severity] !== sev[a.severity]) return sev[b.severity] - sev[a.severity];
    return b.maxFine - a.maxFine;
  });

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "var(--navy)", marginBottom: "0.4rem" }}>
            Penalty Calculator
          </h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Estimate your maximum fine exposure across AI and data privacy laws worldwide.
            Enter your annual global revenue, then select every law that applies to your organisation.
            The calculator ranks penalties from largest to smallest, showing both fixed caps and
            revenue-based percentages so you can see where your biggest compliance risk sits.
          </p>
        </div>

        <div className="article-layout">
          {/* Left — inputs */}
          <div>
            {/* Revenue input */}
            <div className="sidebar-card" style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Your organisation</h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontWeight: 600, fontSize: "0.9rem" }}>
                  Annual global revenue
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select
                      aria-label="Revenue currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontSize: "0.875rem", color: "var(--text)", flexShrink: 0 }}
                    >
                      {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Annual global revenue amount"
                      placeholder="e.g. 50000000"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.875rem", color: "var(--text)" }}
                    />
                  </div>
                  {revNum > 0 && (
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400 }}>
                      = {fmt(revNum, currency)} annual revenue
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Law selector */}
            <div className="sidebar-card">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Applicable laws</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>Select all laws that may apply to your operations.</p>
              <div className="stack">
                {FINE_DATA.map((law) => (
                  <label key={law.lawSlug} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", padding: "0.45rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.875rem" }}>
                    <input
                      type="checkbox"
                      checked={selected.has(law.lawSlug)}
                      onChange={() => toggle(law.lawSlug)}
                      style={{ accentColor: "var(--navy)", width: "1rem", height: "1rem", flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>
                      <strong style={{ color: "var(--navy)" }}>{law.shortTitle}</strong>
                      <span style={{ color: "var(--muted)", marginLeft: "0.4rem", fontSize: "0.8rem" }}>({law.jurisdiction})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right — results */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Fine exposure {selected.size === 0 ? "— select laws above" : `across ${selected.size} law${selected.size > 1 ? "s" : ""}`}
            </h2>

            {exposures.length === 0 && (
              <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                Select at least one law to see fine exposure.
              </div>
            )}

            <div className="stack">
              {exposures.map((ex, i) => {
                const colors = SEVERITY_COLOR[ex.severity];
                return (
                  <div key={i} className="card" style={{ padding: "1rem 1.15rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.text, background: colors.bg, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                          {ex.severity}
                        </span>
                        <strong style={{ display: "block", marginTop: "0.4rem", color: "var(--navy)", fontSize: "0.95rem" }}>
                          {ex.shortTitle} — {ex.tierLabel}
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{ex.jurisdiction}</span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {ex.maxFine > 0 ? (
                          <>
                            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: ex.severity === "critical" ? "#b91c1c" : "var(--navy)" }}>
                              {fmt(ex.maxFine, ex.currency)}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{ex.currency} max</div>
                          </>
                        ) : (
                          <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>Enter revenue to calculate</div>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.83rem", color: "var(--muted)" }}>{ex.description}</p>
                  </div>
                );
              })}
            </div>

            {exposures.length > 0 && (
              <div className="callout" style={{ marginTop: "1.5rem" }}>
                <p style={{ fontWeight: 700, color: "var(--navy)", margin: 0, fontSize: "0.9rem" }}>Disclaimer</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  These are indicative maximum penalties for awareness purposes only. Actual fines depend on many factors including violation severity, intent, cooperation, and remediation steps taken. This is not legal advice. Always consult a qualified legal professional.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
