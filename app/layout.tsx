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
    default: "LexForge — AI Law Intelligence",
    template: "%s | LexForge",
  },
  description:
    "Track, compare, and assess compliance across global AI regulations. Your central hub for AI law intelligence.",
  openGraph: {
    title: "LexForge — AI Law Intelligence",
    description:
      "Track, compare, and assess compliance across global AI regulations.",
    url: "https://lexforge.ai",
    siteName: "LexForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LexForge — AI Law Intelligence",
    description:
      "Track, compare, and assess compliance across global AI regulations.",
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
