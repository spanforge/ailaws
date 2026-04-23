import type { MetadataRoute } from "next";
import { laws } from "@/lib/lexforge-data";

const ORIGIN = "https://lexforge.ai";
// Static date — update when content changes rather than using new Date() which
// causes a different value on every request and defeats CDN caching.
const LAST_MODIFIED = "2026-04-23";

export default function sitemap(): MetadataRoute.Sitemap {
  const topLevel = [
    "/",
    "/explore",
    "/assess",
    "/compare",
    "/map",
    "/timeline",
    "/guides",
    "/penalties",
    "/glossary",
  ].map((path) => ({
    url: `${ORIGIN}${path}`,
    lastModified: LAST_MODIFIED,
  }));

  const lawRoutes = laws.map((law) => ({
    url: `${ORIGIN}/laws/${law.slug}`,
    lastModified: LAST_MODIFIED,
  }));

  return [...topLevel, ...lawRoutes];
}
