"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useEffect, useMemo, useState } from "react";

function getSafeToken(value: string | null) {
  const token = value?.trim();
  return token ? token : null;
}

function JoinWorkspacePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const token = getSafeToken(searchParams.get("token"));
  const [message, setMessage] = useState("Preparing your workspace invitation…");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const callbackUrl = useMemo(() => token ? `/join?token=${encodeURIComponent(token)}` : "/dashboard", [token]);

  useEffect(() => {
    if (!token || status !== "authenticated" || joining) {
      return;
    }

    let cancelled = false;

    async function acceptInvite() {
      setJoining(true);
      setError("");
      setMessage("Accepting invitation…");

      const response = await fetch("/api/organizations/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json().catch(() => ({}));

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Unable to accept this invitation.");
        setMessage("This invitation could not be accepted.");
        setJoining(false);
        return;
      }

      setMessage(`Joined ${data.data?.organization?.name ?? "workspace"}. Redirecting…`);
      router.replace("/dashboard?invite=accepted");
    }

    void acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [joining, router, status, token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">Spanforge Compass</span>
          <p className="auth-tagline">AI Compliance Evidence Workspace</p>
        </div>

        <h1 className="auth-heading">Join workspace</h1>

        {!token ? (
          <>
            <p className="auth-error">This invitation link is missing a token.</p>
            <p className="auth-switch"><Link href="/dashboard">Go to dashboard</Link></p>
          </>
        ) : status === "loading" || (status === "authenticated" && joining) ? (
          <p className="auth-note">{message}</p>
        ) : status === "unauthenticated" ? (
          <>
            <p className="auth-note" style={{ marginTop: 0 }}>
              Sign in or create an account to accept this workspace invitation.
            </p>
            <div className="auth-providers">
              <Link className="button button--primary auth-provider-button" href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                Sign in to accept invite
              </Link>
              <Link className="button auth-provider-button" href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                Create account and accept invite
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={error ? "auth-error" : "auth-success"}>{error || message}</p>
            <p className="auth-switch"><Link href="/dashboard">Go to dashboard</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-logo">Spanforge Compass</span>
            <p className="auth-tagline">AI Compliance Evidence Workspace</p>
          </div>
          <h1 className="auth-heading">Join workspace</h1>
          <p className="auth-note">Preparing your workspace invitation…</p>
        </div>
      </div>
    }>
      <JoinWorkspacePageContent />
    </Suspense>
  );
}