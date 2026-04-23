import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLawBySlug } from "@/lib/lexforge-data";
import { runRulesEngine } from "@/lib/rules-engine";
import { laws } from "@/lib/lexforge-data";
import type { AssessmentResult } from "@/lib/rules-engine";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  likely_applies: "Likely Applies",
  may_apply: "May Apply",
  unlikely: "Unlikely",
};

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

type PrintPageProps = { params: Promise<{ id: string }> };

export default async function PrintPage({ params }: PrintPageProps) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { results: true },
  });
  if (!assessment) notFound();

  // Reconstruct results with full obligation data by re-running the engine
  // using stored profile data, or fall back to DB results without obligations
  let results: AssessmentResult[] = [];
  try {
    const profile = {
      ...JSON.parse(assessment.companyProfile ?? "{}"),
      ...JSON.parse(assessment.productProfile ?? "{}"),
      ...JSON.parse(assessment.technicalProfile ?? "{}"),
    };
    // Ensure required fields have defaults
    if (profile.hq_region && profile.target_markets) {
      results = runRulesEngine(laws, {
        hq_region: profile.hq_region ?? "",
        company_size: profile.company_size ?? "startup",
        target_markets: profile.target_markets ?? [],
        product_type: profile.product_type ?? "saas",
        use_cases: profile.use_cases ?? [],
        deployment_context: profile.deployment_context ?? "public",
        uses_ai: profile.uses_ai ?? true,
        uses_biometric_data: profile.uses_biometric_data ?? false,
        processes_personal_data: profile.processes_personal_data ?? false,
        processes_eu_personal_data: profile.processes_eu_personal_data ?? false,
        automated_decisions: profile.automated_decisions ?? false,
      });
    }
  } catch {
    // Fallback: use DB results without obligations
    results = assessment.results.map((r) => {
      const law = getLawBySlug(r.lawSlug);
      return {
        law_id: r.lawSlug,
        law_slug: r.lawSlug,
        law_title: law?.title ?? r.lawSlug,
        law_short_title: law?.short_title ?? r.lawSlug,
        jurisdiction: law?.jurisdiction ?? "",
        jurisdiction_code: law?.jurisdiction_code ?? "",
        relevance_score: r.relevanceScore ?? 0,
        applicability_status: r.applicabilityStatus as AssessmentResult["applicability_status"],
        rationale: r.rationale ?? "",
        triggered_rules: [],
        triggered_obligations: [],
      };
    });
  }

  const applicable = results.filter((r) => r.applicability_status === "likely_applies");
  const mayApply = results.filter((r) => r.applicability_status === "may_apply");
  const unlikely = results.filter((r) => r.applicability_status === "unlikely");
  const allObligations = [...applicable, ...mayApply].flatMap((r) =>
    (r.triggered_obligations ?? []).map((o) => ({ ...o, lawShortTitle: r.law_short_title }))
  );
  const criticalCount = allObligations.filter((o) => o.priority === "critical").length;
  const date = new Date(assessment.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>LexForge Compliance Report — {date}</title>
        <style>{printStyles}</style>
        <script dangerouslySetInnerHTML={{ __html: "window.onload=()=>window.print()" }} />
      </head>
      <body>
        {/* Cover */}
        <div className="cover">
          <div className="brand">LexForge</div>
          <h1>AI Compliance Report</h1>
          <p className="meta">Generated {date} · Assessment ID {id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Executive summary */}
        <section>
          <h2>Executive Summary</h2>
          <table className="summary-table">
            <tbody>
              <tr>
                <th>Laws assessed</th>
                <td>{results.length}</td>
                <th>Likely applicable</th>
                <td className="red">{applicable.length}</td>
              </tr>
              <tr>
                <th>May apply</th>
                <td className="amber">{mayApply.length}</td>
                <th>Unlikely</th>
                <td className="green">{unlikely.length}</td>
              </tr>
              <tr>
                <th>Critical obligations</th>
                <td className="red">{criticalCount}</td>
                <th>Total obligations</th>
                <td>{allObligations.length}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Results */}
        <section>
          <h2>Regulatory Analysis</h2>
          {results
            .filter((r) => r.applicability_status !== "unlikely")
            .map((r) => (
              <div key={r.law_id} className="law-block">
                <div className="law-header">
                  <div>
                    <span className={`badge badge-${r.applicability_status}`}>{STATUS_LABEL[r.applicability_status]}</span>
                    <strong className="law-title">{r.law_short_title}</strong>
                    <span className="jx">{r.jurisdiction}</span>
                  </div>
                  <span className="score">{Math.round(r.relevance_score * 100)}%</span>
                </div>
                <p className="rationale">{r.rationale}</p>
                {(r.triggered_obligations ?? []).length > 0 && (
                  <div className="obligations">
                    {r.triggered_obligations.map((o) => (
                      <div key={o.id} className="obligation-row">
                        <span className={`pri pri-${o.priority}`}>{o.priority}</span>
                        <div>
                          <strong>{o.title}</strong>
                          {o.action_required && <p className="action">Action: {o.action_required}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {unlikely.length > 0 && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Unlikely to apply</h3>
              <ul className="unlikely-list">
                {unlikely.map((r) => (
                  <li key={r.law_id}>{r.law_short_title} — {r.jurisdiction}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Key Actions */}
        {allObligations.length > 0 && (
          <section className="page-break">
            <h2>Key Actions</h2>
            {PRIORITY_ORDER.filter((p) => allObligations.some((o) => o.priority === p)).map((priority) => (
              <div key={priority}>
                <h3 className={`priority-heading pri-${priority}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</h3>
                {allObligations
                  .filter((o) => o.priority === priority)
                  .map((o) => (
                    <div key={`${o.lawShortTitle}-${o.id}`} className="action-block">
                      <div className="action-meta">
                        <span className="action-law">{o.lawShortTitle}</span>
                        <span className="action-cat">{o.category}</span>
                        {o.citation && <span className="action-cite">{o.citation}</span>}
                      </div>
                      <strong>{o.title}</strong>
                      <p>{o.description}</p>
                      {o.action_required && (
                        <div className="action-callout">
                          <strong>Action: </strong>{o.action_required}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </section>
        )}

        {/* Footer */}
        <footer>
          <p>Generated by LexForge · lexforge.io · This report is for informational purposes only and does not constitute legal advice.</p>
        </footer>
      </body>
    </html>
  );
}

const printStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #0f1e30; background: #fff; padding: 0; }
  h1 { font-size: 28pt; font-weight: 700; margin: 0.5rem 0; }
  h2 { font-size: 16pt; font-weight: 700; border-bottom: 2px solid #0f1e30; padding-bottom: 0.35rem; margin: 1.5rem 0 0.85rem; }
  h3 { font-size: 12pt; font-weight: 700; margin: 1rem 0 0.5rem; }
  p { line-height: 1.5; margin: 0.35rem 0; }

  .cover { padding: 3cm 2cm 2cm; border-bottom: 4px solid #0f1e30; margin-bottom: 1rem; }
  .brand { font-size: 13pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #e63946; margin-bottom: 0.5rem; }
  .meta { color: #555; font-size: 10pt; margin-top: 0.5rem; }

  section { padding: 0.5rem 2cm; }
  .page-break { page-break-before: always; padding-top: 1rem; }

  .summary-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
  .summary-table th { text-align: left; font-size: 10pt; color: #555; padding: 0.4rem 0.75rem 0.4rem 0; width: 28%; }
  .summary-table td { font-size: 13pt; font-weight: 700; padding: 0.4rem 0.75rem 0.4rem 0; }
  .red { color: #e63946; }
  .amber { color: #915a1e; }
  .green { color: #2a7b62; }

  .law-block { border: 1px solid #dde; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 0.75rem; page-break-inside: avoid; }
  .law-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem; }
  .law-title { font-size: 12pt; font-weight: 700; margin: 0 0.5rem; }
  .jx { font-size: 9pt; color: #666; }
  .score { font-size: 18pt; font-weight: 700; color: #0f1e30; white-space: nowrap; }
  .rationale { font-size: 9.5pt; color: #444; margin-bottom: 0.5rem; }

  .badge { display: inline-block; font-size: 8pt; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; margin-right: 0.25rem; }
  .badge-likely_applies { background: #fde8ea; color: #c1121f; }
  .badge-may_apply { background: #fef3e2; color: #7d4e00; }
  .badge-unlikely { background: #e8f5ef; color: #1d6e52; }

  .obligations { border-top: 1px solid #eee; padding-top: 0.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .obligation-row { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 9.5pt; }
  .pri { display: inline-block; font-size: 7.5pt; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; white-space: nowrap; margin-top: 0.1rem; }
  .pri-critical { background: #fde8ea; color: #c1121f; }
  .pri-high { background: #fef3e2; color: #7d4e00; }
  .pri-medium { background: #e8f0fe; color: #1a56db; }
  .pri-low { background: #e8f5ef; color: #1d6e52; }
  .action { font-size: 9pt; color: #444; margin-top: 0.2rem; }

  .unlikely-list { font-size: 9.5pt; color: #555; padding-left: 1.25rem; }
  .unlikely-list li { margin-bottom: 0.2rem; }

  .action-block { border-left: 3px solid #dde; padding: 0.6rem 0.75rem; margin-bottom: 0.65rem; page-break-inside: avoid; }
  .action-meta { display: flex; gap: 0.75rem; font-size: 8.5pt; color: #666; margin-bottom: 0.35rem; }
  .action-law { font-weight: 700; color: #0f1e30; }
  .action-cat { font-style: italic; }
  .action-cite { margin-left: auto; }
  .action-callout { background: #e8f5ef; border-left: 3px solid #2a7b62; padding: 0.4rem 0.65rem; margin-top: 0.4rem; font-size: 9pt; }
  .priority-heading { font-size: 11pt; }
  .priority-heading.pri-critical { color: #c1121f; }
  .priority-heading.pri-high { color: #7d4e00; }
  .priority-heading.pri-medium { color: #1a56db; }
  .priority-heading.pri-low { color: #1d6e52; }

  footer { margin-top: 2rem; padding: 0.75rem 2cm; border-top: 1px solid #dde; font-size: 8pt; color: #888; }

  @media print {
    @page { margin: 1.5cm 1.5cm; size: A4; }
    body { padding: 0; }
    section { padding: 0; }
    .cover { padding: 0 0 1.5rem; }
    .page-break { page-break-before: always; }
  }
`;
