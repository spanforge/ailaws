import type { AssessmentInput } from "@/lib/rules-engine";
import { buildIntakeAssistant, type IntakeAssistant } from "@/lib/product-intelligence";

type IntakeAssistantOverlay = Partial<Pick<IntakeAssistant, "summary" | "confidence" | "inferredUseCases" | "inferredDataTypes" | "inferredMarkets" | "missingFacts" | "suggestedActions">>;

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getAssistantConfig() {
  const url = process.env.AI_ASSISTANT_API_URL;
  const apiKey = process.env.AI_ASSISTANT_API_KEY;
  const model = process.env.AI_ASSISTANT_MODEL;
  const keyHeader = (process.env.AI_ASSISTANT_API_KEY_HEADER || "authorization").toLowerCase();
  const authScheme = process.env.AI_ASSISTANT_AUTH_SCHEME || "Bearer";

  if (!url || !apiKey) {
    return null;
  }

  return { url, apiKey, model, keyHeader, authScheme };
}

function buildHeaders(config: NonNullable<ReturnType<typeof getAssistantConfig>>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.keyHeader === "authorization") {
    headers.Authorization = `${config.authScheme} ${config.apiKey}`.trim();
  } else {
    headers[config.keyHeader] = config.apiKey;
  }

  return headers;
}

function parseJsonBlock(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? content;
  return JSON.parse(candidate) as IntakeAssistantOverlay;
}

function mergeAssistant(base: IntakeAssistant, overlay: IntakeAssistantOverlay): IntakeAssistant {
  const inferredUseCases = unique([...(base.inferredUseCases ?? []), ...(overlay.inferredUseCases ?? [])]);
  const inferredDataTypes = unique([...(base.inferredDataTypes ?? []), ...(overlay.inferredDataTypes ?? [])]);
  const inferredMarkets = unique([...(base.inferredMarkets ?? []), ...(overlay.inferredMarkets ?? [])]);

  return {
    ...base,
    summary: overlay.summary?.trim() || base.summary,
    confidence: overlay.confidence ?? base.confidence,
    inferredUseCases,
    inferredDataTypes,
    inferredMarkets,
    missingFacts: unique([...(base.missingFacts ?? []), ...(overlay.missingFacts ?? [])]),
    suggestedActions: unique([...(base.suggestedActions ?? []), ...(overlay.suggestedActions ?? [])]),
    suggestedPatch: {
      ...base.suggestedPatch,
      use_cases: inferredUseCases.length > 0 ? inferredUseCases : base.suggestedPatch.use_cases,
      data_types: inferredDataTypes.length > 0 ? inferredDataTypes : base.suggestedPatch.data_types,
      target_markets: inferredMarkets.length > 0 ? inferredMarkets : base.suggestedPatch.target_markets,
    },
  };
}

async function generateAssistantOverlay(input: AssessmentInput): Promise<IntakeAssistantOverlay | null> {
  const config = getAssistantConfig();
  if (!config) return null;

  const prompt = {
    messages: [
      {
        role: "system",
        content:
          "You are the Spanforge Compass intake assistant. Infer likely AI compliance facts from the supplied product description. Return strict JSON only with keys: summary, confidence, inferredUseCases, inferredDataTypes, inferredMarkets, missingFacts, suggestedActions. Use short arrays. Only use these use cases when relevant: hr, credit_scoring, medical, insurance, biometric, content_generation, education, housing, customer_service, recommendation, fraud_detection, general_purpose. Only use these data types when relevant: personal_data, employment_data, financial_data, health_data, biometric_data, children_data, sensitive_data. Only use these markets when supported by the text: EU, US, UK, CA, SG, AU, JP, IN, AE.",
      },
      {
        role: "user",
        content: JSON.stringify({ input }),
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
    ...(config.model ? { model: config.model } : {}),
  };

  const response = await fetch(config.url, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(prompt),
  });

  if (!response.ok) {
    throw new Error(`Assistant provider returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  const text = Array.isArray(rawContent)
    ? rawContent.map((part) => part.text ?? "").join("\n")
    : rawContent;

  if (!text) {
    return null;
  }

  return parseJsonBlock(text);
}

export function isAiAssistantConfigured() {
  return Boolean(getAssistantConfig());
}

export async function buildIntakeAssistantWithLLM(input: AssessmentInput) {
  const baseline = buildIntakeAssistant(input);
  const config = getAssistantConfig();

  if (!config) {
    return {
      ...baseline,
      provider: "deterministic" as const,
    };
  }

  try {
    const overlay = await generateAssistantOverlay(input);
    return {
      ...mergeAssistant(baseline, overlay ?? {}),
      provider: "llm" as const,
    };
  } catch {
    return {
      ...baseline,
      provider: "deterministic" as const,
    };
  }
}