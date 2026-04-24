export type NormalizedSystemChangeEvent = {
  source: string;
  eventType: string;
  environment?: string | null;
  title: string;
  summary: string;
  ref?: string | null;
  commitSha?: string | null;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
  recommendation?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

export function getSystemChangeRecommendation(eventType: string, environment?: string | null) {
  const normalizedEventType = eventType.toLowerCase();
  const normalizedEnvironment = environment?.toLowerCase() ?? "";

  if (normalizedEnvironment === "production" || /deploy|release|migration/.test(normalizedEventType)) {
    return "Rerun the latest assessment before relying on prior compliance posture in production.";
  }
  if (/push|merge|workflow/.test(normalizedEventType)) {
    return "Review whether the change altered model behavior, data handling, or user-facing decisions, then rerun if scope changed.";
  }
  return "Review the change for compliance impact and rerun the assessment if system scope or risk changed.";
}

export function normalizeSystemChangeEvent(params: {
  headers: Headers;
  body: Record<string, unknown>;
}): NormalizedSystemChangeEvent | null {
  const githubEvent = params.headers.get("x-github-event");
  const directSource = clean(params.body.source);

  if (directSource) {
    const eventType = clean(params.body.eventType);
    const title = clean(params.body.title);
    const summary = clean(params.body.summary);
    if (!eventType || !title || !summary) return null;

    const environment = clean(params.body.environment);
    return {
      source: directSource,
      eventType,
      environment,
      title,
      summary,
      ref: clean(params.body.ref),
      commitSha: clean(params.body.commitSha),
      actor: clean(params.body.actor),
      metadata: typeof params.body.metadata === "object" && params.body.metadata !== null ? params.body.metadata as Record<string, unknown> : null,
      occurredAt: clean(params.body.occurredAt) ?? new Date().toISOString(),
      recommendation: getSystemChangeRecommendation(eventType, environment),
    };
  }

  if (githubEvent === "deployment_status") {
    const deploymentStatus = params.body.deployment_status as Record<string, unknown> | undefined;
    const deployment = params.body.deployment as Record<string, unknown> | undefined;
    const repository = params.body.repository as Record<string, unknown> | undefined;
    const state = clean(deploymentStatus?.state) ?? "deployment_status";
    const environment = clean(deploymentStatus?.environment) ?? clean(deployment?.environment);
    const repoName = clean(repository?.full_name) ?? "GitHub repository";
    const ref = clean(deployment?.ref);
    const commitSha = clean(deployment?.sha);
    const actor = clean((deploymentStatus?.creator as Record<string, unknown> | undefined)?.login);
    const occurredAt = clean(deploymentStatus?.updated_at) ?? new Date().toISOString();
    const title = `${repoName} ${state.replace(/_/g, " ")}`;
    const summary = `${repoName} reported ${state.replace(/_/g, " ")}${environment ? ` to ${environment}` : ""}${ref ? ` on ${ref}` : ""}.`;

    return {
      source: "github",
      eventType: state === "success" ? "deployment" : `deployment_${state}`,
      environment,
      title,
      summary,
      ref,
      commitSha,
      actor,
      metadata: params.body,
      occurredAt,
      recommendation: getSystemChangeRecommendation(state === "success" ? "deployment" : `deployment_${state}`, environment),
    };
  }

  if (githubEvent === "workflow_run") {
    const workflowRun = params.body.workflow_run as Record<string, unknown> | undefined;
    const repository = params.body.repository as Record<string, unknown> | undefined;
    const conclusion = clean(workflowRun?.conclusion) ?? "completed";
    const workflowName = clean(workflowRun?.name) ?? "workflow";
    const repoName = clean(repository?.full_name) ?? "GitHub repository";
    const actor = clean((workflowRun?.actor as Record<string, unknown> | undefined)?.login);
    const ref = clean(workflowRun?.head_branch);
    const commitSha = clean(workflowRun?.head_sha);
    const occurredAt = clean(workflowRun?.updated_at) ?? new Date().toISOString();
    const environment = /prod/i.test(workflowName) ? "production" : /stage/i.test(workflowName) ? "staging" : null;
    const derivedEventType = /deploy|release|migrate/i.test(workflowName) ? "deployment" : "workflow_run";
    const title = `${repoName} ${workflowName}`;
    const summary = `${workflowName} ${conclusion}${ref ? ` on ${ref}` : ""}${commitSha ? ` at ${commitSha.slice(0, 7)}` : ""}.`;

    return {
      source: "github",
      eventType: derivedEventType,
      environment,
      title,
      summary,
      ref,
      commitSha,
      actor,
      metadata: params.body,
      occurredAt,
      recommendation: getSystemChangeRecommendation(derivedEventType, environment),
    };
  }

  if (githubEvent === "push") {
    const repository = params.body.repository as Record<string, unknown> | undefined;
    const pusher = params.body.pusher as Record<string, unknown> | undefined;
    const ref = clean(params.body.ref);
    const commitSha = clean(params.body.after);
    const occurredAt = new Date().toISOString();
    const repoName = clean(repository?.full_name) ?? "GitHub repository";
    const actor = clean(pusher?.name);
    const summary = `${repoName} received a push${ref ? ` on ${ref}` : ""}${commitSha ? ` at ${commitSha.slice(0, 7)}` : ""}.`;

    return {
      source: "github",
      eventType: "push",
      environment: null,
      title: `${repoName} push`,
      summary,
      ref,
      commitSha,
      actor,
      metadata: params.body,
      occurredAt,
      recommendation: getSystemChangeRecommendation("push", null),
    };
  }

  return null;
}
