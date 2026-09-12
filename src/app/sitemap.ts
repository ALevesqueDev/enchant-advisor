import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Next's file convention: auto-served at /sitemap.xml. A single-page app
// only has one URL to list, but it's still worth doing — pairs with
// robots.ts to give crawlers an explicit canonical entry point and a
// last-modified signal, rather than leaving them to guess.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
