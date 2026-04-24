'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { ReactNode } from "react";

const primaryNavLinks = [
  { href: "/explore", label: "Laws" },
  { href: "/assess", label: "Assess" },
  { href: "/evidence", label: "Evidence" },
  { href: "/templates", label: "Templates" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPrintRoute = pathname.includes("/print");

  if (isPrintRoute) {
    return <div id="main-content">{children}</div>;
  }

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <header className="site-header" role="banner">
        <div className="shell site-header__inner">
          <Link href="/" className="brand">
            <span className="brand__eyebrow">AI Compliance Evidence Workspace</span>
            <span className="brand__name-row">
              <span className="brand__name">
                <span className="brand__spanforge">Spanforge</span>{" "}
                <span className="brand__compass">Compass</span>
              </span>
              <span className="brand__badge">Free Beta</span>
            </span>
          </Link>
          <div className="header-actions">
            <nav className="nav" aria-label="Primary">
            {primaryNavLinks.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            </nav>
            {session ? (
              <>
                <Link href="/dashboard" className="header-link" aria-current={pathname === "/dashboard" ? "page" : undefined}>Dashboard</Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="nav-btn"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="header-link header-link--primary" aria-current={pathname === "/login" ? "page" : undefined}>Sign in</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div id="main-content" role="main">{children}</div>

      <footer className="site-footer" role="contentinfo">
        <div className="shell site-footer__inner">
          <div>
            <Link href="/" className="brand">
              <span className="brand__eyebrow">AI Compliance Evidence Workspace</span>
              <span className="brand__name">
                <span className="brand__spanforge">Spanforge</span>{" "}
                <span className="brand__compass">Compass</span>
              </span>
            </Link>
            <p className="footer-copy" style={{ marginTop: "0.65rem" }}>
              Assess AI law exposure, track obligations, and export evidence packages.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <div className="footer-nav__col">
              <p className="footer-nav__col-heading">Explore</p>
              <Link href="/explore">All Laws</Link>
              <Link href="/compare">Compare Laws</Link>
              <Link href="/map">Jurisdiction Map</Link>
              <Link href="/timeline">Timeline</Link>
            </div>
            <div className="footer-nav__col">
              <p className="footer-nav__col-heading">Compliance</p>
              <Link href="/assess">Assessment Wizard</Link>
              <Link href="/templates">Templates</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/guides">Sector Guides</Link>
              <Link href="/penalties">Penalty Calculator</Link>
              <Link href="/glossary">Glossary</Link>
            </div>
            <div className="footer-nav__col">
              <p className="footer-nav__col-heading">Trust</p>
              <Link href="/pricing">Pricing</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </nav>
        </div>
        <div className="shell footer-bottom">
          <p className="footer-copy" style={{ margin: 0 }}>
            {"©"} {new Date().getFullYear()} Spanforge Compass · AI Compliance Evidence Workspace
          </p>
        </div>
      </footer>
    </>
  );
}
