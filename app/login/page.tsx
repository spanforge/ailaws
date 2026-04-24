"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { getProviders, signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ProviderSummary = {
  id: string;
  name: string;
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);

  useEffect(() => {
    getProviders().then((available) => {
      const oauthProviders = Object.values(available ?? {})
        .filter((provider) => provider.id !== "credentials")
        .map((provider) => ({ id: provider.id, name: provider.name }));
      setProviders(oauthProviders);
    });
  }, []);

  useEffect(() => {
    const verificationStatus = searchParams.get("verification");
    const registered = searchParams.get("registered");

    if (verificationStatus === "success") {
      setNotice("Email verified. You can sign in now.");
      setError("");
      return;
    }

    if (verificationStatus === "expired") {
      setError("Your verification link expired. Request a new one below.");
      return;
    }

    if (verificationStatus === "invalid") {
      setError("That verification link is invalid. Request a fresh email below.");
      return;
    }

    if (registered === "1") {
      setNotice("Account created. Verify your email before signing in.");
    }
  }, [searchParams]);

  const canResend = useMemo(() => email.trim().length > 0, [email]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password. If you recently registered, verify your email before signing in.");
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function resendVerification() {
    if (!canResend) return;

    setResending(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to resend verification email.");
      setResending(false);
      return;
    }

    setNotice(data.verifyUrl
      ? `Verification link generated for local development: ${data.verifyUrl}`
      : (data.message ?? "Verification email sent."));
    setResending(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">Spanforge Compass</span>
          <p className="auth-tagline">AI Compliance Evidence Workspace</p>
        </div>

        <h1 className="auth-heading">Sign in to your account</h1>

        {providers.length > 0 ? (
          <div className="auth-providers">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                className="button auth-provider-button"
                onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
              >
                Continue with {provider.name}
              </button>
            ))}
            <div className="auth-divider"><span>or continue with email</span></div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {notice && <p className="auth-success">{notice}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="button button--primary" style={{width:"100%"}} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" className="button auth-provider-button" disabled={!canResend || resending} onClick={resendVerification}>
            {resending ? "Sending verification…" : "Resend verification email"}
          </button>
        </form>

        <p className="auth-note">Google and Microsoft sign-in appear automatically when their client credentials are configured.</p>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
