import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";

import "./globals.css";
import { SiteShell } from "@/components/site-shell";
import Providers from "@/components/providers";

const headingFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lexforge.ai"),
  title: {
    default: "Spanforge Compass - AI Compliance Evidence Workspace",
    template: "%s | Spanforge Compass",
  },
  description:
    "Assess AI law exposure, track obligations, and export evidence packages for founders, startups, and SMB teams.",
  openGraph: {
    title: "Spanforge Compass - AI Compliance Evidence Workspace",
    description:
      "Assess AI law exposure, track obligations, and export evidence packages.",
    url: "https://lexforge.ai",
    siteName: "Spanforge Compass",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spanforge Compass - AI Compliance Evidence Workspace",
    description:
      "Assess AI law exposure, track obligations, and export evidence packages.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
