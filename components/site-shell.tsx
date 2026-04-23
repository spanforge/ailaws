'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { ReactNode } from "react";

const navLinks = [
  { href: "/explore", label: "Laws" },
  { href: "/assess", label: "Assess" },
  { href: "/compare", label: "Compare" },
  { href: "/guides", label: "Guides" },
  { href: "/map", label: "Map" },
  { href: "/timeline", label: "Timeline" },
  { href: "/penalties", label: "Penalties" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="site-header">
        <div className="shell site-header__inner">
          <Link href="/" className="brand">
            <span className="brand__eyebrow">AI Compliance Intelligence</span>
            <span className="brand__name">LexForge</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {navLinks.map((item) => {
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
            {session ? (
              <>
                <Link href="/dashboard" aria-current={pathname === "/dashboard" ? "page" : undefined}>Dashboard</Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="nav-btn"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined}>Sign in</Link>
                <Link href="/register" className="button button--primary" style={{fontSize:"0.82rem",padding:"0.35rem 0.85rem"}}>Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div id="main-content">{children}</div>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <div>
            <Link href="/" className="brand">
              <span className="brand__eyebrow">AI Compliance Intelligence</span>
              <span className="brand__name">LexForge</span>
            </Link>
            <p className="footer-copy" style={{ marginTop: "0.65rem" }}>
              Track, compare, and assess compliance across global AI regulations.
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
              <Link href="/guides">Sector Guides</Link>
              <Link href="/penalties">Penalty Calculator</Link>
              <Link href="/glossary">Glossary</Link>
            </div>
          </nav>
        </div>
        <div className="shell footer-bottom">
          <p className="footer-copy" style={{ margin: 0 }}>
            © {new Date().getFullYear()} LexForge &middot; Global AI Law Intelligence
          </p>
        </div>
      </footer>
    </>
  );
}

