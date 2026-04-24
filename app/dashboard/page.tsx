"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getLawBySlug, laws } from "@/lib/lexforge-data";
import { getEffectiveEvidenceStatus, summarizeEvidenceCoverage } from "@/lib/evidence-artifacts";
import { TEMPLATE_LIBRARY, buildActionPlan, enrichAssessmentResults, getFreshnessLabel, getLawLastReviewed } from "@/lib/smb";
import { buildClauseGapReport, buildDriftTriggers, buildTrustScorecard, type WorkspaceChecklistItem } from "@/lib/workspace-intelligence";
import type { ChangeImpactBrief, EvidenceRecommendation, RegulatoryUpdateBrief, WeeklyPriority } from "@/lib/product-intelligence";
import type { AssessmentInput, AssessmentResult } from "@/lib/rules-engine";

type Assessment = {
  id: string;
  name: string | null;
  createdAt: string;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  results: Array<{
    lawSlug: string;
    relevanceScore: number;
    applicabilityStatus: string;
    rationale: string;
  }>;
  checklists?: Checklist[];
};

type ChecklistItem = {
  id: string;
  lawSlug?: string | null;
  title?: string;
  category?: string | null;
  priority?: string | null;
  evidenceArtifacts?: Array<{
    id: string;
    status: string;
    expiresAt?: string | null;
    verifiedAt?: string | null;
    collectedAt?: string;
  }>;
  status: "not_started" | "in_progress" | "completed";
};

type Checklist = {
  id: string;
  items: ChecklistItem[];
};

type SavedEntry = { lawSlug: string; createdAt: string };

type ChangeEntry = {
  id: string;
  lawSlug: string;
  lawShortTitle: string;
  lawJurisdiction: string;
  changeType: string;
  summary: string;
  changedAt: string;
};

type ComplianceAlert = {
  id: string;
  assessmentId: string | null;
  alertType: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  status: "open" | "acknowledged" | "resolved";
  assessment?: {
    id: string;
    name: string | null;
    createdAt: string;
  } | null;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  members: Array<{ id: string; name: string | null; email: string | null; role: string }>;
  invites: Array<{ id: string; email: string; createdAt: string; expiresAt: string }>;
};

type IncomingInvite = {
  id: string;
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  organization: { id: string; name: string; slug: string; createdAt: string };
};

type DashboardIntelligence = {
  weeklyPriorityQueue: WeeklyPriority[];
  changeImpactBriefs: ChangeImpactBrief[];
  regulatoryUpdateBriefs: RegulatoryUpdateBrief[];
  evidenceRecommendations: EvidenceRecommendation[];
};

function parseAssessmentInput(assessment: Assessment): AssessmentInput {
  return {
    ...JSON.parse(assessment.companyProfile ?? "{}"),
    ...JSON.parse(assessment.productProfile ?? "{}"),
    ...JSON.parse(assessment.technicalProfile ?? "{}"),
  } as AssessmentInput;
}

function mapStoredResults(assessment: Assessment): AssessmentResult[] {
  return assessment.results.map((result) => {
    const law = getLawBySlug(result.lawSlug);
    return {
      law_id: result.lawSlug,
      law_slug: result.lawSlug,
      law_title: law?.title ?? result.lawSlug,
      law_short_title: law?.short_title ?? result.lawSlug,
      jurisdiction: law?.jurisdiction ?? "",
      jurisdiction_code: law?.jurisdiction_code ?? "",
      relevance_score: result.relevanceScore,
      applicability_status: result.applicabilityStatus as AssessmentResult["applicability_status"],
      rationale: result.rationale,
      triggered_rules: [],
      triggered_obligations: [],
      evaluation_trace: {
        rulesEngineVersion: "stored",
        rules: [],
        score: result.relevanceScore,
        totalWeight: 0,
        matchedWeight: 0,
        scoreBreakdown: { matchedRuleCount: 0, totalRuleCount: 0, weightedPercentage: result.relevanceScore },
      },
    };
  });
}

function mapChecklistItems(checklist: Checklist | null): WorkspaceChecklistItem[] {
  if (!checklist) return [];
  return checklist.items.map((item) => ({
    id: item.id,
    lawSlug: item.lawSlug ?? null,
    title: item.title ?? "Checklist item",
    category: item.category ?? null,
    citation: null,
    priority: item.priority ?? null,
    status: item.status,
  }));
}

function daysSince(dateString: string): number {
  const date = new Date(dateString).getTime();
  return Math.max(0, Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24)));
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toneColor(score: number) {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "#915a1e";
  return "var(--red)";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<SavedEntry[]>([]);
  const [alerts, setAlerts] = useState<ChangeEntry[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [dashboardIntelligence, setDashboardIntelligence] = useState<DashboardIntelligence | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [invitingOrgId, setInvitingOrgId] = useState<string | null>(null);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);

  const enacted = laws.filter((law) => law.status === "in_force" || law.status === "enacted").length;
  const proposed = laws.filter((law) => law.status === "proposed" || law.status === "draft").length;
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/assessments").then((response) => response.json()),
      fetch("/api/saved-laws").then((response) => response.json()),
      fetch("/api/alerts").then((response) => response.json()).catch(() => ({ data: [] })),
      fetch("/api/organizations").then((response) => response.json()).catch(() => ({ data: [] })),
      fetch("/api/organizations/invites").then((response) => response.json()).catch(() => ({ data: [] })),
      fetch("/api/dashboard/intelligence").then((response) => (response.ok ? response.json() : { data: null })).catch(() => ({ data: null })),
    ]).then(([assessmentResponse, savedResponse, alertsResponse, organizationsResponse, incomingInvitesResponse, intelligenceResponse]) => {
      setAssessments(assessmentResponse.data ?? []);
      setSavedSlugs(savedResponse.data ?? []);
      setAlerts(alertsResponse.data ?? []);
      setComplianceAlerts(alertsResponse.complianceAlerts ?? []);
      setOrganizations(organizationsResponse.data ?? []);
      setIncomingInvites(incomingInvitesResponse.data ?? []);
      setDashboardIntelligence((intelligenceResponse.data ?? null) as DashboardIntelligence | null);
      setLoading(false);
    });
  }, [status]);

  const latestAssessment = assessments[0] ?? null;
  const latestChecklist = latestAssessment?.checklists?.[0] ?? null;
  const latestResults = latestAssessment ? mapStoredResults(latestAssessment) : [];
  const latestActionPlan = latestAssessment ? buildActionPlan(latestResults) : null;
  const latestActions = latestActionPlan?.topUrgentActions ?? [];
  const latestChecklistItems = mapChecklistItems(latestChecklist);
  const latestEvidenceArtifacts = latestChecklist?.items.flatMap((item) => item.evidenceArtifacts ?? []) ?? [];
  const latestEvidenceCoverage = summarizeEvidenceCoverage(latestEvidenceArtifacts);
  const staleEvidenceCount = latestEvidenceArtifacts.filter((artifact) => getEffectiveEvidenceStatus(artifact) === "stale").length;
  const checklistCompleted = latestChecklist?.items.filter((item) => item.status === "completed").length ?? 0;
  const checklistPercent = latestChecklist?.items.length ? Math.round((checklistCompleted / latestChecklist.items.length) * 100) : 0;
  const savedLaws = savedSlugs.map((entry) => ({ ...entry, law: getLawBySlug(entry.lawSlug) })).filter((entry) => entry.law != null);

  const workspaceSignals = useMemo(() => {
    if (!latestAssessment) return null;
    const input = parseAssessmentInput(latestAssessment);
    const enriched = enrichAssessmentResults(latestResults, input);
    const trust = buildTrustScorecard(enriched, latestChecklistItems);
    const gaps = buildClauseGapReport(latestResults, latestChecklistItems);
    const drift = buildDriftTriggers({
      createdAt: latestAssessment.createdAt,
      results: enriched,
      checklistItems: latestChecklistItems,
      evidenceArtifacts: (latestChecklist?.items ?? []).flatMap((item) =>
        (item.evidenceArtifacts ?? []).map((artifact) => ({
          ...artifact,
          checklistItemTitle: item.title ?? "Checklist item",
          priority: item.priority ?? null,
        })),
      ),
      changelogEntries: alerts.map((entry) => ({
        lawSlug: entry.lawSlug,
        changedAt: entry.changedAt,
        summary: entry.summary,
        lawShortTitle: entry.lawShortTitle,
      })),
    });

    return { input, trust, gaps, drift };
  }, [alerts, latestAssessment, latestChecklistItems, latestResults]);

  const recommendedReruns = useMemo(() => {
    return assessments
      .map((assessment) => {
        const resultSlugs = assessment.results
          .filter((result) => result.applicabilityStatus === "likely_applies" || result.applicabilityStatus === "may_apply")
          .map((result) => result.lawSlug);
        const newestRelatedAlert = alerts.find((entry) => resultSlugs.includes(entry.lawSlug));
        const stale = daysSince(assessment.createdAt) >= 30;
        const lawChanged = newestRelatedAlert ? new Date(newestRelatedAlert.changedAt) > new Date(assessment.createdAt) : false;
        if (!stale && !lawChanged) return null;

        const input = parseAssessmentInput(assessment);
        const reason = lawChanged
          ? `${newestRelatedAlert?.lawShortTitle ?? "A tracked law"} changed after this assessment.`
          : `This assessment is ${daysSince(assessment.createdAt)} days old.`;

        return {
          id: assessment.id,
          title: assessment.name ?? `${input.product_preset ? "Preset" : "Assessment"} from ${formatShortDate(assessment.createdAt)}`,
          reason,
        };
      })
      .filter((entry): entry is { id: string; title: string; reason: string } => Boolean(entry))
      .slice(0, 4);
  }, [alerts, assessments]);

  const watchlistUpdates = useMemo(() => {
    return savedLaws
      .map(({ lawSlug, law }) => {
        const recentChange = alerts.find((entry) => entry.lawSlug === lawSlug);
        return {
          lawSlug,
          law,
          recentChange,
          freshnessLabel: getFreshnessLabel(getLawLastReviewed(lawSlug)),
        };
      })
      .slice(0, 5);
  }, [alerts, savedLaws]);

  const showGettingStarted = assessments.length === 0 && savedSlugs.length === 0 && organizations.length === 0;
  const activeComplianceAlerts = complianceAlerts.filter((alert) => alert.status !== "resolved").slice(0, 4);
  const weeklyPriorityQueue = dashboardIntelligence?.weeklyPriorityQueue ?? [];
  const changeImpactBriefs = dashboardIntelligence?.changeImpactBriefs ?? [];
  const regulatoryUpdateBriefs = dashboardIntelligence?.regulatoryUpdateBriefs ?? [];

  async function createOrganization() {
    if (!orgName.trim() || !orgSlug.trim()) return;
    setCreatingOrg(true);
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName.trim(), slug: orgSlug.trim() }),
    });
    if (response.ok) {
      const payload = await response.json();
      setOrganizations((current) => [...current, { ...payload.data, role: "owner", members: [], invites: [] }]);
      setOrgName("");
      setOrgSlug("");
    }
    setCreatingOrg(false);
  }

  async function inviteToOrganization(organizationId: string) {
    const email = inviteEmails[organizationId]?.trim();
    if (!email) return;
    setInvitingOrgId(organizationId);
    const response = await fetch(`/api/organizations/${organizationId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.ok) {
      const organizationsResponse = await fetch("/api/organizations").then((result) => result.json());
      setOrganizations(organizationsResponse.data ?? []);
      setInviteEmails((current) => ({ ...current, [organizationId]: "" }));
    }
    setInvitingOrgId(null);
  }

      async function acceptInvite(inviteId: string) {
        setAcceptingInviteId(inviteId);
        const response = await fetch("/api/organizations/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteId }),
        });

        if (response.ok) {
          const [organizationsResponse, invitesResponse] = await Promise.all([
            fetch("/api/organizations").then((res) => res.json()).catch(() => ({ data: [] })),
            fetch("/api/organizations/invites").then((res) => res.json()).catch(() => ({ data: [] })),
          ]);
          setOrganizations(organizationsResponse.data ?? []);
          setIncomingInvites(invitesResponse.data ?? []);
        }

        setAcceptingInviteId(null);
      }

  if (status === "loading" || loading) {
    return (
      <main className="page">
        <div className="shell" style={{ paddingTop: "3rem" }}>
          <p style={{ color: "var(--muted)" }}>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem" }}>
        <p className="kicker">Dashboard</p>
        <h1
          style={{
            margin: "0.4rem 0 0.25rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Your operating surface for reassessment drift, trust posture, clause gaps, alert routing, and team follow-through.
        </p>

        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card">
            <strong>{laws.length}</strong>
            <span>Laws tracked</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--green)" }}>{enacted}</strong>
            <span>In force / enacted</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "#915a1e" }}>{proposed}</strong>
            <span>Proposed / draft</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--navy)" }}>{assessments.length}</strong>
            <span>Assessments run</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: "var(--red)" }}>{savedSlugs.length}</strong>
            <span>Laws saved</span>
          </div>
        </div>

        {showGettingStarted ? (
          <section className="content-card" style={{ padding: "1.2rem 1.25rem", marginBottom: "1.25rem", background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(15,23,42,0.02))" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Getting started
            </p>
            <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
              Launch your first compliant workspace in three steps
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem", marginTop: "1rem" }}>
              {[
                { title: "1. Run an assessment", body: "Capture your AI use case and generate a tailored law map with next actions.", href: "/assess", cta: "Start assessment" },
                { title: "2. Save laws to watch", body: "Track the jurisdictions and laws you actually rely on so updates stay relevant.", href: "/explore", cta: "Open law explorer" },
                { title: "3. Invite your team", body: "Create a workspace once the first assessment is in place and route ownership across the checklist.", href: "/dashboard", cta: "Set up workspace" },
              ].map((step) => (
                <div key={step.title} style={{ padding: "0.95rem", borderRadius: "14px", background: "rgba(255,255,255,0.78)", border: "1px solid rgba(16,32,48,0.08)" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{step.title}</p>
                  <p style={{ margin: "0.35rem 0 0.8rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{step.body}</p>
                  <Link href={step.href} className="button" style={{ fontSize: "0.82rem" }}>{step.cta}</Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
          <section className="content-card" style={{ padding: "1.15rem 1.2rem" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Next actions
            </p>
            <h2 style={{ margin: "0 0 0.3rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
              {latestAssessment ? "Continue your most recent compliance run" : "Start your first compliance run"}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
              {latestAssessment
                ? `Latest assessment from ${formatShortDate(latestAssessment.createdAt)}. Use this as the working surface for the team instead of starting over.`
                : "Run the assessment to generate a founder-friendly summary, next actions, a clause map, and a working checklist."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
              {latestAssessment ? (
                <>
                  <Link href={`/assess/results/${latestAssessment.id}`} className="button button--primary">
                    Resume results
                  </Link>
                  <a href={`/api/assessments/${latestAssessment.id}/evidence`} className="button" style={{ textDecoration: "none" }}>
                    Export evidence
                  </a>
                  <Link href="/assess" className="button">
                    Run reassessment
                  </Link>
                </>
              ) : (
                <Link href="/assess" className="button button--primary">
                  Run your first assessment
                </Link>
              )}
            </div>
            {latestActions.length > 0 ? (
              <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
                {latestActions.map((action) => (
                  <div key={action.id} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                    <p style={{ margin: "0 0 0.2rem", color: "var(--navy)", fontWeight: 700 }}>{action.title}</p>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>{action.whyItMatters}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="content-card" style={{ padding: "1.15rem 1.2rem" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Workspace posture
            </p>
            {workspaceSignals ? (
              <>
                <h2 style={{ margin: "0 0 0.3rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                  Trust score {workspaceSignals.trust.overall}
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
                  {workspaceSignals.gaps.totals.gaps} open clause gaps and {workspaceSignals.drift.length} active drift trigger{workspaceSignals.drift.length === 1 ? "" : "s"}.
                </p>
                <div style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}>
                  {workspaceSignals.trust.dimensions.slice(0, 3).map((dimension) => (
                    <div key={dimension.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ color: "var(--navy)", fontSize: "0.88rem", fontWeight: 700 }}>{dimension.label}</span>
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{dimension.score}</span>
                      </div>
                      <div style={{ height: "8px", borderRadius: "999px", background: "rgba(16,32,48,0.08)", overflow: "hidden" }}>
                        <div style={{ width: `${dimension.score}%`, height: "100%", background: toneColor(dimension.score) }} />
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/assess/results/${latestAssessment?.id}`} className="button" style={{ marginTop: "1rem", display: "inline-flex" }}>
                  Open full scorecard
                </Link>
              </>
            ) : (
              <>
                <h2 style={{ margin: "0 0 0.3rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.35rem" }}>
                  Checklist progress
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
                  No workspace posture yet. Run an assessment to generate trust, gaps, and drift signals.
                </p>
              </>
            )}
          </section>
        </div>

        {workspaceSignals ? (
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Clause coverage
                </p>
                <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>
                  {workspaceSignals.gaps.totals.covered} covered
                </h3>
                <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {workspaceSignals.gaps.totals.inProgress} in progress, {workspaceSignals.gaps.totals.gaps} open, {workspaceSignals.gaps.totals.notGenerated} not yet tracked.
                </p>
              </div>
              <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Drift triggers
                </p>
                <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>
                  {workspaceSignals.drift.length} active
                </h3>
                <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {workspaceSignals.drift[0]?.reason ?? "No active drift triggers right now."}
                </p>
              </div>
              <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Evidence readiness
                </p>
                <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>
                  {latestEvidenceCoverage.verified}/{latestEvidenceCoverage.total} verified
                </h3>
                <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {staleEvidenceCount > 0
                    ? `${staleEvidenceCount} evidence artifact${staleEvidenceCount === 1 ? "" : "s"} are stale and need refresh.`
                    : latestEvidenceCoverage.total > 0
                      ? `${latestEvidenceCoverage.active} linked artifact${latestEvidenceCoverage.active === 1 ? "" : "s"} supporting your current checklist.`
                      : "No evidence artifacts linked yet."}
                </p>
              </div>
              <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Resume
                </p>
                <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>
                  {latestChecklist ? `${checklistPercent}% checklist completion` : "No checklist yet"}
                </h3>
                <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {latestChecklist
                    ? `Keep moving on the remaining ${latestChecklist.items.length - checklistCompleted} tasks.`
                    : "Generate a checklist from the assessment to turn obligations into tracked work."}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {(weeklyPriorityQueue.length > 0 || regulatoryUpdateBriefs.length > 0) ? (
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 1fr)", gap: "1rem" }}>
              <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  This week
                </p>
                <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
                  Operator queue
                </h2>
                <div className="stack" style={{ marginTop: "0.9rem" }}>
                  {weeklyPriorityQueue.slice(0, 5).map((item) => (
                    <div key={item.id} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                        <strong style={{ color: "var(--navy)" }}>{item.title}</strong>
                        <span style={{ fontSize: "0.74rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: "999px", background: item.urgency === "high" ? "rgba(230,57,70,0.1)" : item.urgency === "medium" ? "rgba(244,162,97,0.14)" : "rgba(42,123,98,0.12)", color: item.urgency === "high" ? "var(--red)" : item.urgency === "medium" ? "#915a1e" : "var(--green)" }}>
                          {item.urgency}
                        </span>
                      </div>
                      <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{item.reason}</p>
                      <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.78rem" }}>Owner: {item.owner}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  Regulatory intelligence
                </p>
                <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
                  Targeted update briefs
                </h2>
                <div className="stack" style={{ marginTop: "0.9rem" }}>
                  {regulatoryUpdateBriefs.length > 0 ? regulatoryUpdateBriefs.slice(0, 4).map((brief) => (
                    <div key={brief.id} style={{ padding: "0.85rem 0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                      <strong style={{ color: "var(--navy)", display: "block" }}>{brief.headline}</strong>
                      <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{brief.whyItMatters}</p>
                      <p style={{ margin: "0.35rem 0 0", color: "var(--navy)", fontSize: "0.82rem" }}>{brief.nextStep}</p>
                    </div>
                  )) : (
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Save laws or run assessments to start receiving targeted update summaries here.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {changeImpactBriefs.length > 0 ? (
          <section style={{ marginBottom: "2rem" }}>
            <div className="content-card" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                Continuous monitoring
              </p>
              <h2 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem" }}>
                Change impact briefs
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem", marginTop: "0.9rem" }}>
                {changeImpactBriefs.slice(0, 4).map((brief) => (
                  <div key={brief.id} style={{ padding: "0.9rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "center" }}>
                      <strong style={{ color: "var(--navy)" }}>{brief.headline}</strong>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: "999px", background: brief.severity === "high" ? "rgba(230,57,70,0.1)" : brief.severity === "medium" ? "rgba(244,162,97,0.14)" : "rgba(42,123,98,0.12)", color: brief.severity === "high" ? "var(--red)" : brief.severity === "medium" ? "#915a1e" : "var(--green)" }}>
                        {brief.severity}
                      </span>
                    </div>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{brief.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {recommendedReruns.length > 0 ? (
          <section style={{ marginBottom: "2rem" }}>
            <div
              style={{
                padding: "1rem 1.15rem",
                borderRadius: "var(--radius)",
                background: "rgba(244,162,97,0.07)",
                border: "1px solid rgba(244,162,97,0.22)",
                marginBottom: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#915a1e" }}>Action required</span>
                <h2 style={{ margin: "0.2rem 0 0.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem", lineHeight: 1.15 }}>
                  {recommendedReruns.length} assessment{recommendedReruns.length !== 1 ? "s" : ""} need a rerun
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                  Law changes or age have invalidated these assessments. Re-run to get fresh verdict and updated evidence mapping.
                </p>
              </div>
              <Link href="/assess" className="button button--primary" style={{ whiteSpace: "nowrap" }}>
                Start new assessment →
              </Link>
            </div>
            <div className="stack">
              {recommendedReruns.map((item) => (
                <div key={item.id} className="content-card" style={{ padding: "1rem 1.1rem", display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>{item.title}</p>
                    <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.86rem" }}>{item.reason}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <Link href={`/assess/results/${item.id}`} className="button" style={{ whiteSpace: "nowrap" }}>
                      View results
                    </Link>
                    <button
                      className="button button--primary"
                      style={{ whiteSpace: "nowrap", fontSize: "0.84rem" }}
                      onClick={() => {
                        const found = assessments.find((a) => a.id === item.id);
                        if (found) {
                          const input = parseAssessmentInput(found);
                          sessionStorage.setItem("compass_prefill", JSON.stringify(input));
                        }
                        window.location.href = "/assess";
                      }}
                    >
                      Re-run →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeComplianceAlerts.length > 0 ? (
          <section style={{ marginBottom: "2rem" }}>
            <div
              style={{
                padding: "1rem 1.15rem",
                borderRadius: "var(--radius)",
                background: "rgba(230,57,70,0.06)",
                border: "1px solid rgba(230,57,70,0.18)",
                marginBottom: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--red)" }}>Workspace alerts</span>
                <h2 style={{ margin: "0.2rem 0 0.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.3rem", lineHeight: 1.15 }}>
                  {activeComplianceAlerts.length} persistent compliance alert{activeComplianceAlerts.length === 1 ? "" : "s"} need attention
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                  Drift is now persisted across assessment age, law updates, execution gaps, and evidence freshness.
                </p>
              </div>
              <Link href="/alerts" className="button button--primary" style={{ whiteSpace: "nowrap" }}>
                Open alert queue
              </Link>
            </div>
            <div className="stack">
              {activeComplianceAlerts.map((alert) => (
                <div key={alert.id} className="content-card" style={{ padding: "1rem 1.1rem", borderLeft: `4px solid ${alert.severity === "high" ? "var(--red)" : alert.severity === "medium" ? "#915a1e" : "var(--navy)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>{alert.title}</p>
                      <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.86rem" }}>{alert.message}</p>
                      {alert.assessment ? (
                        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.8rem" }}>
                          {alert.assessment.name ?? `Assessment ${formatShortDate(alert.assessment.createdAt)}`}
                        </p>
                      ) : null}
                    </div>
                    {alert.assessmentId ? (
                      <Link href={`/assess/results/${alert.assessmentId}`} className="button" style={{ whiteSpace: "nowrap" }}>
                        View assessment
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--navy)", margin: 0 }}>Assessments</h2>
              <Link href="/assess" style={{ fontSize: "0.85rem", color: "var(--navy)", textDecoration: "underline" }}>
                Run new
              </Link>
            </div>
            {assessments.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>No assessments yet.</p>
                <Link href="/assess" className="button button--primary">
                  Run your first assessment
                </Link>
              </div>
            ) : (
              <div className="stack">
                {assessments.slice(0, 5).map((assessment) => {
                  const applicable = assessment.results.filter((result) => result.applicabilityStatus === "likely_applies").length;
                  const mayApply = assessment.results.filter((result) => result.applicabilityStatus === "may_apply").length;
                  const checklist = assessment.checklists?.[0];
                  const completed = checklist?.items.filter((item) => item.status === "completed").length ?? 0;
                  const total = checklist?.items.length ?? 0;
                  const evidenceArtifacts = checklist?.items.flatMap((item) => item.evidenceArtifacts ?? []) ?? [];
                  const evidenceCoverage = summarizeEvidenceCoverage(evidenceArtifacts);
                  const staleEvidence = evidenceArtifacts.filter((artifact) => getEffectiveEvidenceStatus(artifact) === "stale").length;

                  return (
                    <div key={assessment.id} className="content-card" style={{ padding: "1rem 1.1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>
                            {assessment.name ?? `Assessment ${formatShortDate(assessment.createdAt)}`}
                          </p>
                          <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                            {formatShortDate(assessment.createdAt)}
                          </p>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(230,57,70,0.1)", color: "var(--red)", fontWeight: 700 }}>
                              {applicable} applies
                            </span>
                            {mayApply > 0 ? (
                              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(244,162,97,0.15)", color: "#915a1e", fontWeight: 700 }}>
                                {mayApply} may apply
                              </span>
                            ) : null}
                            {checklist ? (
                              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(16,32,48,0.07)", color: "var(--navy)", fontWeight: 700 }}>
                                Checklist {completed}/{total}
                              </span>
                            ) : null}
                            {evidenceCoverage.total > 0 ? (
                              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: staleEvidence > 0 ? "rgba(230,57,70,0.1)" : "rgba(42,123,98,0.12)", color: staleEvidence > 0 ? "var(--red)" : "var(--green)", fontWeight: 700 }}>
                                Evidence {evidenceCoverage.verified}/{evidenceCoverage.total}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <Link href={`/assess/results/${assessment.id}`} className="button" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", whiteSpace: "nowrap" }}>
                          Resume
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--navy)", margin: 0 }}>Watchlist and freshness</h2>
              <Link href="/alerts" style={{ fontSize: "0.85rem", color: "var(--navy)", textDecoration: "underline" }}>
                Alerts
              </Link>
            </div>
            {watchlistUpdates.length === 0 ? (
              <div className="content-card" style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>No saved laws yet.</p>
                <Link href="/explore" className="button">
                  Browse laws
                </Link>
              </div>
            ) : (
              <div className="stack">
                {watchlistUpdates.map(({ law, lawSlug, recentChange, freshnessLabel }) => (
                  <div key={lawSlug} className="content-card" style={{ padding: "1rem 1.1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.92rem" }}>{law!.short_title}</p>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>{law!.jurisdiction}</p>
                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>{freshnessLabel}</p>
                        {recentChange ? (
                          <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "var(--navy)" }}>
                            Recent change: {recentChange.summary}
                          </p>
                        ) : null}
                      </div>
                      <Link href={`/laws/${lawSlug}`} className="button" style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}>
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginTop: "2rem" }}>
          <section className="content-card" style={{ padding: "1rem 1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--navy)", margin: 0 }}>Team workspace</h2>
              <Link href="/alerts" style={{ fontSize: "0.85rem", color: "var(--navy)", textDecoration: "underline" }}>
                Alert routing
              </Link>
            </div>
            {organizations.length === 0 ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                  No team workspace yet. Create one to invite teammates and centralize alerts and evidence review.
                </p>
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <label htmlFor="workspace-name" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>Workspace name</label>
                  <input id="workspace-name" value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="Team name" autoComplete="organization" />
                </div>
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <label htmlFor="workspace-slug" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>Workspace slug</label>
                  <input id="workspace-slug" value={orgSlug} onChange={(event) => setOrgSlug(event.target.value)} placeholder="team-slug" autoCapitalize="off" autoCorrect="off" />
                </div>
                <button type="button" className="button button--primary" onClick={createOrganization} disabled={creatingOrg}>
                  {creatingOrg ? "Creating..." : "Create workspace"}
                </button>
              </div>
            ) : (
              <div className="stack">
                {organizations.map((organization) => (
                  <div key={organization.id} style={{ padding: "0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{organization.name}</p>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                          {organization.members.length} member{organization.members.length === 1 ? "" : "s"} · role {organization.role}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <label htmlFor={`invite-email-${organization.id}`} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
                          Invite teammate by email for {organization.name}
                        </label>
                        <input
                          id={`invite-email-${organization.id}`}
                          type="email"
                          value={inviteEmails[organization.id] ?? ""}
                          onChange={(event) => setInviteEmails((current) => ({ ...current, [organization.id]: event.target.value }))}
                          placeholder="teammate@company.com"
                          autoComplete="email"
                          style={{ minWidth: "220px" }}
                        />
                        <button type="button" className="button" onClick={() => inviteToOrganization(organization.id)} disabled={invitingOrgId === organization.id}>
                          {invitingOrgId === organization.id ? "Inviting..." : "Invite"}
                        </button>
                      </div>
                    </div>
                    {(organization.members.length > 0 || organization.invites.length > 0) ? (
                      <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.8rem" }}>
                        {organization.members.map((member) => (
                          <div key={member.id} style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                            {member.name ?? member.email ?? "Member"} · {member.role}
                          </div>
                        ))}
                        {organization.invites.map((invite) => (
                          <div key={invite.id} style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                            Invite pending for {invite.email} until {formatShortDate(invite.expiresAt)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="content-card" style={{ padding: "1rem 1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--navy)", margin: 0 }}>Pending invites</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{incomingInvites.length} open</span>
            </div>
            {incomingInvites.length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                No invites waiting on this account. When a teammate invites this email address, you can join the workspace from here.
              </p>
            ) : (
              <div className="stack">
                {incomingInvites.map((invite) => (
                  <div key={invite.id} style={{ padding: "0.95rem", borderRadius: "14px", background: "rgba(16,32,48,0.04)", border: "1px solid rgba(16,32,48,0.07)" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{invite.organization.name}</p>
                    <p style={{ margin: "0.25rem 0 0.65rem", fontSize: "0.84rem", color: "var(--muted)" }}>
                      Join workspace {invite.organization.slug} before {formatShortDate(invite.expiresAt)}.
                    </p>
                    <button type="button" className="button button--primary" onClick={() => acceptInvite(invite.id)} disabled={acceptingInviteId === invite.id}>
                      {acceptingInviteId === invite.id ? "Joining..." : "Accept invite"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--navy)", margin: 0 }}>Templates and quick actions</h2>
              <Link href="/templates" style={{ fontSize: "0.85rem", color: "var(--navy)", textDecoration: "underline" }}>
                View all
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {TEMPLATE_LIBRARY.slice(0, 3).map((template) => (
                <div key={template.slug} className="content-card" style={{ padding: "1rem 1.1rem" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>{template.title}</p>
                  <p style={{ margin: "0.35rem 0 0.75rem", fontSize: "0.84rem", color: "var(--muted)" }}>{template.intendedUser}</p>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "var(--muted)" }}>Last reviewed {template.lastReviewed}</p>
                  <a href={`/templates/${template.slug}`} className="button" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", textDecoration: "none" }}>
                    Download
                  </a>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/assess" className="button button--primary">
                Run compliance assessment
              </Link>
              <Link href="/explore" className="button">
                Browse all laws
              </Link>
              <Link href="/alerts" className="button">
                Regulatory alerts
              </Link>
              {isAdmin ? (
                <Link href="/admin/sources" className="button">
                  Trust ops
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
