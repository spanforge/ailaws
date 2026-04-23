"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentInput } from "@/lib/rules-engine";
import { PRODUCT_PRESETS, applyProductPreset, getProductPresetById } from "@/lib/smb";

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

const BLANK: AssessmentInput = {
  company_name: "",
  product_preset: "",
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
  risk_self_assessment: "limited",
};

export default function AssessPage() {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [form, setForm] = useState<AssessmentInput>(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  function toggleMulti(field: "target_markets" | "use_cases", value: string) {
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
        throw new Error("Server error");
      }

      const { id, results } = await res.json();
      sessionStorage.setItem(`assessment-${id}`, JSON.stringify(results));
      sessionStorage.setItem(`assessment-input-${id}`, JSON.stringify(form));
      sessionStorage.setItem("assessment-draft", JSON.stringify(form));
      router.push(`/assess/results/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

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
          Which AI laws apply to your product?
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 2rem" }}>
          Answer {STEPS.length} short sections. We will run a rules-based analysis and generate an action plan you can share today.
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
          />
        ) : (
          <>
            <ActivePresetBanner form={form} onChangePreset={() => setStep(-1)} />
            <div className="assess-progress">
              {STEPS.map((label, index) => (
                <div
                  key={label}
                  className={`assess-step ${index === step ? "assess-step--active" : ""} ${index < step ? "assess-step--done" : ""}`}
                  onClick={() => index < step && setStep(index)}
                  style={{ cursor: index < step ? "pointer" : "default" }}
                >
                  <span className="assess-step__num">{index < step ? "✓" : index + 1}</span>
                  <span className="assess-step__label">{label}</span>
                </div>
              ))}
            </div>

            <div className="content-card" style={{ marginTop: "1.5rem" }}>
              {step === 0 && <StepCompany form={form} set={set} toggleMulti={toggleMulti} />}
              {step === 1 && <StepProduct form={form} set={set} toggleMulti={toggleMulti} />}
              {step === 2 && <StepTechnical form={form} set={set} />}
              {step === 3 && <StepReview form={form} />}

              {error ? <p style={{ color: "var(--red)", marginTop: "1rem" }}>{error}</p> : null}

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
                    disabled={!canAdvance(step, form)}
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
        background: "rgba(16,32,48,0.07)",
        color: "var(--navy)",
        fontSize: "0.78rem",
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function PresetPicker({
  onSelect,
  onBlank,
}: {
  onSelect: (presetId: string) => void;
  onBlank: () => void;
}) {
  return (
    <div className="content-card">
      <h2 style={{ margin: "0 0 0.75rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>
        Start from a preset
      </h2>
      <p style={{ color: "var(--muted)", margin: "0 0 1.25rem" }}>
        Choose the closest product shape to prefill the wizard, or start from a blank assessment.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
        {PRODUCT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            style={{
              textAlign: "left",
              padding: "1rem",
              borderRadius: "18px",
              border: "1px solid rgba(16,32,48,0.1)",
              background: "rgba(255,255,255,0.85)",
              cursor: "pointer",
            }}
          >
            <strong style={{ display: "block", color: "var(--navy)", marginBottom: "0.35rem" }}>{preset.title}</strong>
            <span style={{ display: "block", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{preset.description}</span>
            <span
              style={{
                display: "inline-flex",
                marginTop: "0.7rem",
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--navy)",
                background: "rgba(16,32,48,0.07)",
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
  if (step === 0) return Boolean(form.hq_region && form.target_markets.length > 0);
  if (step === 1) return Boolean(form.product_type && form.use_cases.length > 0);
  return true;
}

function StepCompany({
  form,
  set,
  toggleMulti,
}: {
  form: AssessmentInput;
  set: (field: keyof AssessmentInput, value: unknown) => void;
  toggleMulti: (field: "target_markets" | "use_cases", value: string) => void;
}) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>Company Profile</h2>
      <div className="form-grid">
        <div className="field">
          <label>Company name (optional)</label>
          <input type="text" value={form.company_name ?? ""} onChange={(event) => set("company_name", event.target.value)} placeholder="Acme AI Inc." />
        </div>
        <div className="field">
          <label>Company size</label>
          <select value={form.company_size} onChange={(event) => set("company_size", event.target.value)}>
            <option value="startup">Startup (&lt;50 employees)</option>
            <option value="sme">SME (50-250)</option>
            <option value="large">Large (250-5000)</option>
            <option value="enterprise">Enterprise (5000+)</option>
          </select>
        </div>
        <div className="field">
          <label>HQ Region *</label>
          <select value={form.hq_region} onChange={(event) => set("hq_region", event.target.value)}>
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
          <label>Industry (optional)</label>
          <input
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
      <div className="field" style={{ marginTop: "1.25rem" }}>
        <label>Target markets * (select all that apply)</label>
        <div className="chip-cloud" style={{ marginTop: "0.65rem" }}>
          {TARGET_MARKETS.map((market) => (
            <button
              key={market.code}
              type="button"
              className={`chip ${form.target_markets.includes(market.code) ? "chip--selected" : ""}`}
              onClick={() => toggleMulti("target_markets", market.code)}
            >
              {market.label}
            </button>
          ))}
        </div>
      </div>
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
  toggleMulti: (field: "target_markets" | "use_cases", value: string) => void;
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
          <label>Product type *</label>
          <select value={form.product_type} onChange={(event) => set("product_type", event.target.value)}>
            <option value="saas">SaaS Product</option>
            <option value="ai_model">AI Model / API</option>
            <option value="embedded">AI-Embedded Product</option>
            <option value="platform">Platform / Marketplace</option>
            <option value="generative_ai">Generative AI Service</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Deployment context</label>
          <select value={form.deployment_context} onChange={(event) => set("deployment_context", event.target.value)}>
            <option value="public">Public (B2C)</option>
            <option value="enterprise">Enterprise (B2B)</option>
            <option value="consumer">Consumer App</option>
            <option value="government">Government / Public Sector</option>
          </select>
        </div>
      </div>
      <div className="field" style={{ marginTop: "1.25rem" }}>
        <label>Use cases * (select all that apply)</label>
        <div className="chip-cloud" style={{ marginTop: "0.65rem" }}>
          {USE_CASE_OPTIONS.map((useCase) => (
            <button
              key={useCase.value}
              type="button"
              className={`chip ${form.use_cases.includes(useCase.value) ? "chip--selected" : ""}`}
              onClick={() => toggleMulti("use_cases", useCase.value)}
            >
              {useCase.label}
            </button>
          ))}
        </div>
      </div>
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
}: {
  form: AssessmentInput;
  set: (field: keyof AssessmentInput, value: unknown) => void;
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
        borderRadius: "14px",
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(16,32,48,0.09)",
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: "var(--navy)" }}>{label}</p>
        {hint ? <p style={{ margin: "0.2rem 0 0", fontSize: "0.88rem", color: "var(--muted)" }}>{hint}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => set(field, !form[field])}
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: "999px",
          border: "none",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          background: form[field] ? "var(--navy)" : "rgba(16,32,48,0.08)",
          color: form[field] ? "#fff" : "var(--navy)",
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
      <div className="field" style={{ marginTop: "1.25rem" }}>
        <label>Your risk self-assessment</label>
        <select value={form.risk_self_assessment} onChange={(event) => set("risk_self_assessment", event.target.value)}>
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
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(16,32,48,0.07)" }}>
      <dt style={{ fontWeight: 700, color: "var(--muted)", fontSize: "0.88rem" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: "0.92rem", color: "var(--navy)", textTransform: "capitalize" }}>{value}</dd>
    </div>
  );
}
