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
            <div key={template.slug} className="content-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <span className="micro">{template.intendedUser}</span>
                <span className="tag">{template.formatLabel}</span>
              </div>
              <h2 style={{ margin: "0.25rem 0 0.5rem", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>
                {template.title}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.92rem", margin: "0 0 1rem", flex: 1 }}>{template.useCase}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ padding: "0.65rem 0.75rem", borderRadius: "var(--radius-xs)", background: "var(--surface-alt)", border: "1px solid var(--line)" }}>
                  <p style={{ margin: "0 0 0.15rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    Reviewed
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>{template.lastReviewed}</p>
                </div>
                <div style={{ padding: "0.65rem 0.75rem", borderRadius: "var(--radius-xs)", background: "var(--surface-alt)", border: "1px solid var(--line)" }}>
                  <p style={{ margin: "0 0 0.15rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    Format
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>{template.formatLabel}</p>
                </div>
              </div>
              <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--text)" }}>Note:</strong> {template.disclaimer}
              </p>
              <a href={`/templates/${template.slug}`} className="button button--primary" style={{ textDecoration: "none", textAlign: "center" }}>
                Download {template.formatLabel} →
              </a>
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
