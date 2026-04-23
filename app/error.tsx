"use client";

import Link from "next/link";
import { useEffect } from "react";
import { captureException } from "@/lib/monitoring";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
    void captureException(error, {
      tags: { surface: "app", action: "render-error" },
      extra: { digest: error.digest ?? "none" },
    });
  }, [error]);

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center", maxWidth: "760px" }}>
        <p className="kicker">Application error</p>
        <h1
          style={{
            margin: "0.5rem 0 0.75rem",
            color: "var(--navy)",
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: "48ch", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
          The page hit an unexpected error. You can retry this view or head back to the main research tools.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="button button--primary" onClick={reset}>
            Try again
          </button>
          <Link href="/explore" className="button">
            Browse laws →
          </Link>
          <Link href="/" className="button">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}