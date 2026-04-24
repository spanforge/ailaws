export type EvidenceArtifactRecord = {
  id: string;
  title?: string;
  description?: string | null;
  artifactType?: string;
  sourceType?: string | null;
  sourceUrl?: string | null;
  status: string;
  collectedAt?: Date | string;
  verifiedAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function getEffectiveEvidenceStatus(artifact: EvidenceArtifactRecord) {
  if (artifact.status === "rejected") return "rejected";
  const expiresAt = toDate(artifact.expiresAt);
  if (expiresAt && expiresAt.getTime() < Date.now()) return "stale";
  return artifact.status;
}

export function getEvidenceStatusTone(status: string) {
  if (status === "verified") return { color: "var(--green)", label: "Verified" };
  if (status === "linked" || status === "collected") return { color: "#915a1e", label: "Collected" };
  if (status === "stale") return { color: "var(--red)", label: "Stale" };
  if (status === "rejected") return { color: "var(--red)", label: "Rejected" };
  return { color: "var(--navy)", label: status };
}

export function summarizeEvidenceCoverage(artifacts: EvidenceArtifactRecord[]) {
  const effectiveStatuses = artifacts.map((artifact) => getEffectiveEvidenceStatus(artifact));
  const verified = effectiveStatuses.filter((status) => status === "verified").length;
  const stale = effectiveStatuses.filter((status) => status === "stale").length;
  const active = effectiveStatuses.filter((status) => status !== "rejected").length;

  return {
    total: artifacts.length,
    active,
    verified,
    stale,
    hasCoverage: active > 0,
  };
}

export function getEvidenceFreshnessLabel(artifact: EvidenceArtifactRecord) {
  const effectiveStatus = getEffectiveEvidenceStatus(artifact);
  if (effectiveStatus === "stale") {
    const expiresAt = toDate(artifact.expiresAt);
    return expiresAt ? `Expired ${expiresAt.toLocaleDateString("en-US")}` : "Marked stale";
  }

  if (artifact.verifiedAt) {
    return `Verified ${toDate(artifact.verifiedAt)?.toLocaleDateString("en-US")}`;
  }

  return `Collected ${toDate(artifact.collectedAt)?.toLocaleDateString("en-US")}`;
}
