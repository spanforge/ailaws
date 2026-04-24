import { prisma } from "@/lib/prisma";
import { getLawBySlug } from "@/lib/lexforge-data";
import { enrichAssessmentResults } from "@/lib/smb";
import { buildDriftTriggers, type WorkspaceChecklistItem } from "@/lib/workspace-intelligence";
import type { AssessmentInput, AssessmentResult } from "@/lib/rules-engine";
import { captureException, log } from "@/lib/monitoring";
import {
  isComplianceSlackDeliveryConfigured,
  sendComplianceAlertEmail,
  sendComplianceAlertSlackMessage,
} from "@/lib/alert-delivery";
import { getOrganizationAlertRecipients } from "@/lib/organization-alert-routing";

type StoredAssessment = {
  id: string;
  userId: string | null;
  name: string | null;
  createdAt: Date;
  companyProfile: string;
  productProfile: string;
  technicalProfile: string;
  results: Array<{
    lawSlug: string;
    relevanceScore: number | null;
    applicabilityStatus: string | null;
    rationale: string | null;
  }>;
  checklists: Array<{
    id: string;
    items: Array<{
      id: string;
      lawSlug: string | null;
      title: string;
      category: string | null;
      priority: string | null;
      status: string;
      assignee: {
        id: string;
        email: string | null;
        name: string | null;
      } | null;
      evidenceArtifacts: Array<{
        id: string;
        title: string;
        description: string | null;
        artifactType: string;
        sourceType: string | null;
        sourceUrl: string | null;
        status: string;
        collectedAt: Date;
        verifiedAt: Date | null;
        expiresAt: Date | null;
      }>;
    }>;
  }>;
};

const DRIFT_TITLE_TO_TYPE: Record<string, string> = {
  "Assessment age drift": "assessment_age_drift",
  "Law-change drift": "law_change_drift",
  "Source freshness drift": "source_freshness_drift",
  "Execution drift": "execution_drift",
  "Evidence freshness drift": "evidence_freshness_drift",
  "Evidence coverage drift": "evidence_coverage_drift",
  "System-change drift": "system_change_drift",
};

function parseAssessmentInput(assessment: StoredAssessment): AssessmentInput {
  return {
    ...JSON.parse(assessment.companyProfile ?? "{}"),
    ...JSON.parse(assessment.productProfile ?? "{}"),
    ...JSON.parse(assessment.technicalProfile ?? "{}"),
  } as AssessmentInput;
}

function mapStoredResults(assessment: StoredAssessment): AssessmentResult[] {
  return assessment.results.map((result) => {
    const law = getLawBySlug(result.lawSlug);
    return {
      law_id: result.lawSlug,
      law_slug: result.lawSlug,
      law_title: law?.title ?? result.lawSlug,
      law_short_title: law?.short_title ?? result.lawSlug,
      jurisdiction: law?.jurisdiction ?? "",
      jurisdiction_code: law?.jurisdiction_code ?? "",
      relevance_score: result.relevanceScore ?? 0,
      applicability_status: (result.applicabilityStatus ?? "unlikely") as AssessmentResult["applicability_status"],
      rationale: result.rationale ?? "",
      triggered_rules: [],
      triggered_obligations: [],
      evaluation_trace: {
        rulesEngineVersion: "stored",
        rules: [],
        score: result.relevanceScore ?? 0,
        totalWeight: 0,
        matchedWeight: 0,
        scoreBreakdown: {
          matchedRuleCount: 0,
          totalRuleCount: 0,
          weightedPercentage: result.relevanceScore ?? 0,
        },
      },
    };
  });
}

function mapChecklistItems(assessment: StoredAssessment): WorkspaceChecklistItem[] {
  const latestChecklist = assessment.checklists[0];
  if (!latestChecklist) return [];

  return latestChecklist.items.map((item) => ({
    id: item.id,
    lawSlug: item.lawSlug,
    title: item.title,
    category: item.category,
    citation: null,
    priority: item.priority,
    status: item.status,
  }));
}

export function deriveAlertOwners(
  alertType: string,
  checklistItems: StoredAssessment["checklists"][number]["items"],
) {
  const relevantItems = checklistItems.filter((item) => {
    if (!item.assignee?.email) return false;
    if (alertType === "execution_drift") {
      return item.priority === "critical" && item.status !== "completed";
    }
    if (alertType === "evidence_freshness_drift" || alertType === "evidence_coverage_drift") {
      return item.priority === "critical" || item.evidenceArtifacts.length > 0;
    }
    return false;
  });

  const uniqueOwners = new Map<string, { id: string; email: string; name: string | null }>();
  for (const item of relevantItems) {
    if (!item.assignee?.email) continue;
    uniqueOwners.set(item.assignee.id, {
      id: item.assignee.id,
      email: item.assignee.email,
      name: item.assignee.name,
    });
  }
  return Array.from(uniqueOwners.values());
}

function parseAlertMetadata(metadataJson: string | null) {
  if (!metadataJson) return null;
  try {
    return JSON.parse(metadataJson) as {
      ownerRecipients?: Array<{ id: string; email: string; name: string | null }>;
    };
  } catch {
    return null;
  }
}

export function buildAlertFingerprint(userId: string, assessmentId: string, alertType: string) {
  return `${userId}:${assessmentId}:${alertType}`;
}

function mapSeverityRank(severity: string) {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

export async function syncUserComplianceAlerts(userId: string) {
  const assessments = await prisma.assessment.findMany({
    where: { userId },
    include: {
      results: {
        select: {
          lawSlug: true,
          relevanceScore: true,
          applicabilityStatus: true,
          rationale: true,
        },
      },
      checklists: {
        include: {
          items: {
            include: {
              assignee: {
                select: { id: true, email: true, name: true },
              },
              evidenceArtifacts: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  artifactType: true,
                  sourceType: true,
                  sourceUrl: true,
                  status: true,
                  collectedAt: true,
                  verifiedAt: true,
                  expiresAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  }) as StoredAssessment[];

  const resultSlugs = [...new Set(
    assessments.flatMap((assessment) =>
      assessment.results
        .filter((result) => result.applicabilityStatus === "likely_applies" || result.applicabilityStatus === "may_apply")
        .map((result) => result.lawSlug),
    ),
  )];

  const changelogEntries = resultSlugs.length > 0
    ? await prisma.lawChangelog.findMany({
        where: { lawSlug: { in: resultSlugs } },
        select: { lawSlug: true, changedAt: true, summary: true },
        orderBy: { changedAt: "desc" },
      })
    : [];
  const systemChangeEvents = await prisma.systemChangeEvent.findMany({
    where: {
      occurredAt: {
        gte: assessments.length > 0 ? new Date(Math.min(...assessments.map((assessment) => assessment.createdAt.getTime()))) : new Date(),
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  const activeAlerts = assessments.flatMap((assessment) => {
    const input = parseAssessmentInput(assessment);
    const results = mapStoredResults(assessment);
    const enriched = enrichAssessmentResults(results, input);
    const checklistItems = mapChecklistItems(assessment);
    const latestChecklist = assessment.checklists[0];
    const evidenceArtifacts = latestChecklist?.items.flatMap((item) =>
      item.evidenceArtifacts.map((artifact) => ({
        ...artifact,
        collectedAt: artifact.collectedAt.toISOString(),
        verifiedAt: artifact.verifiedAt?.toISOString() ?? null,
        expiresAt: artifact.expiresAt?.toISOString() ?? null,
        checklistItemTitle: item.title,
        priority: item.priority,
      })),
    ) ?? [];

    const triggers = buildDriftTriggers({
      createdAt: assessment.createdAt,
      results: enriched,
      checklistItems,
      evidenceArtifacts,
      changelogEntries: changelogEntries.map((entry) => ({
        lawSlug: entry.lawSlug,
        changedAt: entry.changedAt.toISOString(),
        summary: entry.summary,
        lawShortTitle: getLawBySlug(entry.lawSlug)?.short_title ?? entry.lawSlug,
      })),
      systemChangeEvents: systemChangeEvents.map((event) => ({
        occurredAt: event.occurredAt.toISOString(),
        source: event.source,
        eventType: event.eventType,
        summary: event.summary,
        environment: event.environment,
        recommendation: (() => {
          try {
            const metadata = event.metadataJson ? JSON.parse(event.metadataJson) as Record<string, unknown> : null;
            return typeof metadata?.recommendation === "string" ? metadata.recommendation : null;
          } catch {
            return null;
          }
        })(),
      })),
    });

    return triggers.map((trigger) => {
      const alertType = DRIFT_TITLE_TO_TYPE[trigger.title] ?? "workspace_drift";
      const ownerRecipients = latestChecklist ? deriveAlertOwners(alertType, latestChecklist.items) : [];
      return {
        userId,
        assessmentId: assessment.id,
        alertType,
        severity: trigger.severity,
        title: trigger.title,
        message: trigger.reason,
        status: "open",
        fingerprint: buildAlertFingerprint(userId, assessment.id, alertType),
        metadataJson: JSON.stringify({
          assessmentName: assessment.name,
          assessmentCreatedAt: assessment.createdAt.toISOString(),
          ownerRecipients,
        }),
      };
    });
  });

  const activeFingerprints = activeAlerts.map((alert) => alert.fingerprint);

  await prisma.$transaction([
    ...activeAlerts.map((alert) =>
      prisma.complianceAlert.upsert({
        where: { fingerprint: alert.fingerprint },
        update: {
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          status: "open",
          metadataJson: alert.metadataJson,
          resolvedAt: null,
        },
        create: alert,
      }),
    ),
    prisma.complianceAlert.updateMany({
      where: {
        userId,
        status: { not: "resolved" },
        ...(activeFingerprints.length > 0 ? { fingerprint: { notIn: activeFingerprints } } : {}),
      },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
      },
    }),
  ]);

  return {
    activeCount: activeAlerts.length,
    assessmentCount: assessments.length,
  };
}

export async function getUserComplianceAlerts(userId: string) {
  const alerts = await prisma.complianceAlert.findMany({
    where: {
      userId,
      status: { in: ["open", "acknowledged"] },
    },
    include: {
      assessment: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 100,
  });

  return alerts.sort((left, right) => {
    const severityGap = mapSeverityRank(right.severity) - mapSeverityRank(left.severity);
    if (severityGap !== 0) return severityGap;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

function getBaseUrl() {
  return process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.APP_URL || null;
}

async function shouldDeliverImmediateComplianceAlerts(userId: string) {
  const prefs = await prisma.alertPreference.findMany({
    where: { userId },
    select: { emailEnabled: true, digestMode: true },
  });

  if (prefs.length === 0) return true;
  return prefs.some((pref) => pref.emailEnabled && pref.digestMode === "immediate");
}

export async function deliverPendingComplianceAlertsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user?.email) {
    return { deliveredCount: 0, skipped: 0 };
  }

  const deliveryEnabled = await shouldDeliverImmediateComplianceAlerts(userId);
  if (!deliveryEnabled) {
    return { deliveredCount: 0, skipped: 0 };
  }

  const alerts = await prisma.complianceAlert.findMany({
    where: {
      userId,
      status: "open",
    },
    include: {
      assessment: {
        select: { id: true, name: true, createdAt: true },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
  });
  const pendingAlerts = alerts.filter((alert) => !alert.lastDeliveredAt || alert.lastDeliveredAt < alert.updatedAt);
  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      integrationSettings: true,
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      },
    },
  });
  const orgRecipients = getOrganizationAlertRecipients(organizations, userId);

  let deliveredCount = 0;
  let slackDeliveredCount = 0;
  let skipped = 0;
  const baseUrl = getBaseUrl();

  for (const alert of pendingAlerts) {
    try {
      const assessmentUrl = baseUrl && alert.assessmentId ? `${baseUrl}/assess/results/${alert.assessmentId}` : null;
      const delivery = await sendComplianceAlertEmail({
        email: user.email,
        name: user.name,
        title: alert.title,
        severity: alert.severity as "high" | "medium" | "low",
        message: alert.message,
        assessmentName: alert.assessment?.name ?? (alert.assessment ? `Assessment ${alert.assessment.createdAt.toISOString().slice(0, 10)}` : null),
        assessmentUrl,
      });
      const metadata = parseAlertMetadata(alert.metadataJson);
      for (const owner of metadata?.ownerRecipients ?? []) {
        if (owner.email === user.email) continue;
        const ownerDelivery = await sendComplianceAlertEmail({
          email: owner.email,
          name: owner.name,
          title: alert.title,
          severity: alert.severity as "high" | "medium" | "low",
          message: `${alert.message} Routed because you own the affected checklist work.`,
          assessmentName: alert.assessment?.name ?? (alert.assessment ? `Assessment ${alert.assessment.createdAt.toISOString().slice(0, 10)}` : null),
          assessmentUrl,
        });
        if (ownerDelivery.delivered) {
          deliveredCount += 1;
        }
      }
      for (const recipient of orgRecipients.emailRecipients) {
        const orgDelivery = await sendComplianceAlertEmail({
          email: recipient.email,
          name: recipient.name,
          title: alert.title,
          severity: alert.severity as "high" | "medium" | "low",
          message: `${alert.message} Routed via workspace ${recipient.organizationName}.`,
          assessmentName: alert.assessment?.name ?? (alert.assessment ? `Assessment ${alert.assessment.createdAt.toISOString().slice(0, 10)}` : null),
          assessmentUrl,
        });
        if (orgDelivery.delivered) {
          deliveredCount += 1;
        }
      }

      if (isComplianceSlackDeliveryConfigured() && alert.severity === "high") {
        const slackDelivery = await sendComplianceAlertSlackMessage({
          title: alert.title,
          severity: alert.severity as "high" | "medium" | "low",
          message: alert.message,
          assessmentName: alert.assessment?.name ?? null,
          assessmentUrl,
        });
        if (slackDelivery.delivered) {
          slackDeliveredCount += 1;
        }
      }
      if (alert.severity === "high") {
        for (const webhook of orgRecipients.slackWebhooks) {
          const orgSlackDelivery = await sendComplianceAlertSlackMessage({
            title: alert.title,
            severity: alert.severity as "high" | "medium" | "low",
            message: `${alert.message} Routed via workspace ${webhook.organizationName}.`,
            assessmentName: alert.assessment?.name ?? null,
            assessmentUrl,
            webhookUrl: webhook.webhookUrl,
          });
          if (orgSlackDelivery.delivered) {
            slackDeliveredCount += 1;
          }
        }
      }

      await prisma.complianceAlert.update({
        where: { id: alert.id },
        data: {
          lastDeliveredAt: new Date(),
          deliveryError: null,
        },
      });

      if (delivery.delivered) {
        deliveredCount += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      await prisma.complianceAlert.update({
        where: { id: alert.id },
        data: {
          deliveryError: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error",
        },
      });
      await captureException(error, {
        tags: { surface: "alerts", action: "deliver-compliance-alert" },
        extra: { userId, alertId: alert.id },
      });
    }
  }

  log("info", "compliance-alerts.delivery.completed", {
    userId,
    matchedCount: pendingAlerts.length,
    deliveredCount,
    slackDeliveredCount,
    skipped,
  });

  return { deliveredCount, slackDeliveredCount, skipped };
}

export async function syncAndDeliverComplianceAlertsForUser(userId: string) {
  const sync = await syncUserComplianceAlerts(userId);
  const delivery = await deliverPendingComplianceAlertsForUser(userId);
  return { ...sync, ...delivery };
}
