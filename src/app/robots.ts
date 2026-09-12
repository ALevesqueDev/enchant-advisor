import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Next's file convention: auto-served at /robots.txt. Nothing on this
// site needs to be hidden from crawlers (no accounts, no private data —
// see PROJECT.md), so this just explicitly allows everything and points
// at the sitemap, rather than leaving crawlers to assume that.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
