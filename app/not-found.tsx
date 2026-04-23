import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
        <p className="kicker">404</p>
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
          Page not found
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: "44ch", margin: "0 auto 2.5rem", fontSize: "1.05rem" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Try exploring our AI law database instead.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="button button--primary">
            Go home
          </Link>
          <Link href="/explore" className="button">
            Browse laws →
          </Link>
          <Link href="/assess" className="button">
            Run assessment →
          </Link>
        </div>
      </div>
    </main>
  );
}
