"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { getProviders, signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ProviderSummary = {
  id: string;
  name: string;
};

function getSafeCallbackUrl(value: string | null) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  useEffect(() => {
    getProviders().then((available) => {
      const oauthProviders = Object.values(available ?? {})
        .filter((provider) => provider.id !== "credentials")
        .map((provider) => ({ id: provider.id, name: provider.name }));
      setProviders(oauthProviders);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setVerifyUrl(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, callbackUrl }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const data = await res.json();

    setNotice(data.message ?? "Account created. Verify your email before signing in.");
    setVerifyUrl(data.verifyUrl ?? null);

    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">Spanforge Compass</span>
          <p className="auth-tagline">AI Compliance Evidence Workspace</p>
        </div>

        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-sub">Free forever for solo use. No credit card required.</p>

        {providers.length > 0 ? (
          <div className="auth-providers">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                className="button auth-provider-button"
                onClick={() => signIn(provider.id, { callbackUrl })}
              >
                Continue with {provider.name}
              </button>
            ))}
            <div className="auth-divider"><span>or create an account with email</span></div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password <span className="auth-hint">(min 8 chars)</span></label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {notice && <p className="auth-success">{notice}</p>}
          {error && <p className="auth-error">{error}</p>}
          {verifyUrl ? (
            <a className="button auth-provider-button" href={verifyUrl}>
              Open verification link
            </a>
          ) : null}

          <button type="submit" className="button button--primary" style={{width:"100%"}} disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-note">Google and Microsoft sign-in appear automatically when their client credentials are configured.</p>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href={notice
            ? `/login?registered=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
            : (callbackUrl === "/dashboard" ? "/login" : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageFallback heading="Create your account" note="Preparing registration…" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function AuthPageFallback({ heading, note }: { heading: string; note: string }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">Spanforge Compass</span>
          <p className="auth-tagline">AI Compliance Evidence Workspace</p>
        </div>
        <h1 className="auth-heading">{heading}</h1>
        <p className="auth-note">{note}</p>
      </div>
    </div>
  );
}
