import type { AssessmentInput, AssessmentResult } from "./rules-engine";

export const assessments = new Map<
  string,
  { input: AssessmentInput; results?: AssessmentResult[] }
>();
