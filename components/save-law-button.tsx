"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function SaveLawButton({ lawSlug }: { lawSlug: string }) {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") { setChecked(true); return; }
    fetch("/api/saved-laws")
      .then((r) => r.json())
      .then((data) => {
        const slugs: string[] = (data.data ?? []).map((s: { lawSlug: string }) => s.lawSlug);
        setSaved(slugs.includes(lawSlug));
        setChecked(true);
      });
  }, [status, lawSlug]);

  if (status === "unauthenticated") {
    return (
      <Link href="/login" className="button" style={{ fontSize: "0.87rem" }}>
        Sign in to save
      </Link>
    );
  }

  if (!checked) return null;

  async function toggle() {
    if (!session) return;
    setLoading(true);
    if (saved) {
      await fetch(`/api/saved-laws?lawSlug=${encodeURIComponent(lawSlug)}`, { method: "DELETE" });
      setSaved(false);
    } else {
      await fetch("/api/saved-laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawSlug }),
      });
      setSaved(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`button${saved ? " button--primary" : ""}`}
      style={{ fontSize: "0.87rem" }}
    >
      {loading ? "…" : saved ? "★ Saved" : "☆ Save to watchlist"}
    </button>
  );
}
