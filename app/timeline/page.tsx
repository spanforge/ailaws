import Link from "next/link";
import { laws } from "@/lib/lexforge-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Law Timeline",
  description: "Chronological view of AI regulations — when laws were enacted and when they take effect worldwide.",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  in_force:  { bg: "var(--green-light)",   text: "var(--green)" },
  enacted:   { bg: "var(--primary-light)", text: "var(--primary)" },
  proposed:  { bg: "var(--amber-light)",  text: "var(--amber)" },
  draft:     { bg: "var(--surface-alt)",  text: "var(--muted)" },
  repealed:  { bg: "var(--red-light)",    text: "var(--red)" },
};

const STATUS_LABEL: Record<string, string> = {
  in_force: "In Force",
  enacted: "Enacted",
  proposed: "Proposed",
  draft: "Draft",
  repealed: "Repealed",
};

type TimelineEntry = {
  date: string;
  kind: "adopted" | "effective";
  law: (typeof laws)[number];
};

export default function TimelinePage() {
  // Build flat list of all date events
  const events: TimelineEntry[] = [];
  for (const law of laws) {
    if (law.adopted_date) events.push({ date: law.adopted_date, kind: "adopted", law });
    if (law.effective_date && law.effective_date !== law.adopted_date) {
      events.push({ date: law.effective_date, kind: "effective", law });
    }
  }

  // Sort by date descending (most recent first)
  events.sort((a, b) => b.date.localeCompare(a.date));

  // Group by year
  const byYear: Record<string, TimelineEntry[]> = {};
  for (const ev of events) {
    const year = ev.date.slice(0, 4);
    (byYear[year] ??= []).push(ev);
  }
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="kicker">History</p>
          <h1 style={{ margin: "0.4rem 0 0.5rem", fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            AI Regulation Timeline
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "55ch" }}>
            A chronological view of when AI laws were adopted and when they take effect — from 2016 to today.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <LegendPill label="Adopted / Enacted" bg="var(--primary-light)" text="var(--primary)" />
            <LegendPill label="Effective / Applies" bg="var(--green-light)" text="var(--green)" />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          {(["in_force", "enacted", "proposed", "draft"] as const).map((s) => {
            const count = laws.filter((l) => l.status === s).length;
            const c = STATUS_COLOR[s];
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.text, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}><strong style={{ color: "var(--navy)" }}>{count}</strong> {STATUS_LABEL[s]}</span>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", paddingLeft: "2rem" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: "0.55rem", top: 0, bottom: 0, width: 2, background: "var(--line)" }} />

          {years.map((year) => (
            <div key={year} style={{ marginBottom: "2.5rem" }}>
              {/* Year marker */}
              <div style={{ position: "relative", marginBottom: "1.25rem" }}>
                <div style={{ position: "absolute", left: "-2rem", top: "50%", transform: "translateY(-50%)", width: "1.1rem", height: "1.1rem", borderRadius: "50%", background: "var(--navy)", border: "2px solid white", boxShadow: "0 0 0 2px var(--navy)" }} />
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)" }}>{year}</h2>
              </div>

              <div className="stack">
                {byYear[year].map((ev, idx) => {
                  const sc = STATUS_COLOR[ev.law.status];
                  const isEffective = ev.kind === "effective";
                  return (
                    <div key={`${ev.law.slug}-${ev.kind}-${idx}`} style={{ position: "relative" }}>
                      {/* Dot */}
                      <div style={{ position: "absolute", left: "-1.65rem", top: "1rem", width: "0.65rem", height: "0.65rem", borderRadius: "50%", background: isEffective ? "var(--green)" : "var(--primary)", border: "2px solid white", boxShadow: `0 0 0 2px ${isEffective ? "var(--green)" : "var(--primary)"}` }} />

                      <Link href={`/laws/${ev.law.slug}`} style={{ textDecoration: "none" }}>
                        <div className="content-card" style={{ padding: "0.9rem 1.1rem", cursor: "pointer", borderLeft: `3px solid ${isEffective ? "var(--green)" : "var(--primary)"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.15rem 0.5rem", borderRadius: "999px", background: isEffective ? "var(--green-light)" : "var(--primary-light)", color: isEffective ? "var(--green)" : "var(--primary)" }}>
                                  {isEffective ? "Effective" : "Adopted"}
                                </span>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.15rem 0.5rem", borderRadius: "999px", background: sc.bg, color: sc.text }}>
                                  {STATUS_LABEL[ev.law.status]}
                                </span>
                              </div>
                              <strong style={{ color: "var(--navy)", fontSize: "0.95rem", lineHeight: 1.3 }}>{ev.law.short_title}</strong>
                              <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>{ev.law.jurisdiction}</p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)" }}>
                                {formatDate(ev.date)}
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5 }}>
                            {ev.law.summary_short.length > 120 ? ev.law.summary_short.slice(0, 120) + "…" : ev.law.summary_short}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

function LegendPill({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.7rem", borderRadius: "999px", background: bg, color: text, border: "1px solid var(--line)", fontSize: "0.8rem", fontWeight: 600 }}>
      {label}
    </span>
  );
}
