"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentInput } from "@/lib/rules-engine";
import { PRODUCT_PRESETS, applyProductPreset, getProductPresetById } from "@/lib/smb";
import { buildIntakeAssistant, type IntakeAssistant } from "@/lib/product-intelligence";

const STEPS = ["Company Profile", "Product Profile", "Technical Profile", "Review"];

const TARGET_MARKETS = [
  { code: "EU", label: "European Union" },
  { code: "US", label: "United States" },
  { code: "UK", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "CN", label: "China" },
  { code: "BR", label: "Brazil" },
  { code: "SG", label: "Singapore" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "IN", label: "India" },
  { code: "AE", label: "UAE" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "NZ", label: "New Zealand" },
];

const USE_CASE_OPTIONS = [
  { value: "hr", label: "HR / Recruitment" },
  { value: "credit_scoring", label: "Credit Scoring / Lending" },
  { value: "medical", label: "Medical / Healthcare" },
  { value: "insurance", label: "Insurance" },
  { value: "law_enforcement", label: "Law Enforcement" },
  { value: "biometric", label: "Biometric Identification" },
  { value: "content_generation", label: "Content Generation" },
  { value: "education", label: "Education" },
  { value: "housing", label: "Housing" },
  { value: "customer_service", label: "Customer Service / Chatbot" },
  { value: "recommendation", label: "Product / Content Recommendation" },
  { value: "fraud_detection", label: "Fraud Detection" },
  { value: "general_purpose", label: "General Purpose AI" },
];

const DATA_TYPE_OPTIONS = [
  { value: "personal_data", label: "Personal Data" },
  { value: "employment_data", label: "Employment Data" },
  { value: "financial_data", label: "Financial Data" },
  { value: "health_data", label: "Health Data" },
  { value: "biometric_data", label: "Biometric Data" },
  { value: "children_data", label: "Children's Data" },
  { value: "sensitive_data", label: "Sensitive Data" },
];

const BLANK: AssessmentInput = {
  company_name: "",
  product_preset: "",
  system_description: "",
  hq_region: "",
  company_size: "startup",
  industry: "",
  target_markets: [],
  product_type: "saas",
  use_cases: [],
  deployment_context: "public",
  uses_ai: true,
  uses_biometric_data: false,
  processes_personal_data: false,
  processes_eu_personal_data: false,
  automated_decisions: false,
  data_types: [],
  risk_self_assessment: "limited",
};

type ValidationIssue = {
  field: string;
  message: string;
};

function getStepValidationIssues(step: number, form: AssessmentInput): ValidationIssue[] {
  if (step === 0) {
    const issues: ValidationIssue[] = [];
    if (!form.system_description?.trim()) {
      issues.push({ field: "system_description", message: "Describe your AI system so the classifier can infer likely use cases and regulated data." });
    }
    if (!form.hq_region) {
      issues.push({ field: "hq_region", message: "Select the region where your company is headquartered." });
    }
    if (form.target_markets.length === 0) {
      issues.push({ field: "target_markets", message: "Select at least one market where the product is offered or planned." });
    }
    return issues;
  }

  if (step === 1) {
    const issues: ValidationIssue[] = [];
    if (!form.product_type) {
      issues.push({ field: "product_type", message: "Select the product type closest to this system." });
    }
    if (form.use_cases.length === 0) {
      issues.push({ field: "use_cases", message: "Select at least one use case so the rules engine can scope likely laws." });
    }
    return issues;
  }

  return [];
}

export default function AssessPage() {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [form, setForm] = useState<AssessmentInput>(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [intakeAssistant, setIntakeAssistant] = useState<IntakeAssistant>(buildIntakeAssistant(BLANK));

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("assessment-draft");
      if (draft) {
        setForm(JSON.parse(draft) as AssessmentInput);
        setStep(0);
      }
    } catch {
      // Ignore malformed draft data.
    }
  }, []);

  useEffect(() => {
    const baseline = buildIntakeAssistant(form);
    setIntakeAssistant(baseline);

    if (step !== 0 || !form.system_description?.trim()) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/intelligence/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as IntakeAssistant;
        setIntakeAssistant(payload);
      } catch {
        // Keep deterministic fallback when the assistant endpoint is unavailable.
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [form, step]);

function toggleMulti(field: "target_markets" | "use_cases" | "data_types", value: string) {
    setForm((prev) => {
      const current = prev[field] as string[];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
      };
    });
  }

  function set(field: keyof AssessmentInput, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyIntakeSuggestions() {
    setForm((prev) => ({
      ...prev,
      ...intakeAssistant.suggestedPatch,
      use_cases: intakeAssistant.suggestedPatch.use_cases ?? prev.use_cases,
      data_types: intakeAssistant.suggestedPatch.data_types ?? prev.data_types,
      target_markets: intakeAssistant.suggestedPatch.target_markets ?? prev.target_markets,
    }));
  }

  async function runQuickStart(systemDescription: string) {
    const seededInput: AssessmentInput = {
      ...BLANK,
      system_description: systemDescription.trim(),
      uses_ai: true,
    };

    const fallback = buildIntakeAssistant(seededInput);

    try {
      const response = await fetch("/api/intelligence/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seededInput),
      });

      const assistant = response.ok ? ((await response.json()) as IntakeAssistant) : fallback;
      const nextMarkets = assistant.suggestedPatch.target_markets ?? fallback.suggestedPatch.target_markets ?? [];
      const nextUseCases = assistant.suggestedPatch.use_cases ?? fallback.suggestedPatch.use_cases ?? [];

      setForm({
        ...seededInput,
        ...assistant.suggestedPatch,
        target_markets: nextMarkets,
        use_cases: nextUseCases,
        product_type: nextUseCases.includes("content_generation") || nextUseCases.includes("general_purpose") ? "generative_ai" : "saas",
        hq_region: nextMarkets[0] ?? "",
      });
      setStep(0);
    } catch {
      setForm({
        ...seededInput,
        ...fallback.suggestedPatch,
        target_markets: fallback.suggestedPatch.target_markets ?? [],
        use_cases: fallback.suggestedPatch.use_cases ?? [],
        product_type: (fallback.suggestedPatch.use_cases ?? []).includes("content_generation") ? "generative_ai" : "saas",
        hq_region: fallback.suggestedPatch.target_markets?.[0] ?? "",
      });
      setStep(0);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: null }));
        const message = typeof payload?.error === "string" && payload.error.trim()
          ? payload.error
          : res.status === 429
            ? "You have hit the assessment rate limit. Wait a few minutes and try again."
            : "The assessment could not be completed right now. Review your inputs and try again.";
        throw new Error(message);
      }

      const { id, results } = await res.json();
      sessionStorage.setItem(`assessment-${id}`, JSON.stringify(results));
      sessionStorage.setItem(`assessment-input-${id}`, JSON.stringify(form));
      sessionStorage.setItem("assessment-draft", JSON.stringify(form));
      router.push(`/assess/results/${id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const stepIssues = step >= 0 ? getStepValidationIssues(step, form) : [];

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "2.5rem", maxWidth: "760px" }}>
        <p className="kicker">Assessment Wizard</p>
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
          Describe your AI product once and leave with a concrete compliance work plan
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 0.9rem", lineHeight: 1.6 }}>
          Answer {STEPS.length} short sections. We will run a rules-based analysis and turn the result into applicable laws, owner-ready actions, and evidence guidance you can use today.
        </p>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem", fontSize: "0.92rem", lineHeight: 1.55 }}>
          Best for founders, product leads, and compliance operators who need clarity before launch, procurement review, customer diligence, or internal signoff.
        </p>

        {step === -1 ? (
          <PresetPicker
            onSelect={(presetId) => {
              setForm(applyProductPreset(BLANK, presetId));
              setStep(0);
            }}
            onBlank={() => {
              setForm(BLANK);
              setStep(0);
            }}
            onQuickStart={runQuickStart}
          />
        ) : (
          <>
            <ActivePresetBanner form={form} onChangePreset={() => setStep(-1)} />
            <div className="assess-progress">
              {STEPS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`assess-step ${index === step ? "assess-step--active" : ""} ${index < step ? "assess-step--done" : ""}`}
                  onClick={() => index < step && setStep(index)}
                  style={{ cursor: index < step ? "pointer" : "default" }}
                  disabled={index > step}
                  aria-current={index === step ? "step" : undefined}
                >
                  <span className="assess-step__num">{index < step ? "✓" : index + 1}</span>
                  <span className="assess-step__label">{label}</span>
                </button>
              ))}
            </div>

            <div className="content-card" style={{ marginTop: "1.5rem" }} aria-busy={submitting}>
              {step === 0 && <StepCompany form={form} set={set} toggleMulti={toggleMulti} assistant={intakeAssistant} onApplyAssistant={applyIntakeSuggestions} />}
              {step === 1 && <StepProduct form={form} set={set} toggleMulti={toggleMulti} />}
              {step === 2 && <StepTechnical form={form} set={set} toggleMulti={toggleMulti} />}
              {step === 3 && <StepReview form={form} />}

              {stepIssues.length > 0 ? (
                <div className="callout" role="status" aria-live="polite" style={{ marginTop: "1rem", borderColor: "rgba(244,162,97,0.35)", background: "rgba(244,162,97,0.12)" }}>
                  <p style={{ margin: "0 0 0.35rem", fontWeight: 700, color: "var(--navy)" }}>Complete these required fields before continuing:</p>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                    {stepIssues.map((issue) => (
                      <li key={issue.field}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {error ? <p role="alert" style={{ color: "var(--red)", marginTop: "1rem" }}>{error}</p> : null}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.75rem" }}>
                {step > 0 ? (
                  <button className="button" onClick={() => setStep((current) => current - 1)}>
                    ← Back
                  </button>
                ) : (
                  <button className="button" onClick={() => setStep(-1)}>
                    ← Presets
                  </button>
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    className="button button--primary"
                    onClick={() => setStep((current) => current + 1)}
                    disabled={stepIssues.length > 0}
                  >
                    Next →
                  </button>
                ) : (
                  <button className="button button--primary" onClick={submit} disabled={submitting}>
                    {submitting ? "Analyzing..." : "Run assessment →"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ActivePresetBanner({
  form,
  onChangePreset,
}: {
  form: AssessmentInput;
  onChangePreset: () => void;
}) {
  const preset = getProductPresetById(form.product_preset);

  if (!preset) return null;

  return (
    <div className="content-card" style={{ marginBottom: "1rem", padding: "1rem 1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
            Active preset
          </p>
          <strong style={{ display: "block", color: "var(--navy)", fontSize: "1rem" }}>{preset.title}</strong>
          <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            {preset.description}
          </p>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
            <PresetValue label={`HQ ${form.hq_region || "not set"}`} />
            <PresetValue label={`Markets ${form.target_markets.join(", ") || "not set"}`} />
            <PresetValue label={`Type ${form.product_type}`} />
            <PresetValue label={`Deployment ${form.deployment_context}`} />
            <PresetValue label={`Use cases ${form.use_cases.join(", ") || "not set"}`} />
            <PresetValue label={`Risk ${form.risk_self_assessment || "not set"}`} />
          </div>
        </div>
        <button className="button" type="button" onClick={onChangePreset}>
          Change preset
        </button>
      </div>
    </div>
  );
}

function PresetValue({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: "999px",
        padding: "0.22rem 0.6rem",
        background: "var(--surface-alt)",
        border: "1px solid var(--line)",
        color: "var(--text)",
        fontSize: "0.78rem",
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function PresetPicker({
  onSelect,
  onBlank,
  onQuickStart,
}: {
  onSelect: (presetId: string) => void;
  onBlank: () => void;
  onQuickStart: (systemDescription: string) => Promise<void>;
}) {
  const [quickStartDescription, setQuickStartDescription] = useState("");
  const [starting, setStarting] = useState(false);

  return (
    <div className="content-card">
      <h2 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>
        Pick the fastest path into your first result
      </h2>
      <p style={{ color: "var(--muted)", margin: "0 0 1.25rem" }}>
        Choose the closest product shape, describe the product in plain English, or start blank if you already know exactly how you want to profile the system.
      </p>
      <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "14px", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.14)" }}>
        <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
          Fastest path
        </p>
        <h3 style={{ margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>
          Describe your product in plain English
        </h3>
        <p style={{ margin: "0.35rem 0 0.8rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>
          We will prefill markets, likely use cases, data signals, and the first-pass risk setup so you can move straight into the assessment.
        </p>
        <textarea
          value={quickStartDescription}
          onChange={(event) => setQuickStartDescription(event.target.value)}
          placeholder="Example: We built an AI support assistant for Shopify stores that answers customer questions, summarizes tickets, and uses EU and US customer data."
          rows={4}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
          <button
            type="button"
            className="button button--primary"
            disabled={!quickStartDescription.trim() || starting}
            onClick={async () => {
              setStarting(true);
              await onQuickStart(quickStartDescription);
              setStarting(false);
            }}
          >
            {starting ? "Setting up..." : "Quick-start assessment"}
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
        {PRODUCT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            style={{
              textAlign: "left",
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              cursor: "pointer",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <strong style={{ display: "block", marginBottom: "0.35rem" }}>{preset.title}</strong>
            <span style={{ display: "block", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{preset.description}</span>
            <span
              style={{
                display: "inline-flex",
                marginTop: "0.7rem",
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--primary)",
                background: "var(--primary-light)",
                borderRadius: "999px",
                padding: "0.2rem 0.55rem",
              }}
            >
              {preset.audience}
            </span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <button className="button" onClick={onBlank}>
          Start blank →
        </button>
      </div>
    </div>
  );
}

function canAdvance(step: number, form: AssessmentInput): boolean {
  return getStepValidationIssues(step, form).length === 0;
}

function StepCompany({
  form,
  set,
  toggleMulti,
  assistant,
  onApplyAssistant,
}: {
  form: AssessmentInput;
  set: (field: keyof AssessmentInput, value: unknown) => void;
  toggleMulti: (field: "target_markets" | "use_cases" | "data_types", value: string) => void;
  assistant: IntakeAssistant;
  onApplyAssistant: () => void;
}) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>Company Profile</h2>
      <div className="field" style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="system_description">Describe your AI system *</label>
        <textarea
          id="system_description"
          value={form.system_description ?? ""}
          onChange={(event) => set("system_description", event.target.value)}
          placeholder="Example: We built an AI hiring tool that screens resumes, ranks candidates, and helps recruiters decide who to interview in the EU and US."
          rows={5}
          required
          aria-invalid={!form.system_description?.trim()}
        />
        <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", fontSize: "0.84rem", lineHeight: 1.55 }}>
          This drives the classification layer. We use it to infer likely use cases, risk posture, and missing compliance signals.
        </p>
      </div>
      <div className="content-card" style={{ marginBottom: "1rem", padding: "0.95rem 1rem", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.14)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Intake assistant · {assistant.confidence} confidence
            </p>
            <p style={{ margin: 0, color: "var(--navy)", fontSize: "0.9rem", lineHeight: 1.55 }}>{assistant.summary}</p>
          </div>
          <button type="button" className="button" onClick={onApplyAssistant}>
            Apply inferred fields
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "0.85rem" }}>
          <div>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>Likely use cases</p>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {assistant.inferredUseCases.length > 0 ? assistant.inferredUseCases.map((value) => <PresetValue key={value} label={value.replace(/_/g, " ")} />) : <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Need more detail</span>}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>Detected data signals</p>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {assistant.inferredDataTypes.length > 0 ? assistant.inferredDataTypes.map((value) => <PresetValue key={value} label={value.replace(/_/g, " ")} />) : <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No strong signal yet</span>}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>Missing facts</p>
            {assistant.missingFacts.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "1rem", color: "var(--navy)", fontSize: "0.84rem", lineHeight: 1.55 }}>
                {assistant.missingFacts.slice(0, 3).map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>Enough detail to run a strong first-pass analysis.</p>
            )}
          </div>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="company_name">Company name (optional)</label>
          <input id="company_name" type="text" value={form.company_name ?? ""} onChange={(event) => set("company_name", event.target.value)} placeholder="Acme AI Inc." />
        </div>
        <div className="field">
          <label htmlFor="company_size">Company size</label>
          <select id="company_size" value={form.company_size} onChange={(event) => set("company_size", event.target.value)}>
            <option value="startup">Startup (&lt;50 employees)</option>
            <option value="sme">SME (50-250)</option>
            <option value="large">Large (250-5000)</option>
            <option value="enterprise">Enterprise (5000+)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="hq_region">HQ Region *</label>
          <select id="hq_region" value={form.hq_region} onChange={(event) => set("hq_region", event.target.value)} required aria-invalid={!form.hq_region}>
            <option value="">Select region...</option>
            {TARGET_MARKETS.map((market) => (
              <option key={market.code} value={market.code}>
                {market.label}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="industry">Industry (optional)</label>
          <input
            id="industry"
            type="text"
            value={form.industry ?? ""}
            onChange={(event) => set("industry", event.target.value)}
            placeholder="e.g. Fintech, Healthcare, SaaS"
          />
        </div>
      </div>
      {form.product_preset ? (
        <p style={{ margin: "0.8rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
          Preset defaults loaded for company size, HQ region, industry, and target markets. You can edit any of them.
        </p>
      ) : null}
      <fieldset className="field" style={{ marginTop: "1.25rem" }}>
        <legend style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.45rem" }}>Target markets * (select all that apply)</legend>
        <div className="chip-cloud" style={{ marginTop: "0.65rem" }}>
          {TARGET_MARKETS.map((market) => (
            <button
              key={market.code}
              type="button"
              className={`chip ${form.target_markets.includes(market.code) ? "chip--selected" : ""}`}
              onClick={() => toggleMulti("target_markets", market.code)}
              aria-pressed={form.target_markets.includes(market.code)}
            >
              {market.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function StepProduct({
  form,
  set,
  toggleMulti,
}: {
  form: AssessmentInput;
  set: (field: keyof AssessmentInput, value: unknown) => void;
  toggleMulti: (field: "target_markets" | "use_cases" | "data_types", value: string) => void;
}) {
  const preset = getProductPresetById(form.product_preset);

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>Product Profile</h2>
      {preset ? (
        <div className="callout" style={{ marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Prefilled from <strong>{preset.title}</strong>. Product, use case, deployment, and technical defaults are already loaded.
          </p>
        </div>
      ) : null}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="product_type">Product type *</label>
          <select id="product_type" value={form.product_type} onChange={(event) => set("product_type", event.target.value)}>
            <option value="saas">SaaS Product</option>
            <option value="ai_model">AI Model / API</option>
            <option value="embedded">AI-Embedded Product</option>
            <option value="platform">Platform / Marketplace</option>
            <option value="generative_ai">Generative AI Service</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="deployment_context">Deployment context</label>
          <select id="deployment_context" value={form.deployment_context} onChange={(event) => set("deployment_context", event.target.value)}>
            <option value="public">Public (B2C)</option>
            <option value="enterprise">Enterprise (B2B)</option>
            <option value="consumer">Consumer App</option>
            <option value="government">Government / Public Sector</option>
          </select>
        </div>
      </div>
      <fieldset className="field" style={{ marginTop: "1.25rem" }}>
        <legend style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.45rem" }}>Use cases * (select all that apply)</legend>
        <div className="chip-cloud" style={{ marginTop: "0.65rem" }}>
          {USE_CASE_OPTIONS.map((useCase) => (
            <button
              key={useCase.value}
              type="button"
              className={`chip ${form.use_cases.includes(useCase.value) ? "chip--selected" : ""}`}
              onClick={() => toggleMulti("use_cases", useCase.value)}
              aria-pressed={form.use_cases.includes(useCase.value)}
            >
              {useCase.label}
            </button>
          ))}
        </div>
      </fieldset>
      {preset ? (
        <p style={{ margin: "0.8rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
          If this preset is right, most users only need to adjust markets or one or two toggles before submitting.
        </p>
      ) : null}
    </div>
  );
}

function StepTechnical({
  form,
  set,
  toggleMulti,
}: {
  form: AssessmentInput;
  set: (field: keyof AssessmentInput, value: unknown) => void;
  toggleMulti: (field: "target_markets" | "use_cases" | "data_types", value: string) => void;
}) {
  const Toggle = ({
    field,
    label,
    hint,
  }: {
    field: keyof AssessmentInput;
    label: string;
    hint?: string;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.85rem 1rem",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{label}</p>
        {hint ? <p style={{ margin: "0.2rem 0 0", fontSize: "0.88rem", color: "var(--muted)" }}>{hint}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => set(field, !form[field])}
        role="switch"
        aria-checked={Boolean(form[field])}
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: "999px",
          border: `1px solid ${form[field] ? "var(--primary)" : "var(--line)"}`,
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          background: form[field] ? "var(--primary)" : "var(--surface-alt)",
          color: form[field] ? "#fff" : "var(--muted)",
        }}
      >
        {form[field] ? "Yes" : "No"}
      </button>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>Technical Profile</h2>
      <div className="stack">
        <Toggle field="uses_ai" label="Does your product use AI or ML?" hint="Includes ML models, LLMs, recommendation engines, and similar systems." />
        <Toggle field="processes_personal_data" label="Does your product process personal data?" hint="Names, emails, IDs, behavior data, or similar user information." />
        <Toggle field="processes_eu_personal_data" label="Do you process personal data of EU/EEA residents?" />
        <Toggle field="uses_biometric_data" label="Does your product use biometric data?" hint="Face recognition, fingerprints, voice, gait, or similar signals." />
        <Toggle field="automated_decisions" label="Does your product make automated decisions?" hint="Decisions with legal or similarly significant effects on people." />
      </div>
      <fieldset className="field" style={{ marginTop: "1.25rem" }}>
        <legend style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.45rem" }}>Primary data types in scope</legend>
        <div className="chip-cloud" style={{ marginTop: "0.65rem" }}>
          {DATA_TYPE_OPTIONS.map((dataType) => (
            <button
              key={dataType.value}
              type="button"
              className={`chip ${form.data_types?.includes(dataType.value) ? "chip--selected" : ""}`}
              onClick={() => toggleMulti("data_types", dataType.value)}
              aria-pressed={Boolean(form.data_types?.includes(dataType.value))}
            >
              {dataType.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="field" style={{ marginTop: "1.25rem" }}>
        <label htmlFor="risk_self_assessment">Your risk self-assessment</label>
        <select id="risk_self_assessment" value={form.risk_self_assessment} onChange={(event) => set("risk_self_assessment", event.target.value)}>
          <option value="minimal">Minimal risk</option>
          <option value="limited">Limited risk</option>
          <option value="high">High risk</option>
          <option value="unacceptable">Potentially unacceptable risk</option>
        </select>
      </div>
    </div>
  );
}

function StepReview({ form }: { form: AssessmentInput }) {
  const preset = getProductPresetById(form.product_preset);
  const yesNo = (value: boolean) => (value ? "Yes" : "No");

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>Review & Submit</h2>
      <p style={{ color: "var(--muted)", margin: "0 0 1.25rem" }}>Confirm your inputs before running the analysis.</p>
      <dl className="review-dl">
        <ReviewRow label="Preset" value={preset?.title ?? "Blank assessment"} />
        <ReviewRow label="System Description" value={form.system_description || "-"} />
        <ReviewRow label="HQ Region" value={form.hq_region || "-"} />
        <ReviewRow label="Company Size" value={form.company_size} />
        <ReviewRow label="Target Markets" value={form.target_markets.join(", ") || "None selected"} />
        <ReviewRow label="Product Type" value={form.product_type} />
        <ReviewRow label="Deployment" value={form.deployment_context} />
        <ReviewRow label="Use Cases" value={form.use_cases.join(", ") || "None selected"} />
        <ReviewRow label="Uses AI" value={yesNo(form.uses_ai)} />
        <ReviewRow label="Processes Personal Data" value={yesNo(form.processes_personal_data)} />
        <ReviewRow label="Processes EU Personal Data" value={yesNo(form.processes_eu_personal_data)} />
        <ReviewRow label="Uses Biometric Data" value={yesNo(form.uses_biometric_data)} />
        <ReviewRow label="Automated Decisions" value={yesNo(form.automated_decisions)} />
        <ReviewRow label="Data Types" value={form.data_types?.join(", ") || "-"} />
        <ReviewRow label="Risk Self-Assessment" value={form.risk_self_assessment ?? "-"} />
      </dl>
      <div className="callout" style={{ marginTop: "1.25rem" }}>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          We will evaluate your profile against the tracked AI laws using a deterministic rules engine. Results are informational and should be reviewed with qualified counsel.
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--line)" }}>
      <dt style={{ fontWeight: 700, color: "var(--muted)", fontSize: "0.88rem" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: "0.92rem", color: "var(--navy)", textTransform: "capitalize" }}>{value}</dd>
    </div>
  );
}
