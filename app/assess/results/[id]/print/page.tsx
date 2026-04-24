import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { laws } from "@/lib/lexforge-data";
import { buildAssessmentAssumptions, buildComplianceAnalysis } from "@/lib/compliance-analysis";
import { runRulesEngine, type AssessmentInput, type AssessmentResult } from "@/lib/rules-engine";
import {
  buildActionPlan,
  buildExecutiveVerdict,
  buildKeySources,
  buildPenaltySnapshot,
  buildProductSummary,
  buildRecommendedControls,
  enrichAssessmentResults,
  getActionTimelineLabel,
  getProductPresetById,
} from "@/lib/smb";
import { buildClauseGapReport, buildTrustScorecard } from "@/lib/workspace-intelligence";
import { PrintButton, PrintTrigger } from "@/components/print-trigger";

export const dynamic = "force-dynamic";

type PrintPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> };

const EXPORT_TYPES = {
  standard: "Full Compliance Report",
  governance: "AI Governance Summary",
  applicability: "Regulatory Applicability Memo",
  evidence: "Evidence Checklist",
  trust: "Customer Trust Packet",
} as const;

type ExportType = keyof typeof EXPORT_TYPES;

function parseAssessmentInput(companyProfile: string, productProfile: string, technicalProfile: string): AssessmentInput {
  return {
    ...JSON.parse(companyProfile ?? "{}"),
    ...JSON.parse(productProfile ?? "{}"),
    ...JSON.parse(technicalProfile ?? "{}"),
  } as AssessmentInput;
}

export default async function PrintPage({ params, searchParams }: PrintPageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  const exportType: ExportType = (type as ExportType) in EXPORT_TYPES ? (type as ExportType) : "standard";

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { results: true },
  });

  if (!assessment) notFound();

  const input = parseAssessmentInput(assessment.companyProfile, assessment.productProfile, assessment.technicalProfile);
  const results: AssessmentResult[] = runRulesEngine(laws, input);
  const enriched = enrichAssessmentResults(results, input);
  const applicable = enriched.filter((result) => result.applicability_status === "likely_applies");
  const mayApply = enriched.filter((result) => result.applicability_status === "may_apply");
  const actionPlan = buildActionPlan(results);
  const penalties = buildPenaltySnapshot(results);
  const sources = buildKeySources(results);
  const preset = getProductPresetById(input.product_preset);
  const verdict = buildExecutiveVerdict(results, input);
  const controls = buildRecommendedControls(results);
  const analysis = buildComplianceAnalysis(input, results, []);
  const assumptions = buildAssessmentAssumptions(input, analysis.normalizedInput);
  const trust = buildTrustScorecard(enriched, []);
  const gapReport = buildClauseGapReport(results, []);
  const createdAt = new Date(assessment.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const exportTitle = EXPORT_TYPES[exportType];

  return (
    <>
      <PrintTrigger />
      <style>{printStyles}</style>
      <main className="print-page">
        <div className="print-toolbar">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {(Object.entries(EXPORT_TYPES) as [ExportType, string][]).map(([key, label]) => (
              <a
                key={key}
                href={`?type=${key}`}
                style={{
                  fontSize: "9pt",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "999px",
                  border: `1px solid ${exportType === key ? "#102030" : "#d9dde2"}`,
                  background: exportType === key ? "#102030" : "transparent",
                  color: exportType === key ? "#fff" : "#102030",
                  textDecoration: "none",
                  fontWeight: exportType === key ? 700 : 400,
                }}
              >
                {label}
              </a>
            ))}
          </div>
          <PrintButton />
        </div>

        <section className="cover page-break-after">
          <div className="brand">Spanforge Compass</div>
          <h1>{exportTitle}</h1>
          <p className="subhead">
            {exportType === "governance" && "AI governance posture, recommended controls, and accountability framework — suitable for enterprise procurement review."}
            {exportType === "applicability" && "Regulatory applicability memo: which laws apply, why, and what your obligations are — ready for legal review."}
            {exportType === "evidence" && "Evidence readiness checklist: obligation-by-obligation proof requirements, owners, and target dates."}
            {exportType === "trust" && "Customer-facing trust summary: data practices, compliance posture, and AI accountability commitments."}
            {exportType === "standard" && "Founder-ready summary for AI law exposure, next actions, and source links."}
          </p>
          <div className="cover-grid">
            <div className="metric">
              <span>Assessment date</span>
              <strong>{createdAt}</strong>
            </div>
            <div className="metric">
              <span>Preset</span>
              <strong>{preset?.title ?? "Custom assessment"}</strong>
            </div>
            <div className="metric">
              <span>Likely applies</span>
              <strong>{applicable.length}</strong>
            </div>
            <div className="metric">
              <span>Verdict</span>
              <strong>{verdict.label}</strong>
            </div>
          </div>
        </section>

        {/* ── GOVERNANCE EXPORT ── */}
        {exportType === "governance" ? (
          <>
            <section>
              <h2>Executive verdict</h2>
              <div className="panel" style={{ marginBottom: "0.9rem" }}>
                <strong style={{ fontSize: "12pt" }}>{verdict.headline}</strong>
                <p>{verdict.summary}</p>
              </div>
              <div className="two-col">
                <div>
                  <h3>Top risks</h3>
                  <ul>{verdict.topRisks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
                <div>
                  <h3>Immediate actions</h3>
                  <ul>{verdict.immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
              </div>
              <p><strong>Recommended owner:</strong> {verdict.ownerRecommendation}</p>
            </section>
            <section className="page-break-before">
              <h2>Recommended controls</h2>
              {controls.map((group) => (
                <div key={group.category} className="panel" style={{ marginBottom: "0.75rem" }}>
                  <h3>{group.category}</h3>
                  <ul>{group.controls.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              ))}
            </section>
            <section>
              <h2>Trust posture</h2>
              <div className="two-col">
                {trust.dimensions.map((d) => (
                  <div key={d.key} className="metric">
                    <span>{d.label}</span>
                    <strong>{d.score}/100</strong>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "9pt" }}>{d.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {/* ── APPLICABILITY MEMO ── */}
        {exportType === "applicability" ? (
          <>
            <section>
              <h2>Regulatory applicability summary</h2>
              <p>Based on the product profile assessed on {createdAt}, the following regulatory regimes have been identified as applicable.</p>
              {[...applicable, ...mayApply].map((result) => (
                <div key={result.law_id} className="result-card" style={{ marginBottom: "1rem" }}>
                  <div className="result-header">
                    <div>
                      <span className={`badge badge-${result.applicability_status}`}>{result.applicability_status.replace(/_/g, " ")}</span>
                      <strong>{result.law_short_title}</strong>
                      <span style={{ fontSize: "9pt", marginLeft: "0.4rem" }}>{result.jurisdiction}</span>
                    </div>
                    <span className="score">{Math.round(result.relevance_score * 100)}%</span>
                  </div>
                  <p>{result.founderSummary}</p>
                  <div style={{ marginTop: "0.5rem" }}>
                    <strong style={{ fontSize: "9pt" }}>Why this regime applies:</strong>
                    <p style={{ fontSize: "9pt" }}>{result.whyYouMatched}</p>
                  </div>
                  {result.triggered_obligations.length > 0 ? (
                    <div style={{ marginTop: "0.5rem" }}>
                      <strong style={{ fontSize: "9pt" }}>Key obligations triggered ({result.triggered_obligations.length}):</strong>
                      <ul>
                        {result.triggered_obligations.slice(0, 4).map((ob) => (
                          <li key={ob.id} style={{ fontSize: "9pt" }}>
                            <strong>[{ob.priority.toUpperCase()}]</strong> {ob.title}
                            {ob.citation ? ` — ${ob.citation}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </section>
            <section>
              <h2>Penalty exposure</h2>
              <ul>
                {penalties.map((p) => <li key={p.lawSlug}><strong>{p.lawShortTitle}:</strong> {p.summary}</li>)}
              </ul>
              <h3 style={{ marginTop: "1rem" }}>Assessment assumptions</h3>
              <ul>
                {assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
              </ul>
              <p style={{ fontSize: "9pt", marginTop: "0.75rem" }}>This memo is informational only and does not constitute legal advice. Review with qualified counsel before relying on for compliance decisions.</p>
            </section>
          </>
        ) : null}

        {/* ── EVIDENCE CHECKLIST EXPORT ── */}
        {exportType === "evidence" ? (
          <section>
            <h2>Evidence readiness checklist</h2>
            <p>Each obligation triggered by the assessment is listed below with the required proof type, suggested owner, and target completion date.</p>
            {gapReport.entries.map((entry) => (
              <div key={`${entry.lawSlug}-${entry.obligationTitle}`} className="action-card" style={{ marginBottom: "0.75rem" }}>
                <div className="action-meta">
                  <span className={entry.status === "covered" ? "badge-likely_applies" : "badge-may_apply"} style={{ fontSize: "8pt", border: "1px solid #d9dde2", borderRadius: "999px", padding: "0.1rem 0.4rem" }}>
                    {entry.status.replace(/_/g, " ")}
                  </span>
                  <span>{entry.priority}</span>
                  <span>{entry.lawShortTitle}</span>
                  <span>{entry.category}</span>
                </div>
                <strong>{entry.obligationTitle}</strong>
                {entry.citation ? <div className="citation">{entry.citation}</div> : null}
                <p style={{ fontSize: "9pt" }}>{entry.whyItMatters}</p>
              </div>
            ))}
            <p style={{ fontSize: "9pt", marginTop: "1rem" }}>This checklist should be used alongside your assessment results and is not a substitute for legal review.</p>
          </section>
        ) : null}

        {/* ── CUSTOMER TRUST PACKET ── */}
        {exportType === "trust" ? (
          <>
            <section>
              <h2>AI accountability statement</h2>
              <p>
                {input.company_name || "Our company"} operates AI-powered products designed with compliance, transparency, and user protection in mind.
                This document summarises our regulatory posture and the controls we have in place to meet applicable AI law obligations.
              </p>
              <div className="two-col" style={{ marginTop: "0.85rem" }}>
                <div className="panel">
                  <h3>Compliance posture</h3>
                  <p>Verdict: <strong>{verdict.label}</strong></p>
                  <p>{verdict.summary}</p>
                </div>
                <div className="panel">
                  <h3>Trust score</h3>
                  <p>Overall: <strong>{trust.overall}/100</strong> ({trust.band})</p>
                  <ul>
                    {trust.dimensions.map((d) => (
                      <li key={d.key} style={{ fontSize: "9pt" }}>{d.label}: {d.score}/100</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
            <section className="page-break-before">
              <h2>Controls in place</h2>
              {controls.map((group) => (
                <div key={group.category} className="panel" style={{ marginBottom: "0.75rem" }}>
                  <h3>{group.category}</h3>
                  <ul>{group.controls.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              ))}
            </section>
            <section>
              <h2>Applicable regulatory frameworks</h2>
              <ul>
                {[...applicable, ...mayApply].map((result) => (
                  <li key={result.law_id}>
                    <strong>{result.law_short_title}</strong> ({result.jurisdiction}) — {result.whoThisAppliesTo}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: "9pt", marginTop: "0.85rem" }}>This statement is provided for informational purposes as part of our commitment to AI governance transparency. For further detail, contact our compliance team.</p>
            </section>
          </>
        ) : null}

        {/* ── STANDARD / FULL REPORT ── */}
        {exportType === "standard" ? (
          <>
            <section>
              <h2>One-Page Summary</h2>
              <div className="two-col">
                <div className="panel">
                  <h3>Product summary</h3>
                  <p>{buildProductSummary(input)}</p>
                </div>
                <div className="panel">
                  <h3>Top risks</h3>
                  <ul>
                    {applicable.slice(0, 3).map((result) => (
                      <li key={result.law_id}><strong>{result.law_short_title}:</strong> {result.founderSummary}</li>
                    ))}
                    {applicable.length === 0 && mayApply.length > 0
                      ? mayApply.slice(0, 3).map((result) => (
                          <li key={result.law_id}><strong>{result.law_short_title}:</strong> {result.founderSummary}</li>
                        ))
                      : null}
                  </ul>
                </div>
              </div>
              <div className="two-col">
                <div className="panel">
                  <h3>Top applicable laws</h3>
                  <ul>
                    {[...applicable, ...mayApply].slice(0, 5).map((result) => (
                      <li key={result.law_id}><strong>{result.law_short_title}</strong> - {result.whoThisAppliesTo}</li>
                    ))}
                  </ul>
                </div>
                <div className="panel">
                  <h3>Urgent actions</h3>
                  <ul>
                    {actionPlan.topUrgentActions.map((action) => (
                      <li key={action.id}><strong>{action.title}</strong> - {action.owner}, {action.effort} effort</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="two-col">
                <div className="panel">
                  <h3>Penalties snapshot</h3>
                  <ul>
                    {penalties.map((penalty) => (
                      <li key={penalty.lawSlug}><strong>{penalty.lawShortTitle}:</strong> {penalty.summary}</li>
                    ))}
                  </ul>
                </div>
                <div className="panel">
                  <h3>Key sources</h3>
                  <ul>
                    {sources.map((source) => (
                      <li key={source.url}><strong>{source.title}</strong><div className="source-url">{source.url}</div></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="panel" style={{ marginTop: "0.9rem" }}>
                <h3>Assessment assumptions</h3>
                <ul>
                  {assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
                </ul>
              </div>
            </section>

            <section className="page-break-before">
              <h2>Action Plan</h2>
              {(["this_week", "this_month", "later"] as const).map((timeline) => {
                const items = actionPlan.groupedActions[timeline];
                if (items.length === 0) return null;
                return (
                  <div key={timeline} className="timeline-group">
                    <h3>{getActionTimelineLabel(timeline)}</h3>
                    {items.map((action) => (
                      <div key={action.id} className="action-card">
                        <div className="action-meta">
                          <span>{action.owner}</span>
                          <span>{action.urgency}</span>
                          <span>{action.effort} effort</span>
                          <span>{action.lawShortTitle}</span>
                        </div>
                        <strong>{action.title}</strong>
                        <p>{action.whyItMatters}</p>
                        {action.citation ? <div className="citation">{action.citation}</div> : null}
                      </div>
                    ))}
                  </div>
                );
              })}
            </section>

            <section>
              <h2>Detailed Results</h2>
              {enriched
                .filter((result) => result.applicability_status !== "unlikely")
                .map((result) => (
                  <div key={result.law_id} className="result-card">
                    <div className="result-header">
                      <div>
                        <span className={`badge badge-${result.applicability_status}`}>{result.applicability_status.replace(/_/g, " ")}</span>
                        <strong>{result.law_short_title}</strong>
                      </div>
                      <span className="score">{Math.round(result.relevance_score * 100)}%</span>
                    </div>
                    <p>{result.founderSummary}</p>
                    <div className="detail-grid">
                      <div>
                        <strong>Why this matters this week</strong>
                        <p>{result.whyThisMattersThisWeek}</p>
                      </div>
                      <div>
                        <strong>Who this applies to</strong>
                        <p>{result.whoThisAppliesTo}</p>
                      </div>
                      <div>
                        <strong>Why you matched</strong>
                        <p>{result.whyYouMatched}</p>
                      </div>
                      <div>
                        <strong>What to do first</strong>
                        <p>{result.whatToDoFirst}</p>
                      </div>
                    </div>
                    <p className="legal">Last reviewed: {result.lastReviewed}. {result.freshnessLabel}</p>
                    <p className="legal">{result.legalDetails}</p>
                  </div>
                ))}
            </section>
          </>
        ) : null}

        <footer>
          This report is informational only and does not constitute legal advice. Review applicable laws and templates with qualified counsel.
        </footer>
      </main>
    </>
  );
}

const printStyles = `
  body {
    margin: 0;
    background: #f4f1eb;
    color: #102030;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11pt;
  }
  .print-page {
    max-width: 980px;
    margin: 0 auto;
    background: #fff;
    min-height: 100vh;
    box-shadow: 0 18px 48px rgba(16, 32, 48, 0.08);
  }
  .print-toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: flex-end;
    padding: 1rem 1.4cm;
    background: rgba(244, 241, 235, 0.96);
    border-bottom: 1px solid #ded9d0;
  }
  .print-toolbar button {
    border: none;
    border-radius: 999px;
    background: #102030;
    color: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 10pt;
    font-weight: 700;
    padding: 0.6rem 1rem;
  }
  * { box-sizing: border-box; }
  section { padding: 1rem 1.4cm; }
  h1 { margin: 0 0 0.5rem; font-size: 28pt; }
  h2 { font-size: 16pt; margin: 0 0 0.8rem; border-bottom: 2px solid #102030; padding-bottom: 0.25rem; }
  h3 { font-size: 12pt; margin: 0 0 0.45rem; }
  p, li { line-height: 1.45; }
  ul { margin: 0; padding-left: 1.1rem; }
  .cover { padding-top: 2.4cm; padding-bottom: 2cm; background: #f7f4ee; border-bottom: 4px solid #102030; }
  .brand { text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #b94d2d; }
  .subhead { color: #4c5a67; max-width: 34rem; }
  .cover-grid, .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; margin-top: 0.9rem; }
  .metric, .panel, .action-card, .result-card { border: 1px solid #d9dde2; border-radius: 8px; padding: 0.7rem 0.85rem; background: #fff; }
  .metric span { display: block; font-size: 8.5pt; color: #65717c; text-transform: uppercase; letter-spacing: 0.04em; }
  .metric strong { display: block; margin-top: 0.2rem; font-size: 13pt; }
  .timeline-group { margin-bottom: 1rem; }
  .action-meta, .result-header { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .action-meta span { font-size: 8pt; color: #4c5a67; border: 1px solid #d9dde2; border-radius: 999px; padding: 0.1rem 0.4rem; text-transform: capitalize; }
  .citation, .source-url, .legal { font-size: 9pt; color: #4c5a67; }
  .result-header { justify-content: space-between; align-items: center; }
  .badge { display: inline-block; padding: 0.12rem 0.45rem; border-radius: 999px; font-size: 8pt; margin-right: 0.35rem; text-transform: capitalize; }
  .badge-likely_applies { background: #fde8ea; color: #c1121f; }
  .badge-may_apply { background: #fef3e2; color: #7d4e00; }
  .score { font-weight: 700; }
  .detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.7rem; margin-top: 0.6rem; }
  footer { padding: 1rem 1.4cm 1.6rem; font-size: 8.5pt; color: #6b7580; }
  .page-break-before { page-break-before: always; }
  .page-break-after { page-break-after: always; }
  @media print {
    @page { size: A4; margin: 1cm; }
    body { background: #fff; }
    .print-page { max-width: none; box-shadow: none; }
    .print-toolbar { display: none; }
  }
`;
