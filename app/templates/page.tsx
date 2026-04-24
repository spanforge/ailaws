import Link from "next/link";
import { TEMPLATE_LIBRARY } from "@/lib/smb";

export const metadata = {
  title: "Templates - Spanforge Compass",
  description: "Download practical AI compliance templates for small teams.",
};

export default function TemplatesPage() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <p className="kicker">Template Library</p>
        <h1
          style={{
            margin: "0.4rem 0 0.5rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          Download starter templates for your team
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Founder-ready policies, notices, and checklists in editable document format for internal rollout, procurement, and external review.
        </p>

        <div className="card-grid">
          {TEMPLATE_LIBRARY.map((template) => (
            <div key={template.slug} className="content-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
                <div>
                  <span className="micro">{template.intendedUser}</span>
                  <h2 style={{ margin: "0.55rem 0 0.35rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>
                    {template.title}
                  </h2>
                </div>
                <a href={`/templates/${template.slug}`} className="button button--primary" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
                  Download {template.formatLabel}
                </a>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.92rem", margin: "0 0 0.85rem" }}>{template.useCase}</p>
              <div style={{ display: "grid", gap: "0.55rem" }}>
                <div style={{ padding: "0.75rem 0.85rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    Last reviewed
                  </p>
                  <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem" }}>{template.lastReviewed}</p>
                </div>
                <div style={{ padding: "0.75rem 0.85rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    Format
                  </p>
                  <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem" }}>{template.formatLabel} for browser, Word, and Google Docs</p>
                </div>
                <div style={{ padding: "0.75rem 0.85rem", borderRadius: "12px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    Disclaimer
                  </p>
                  <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem", lineHeight: 1.5 }}>{template.disclaimer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link href="/assess" className="button">
            Run assessment →
          </Link>
        </div>
      </div>
    </main>
  );
}
