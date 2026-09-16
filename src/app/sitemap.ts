import type { MetadataRoute } from "next";
import { SITE_URL } from "@/frontend/lib/siteConfig";

// Only the genuinely indexable marketing pages — see robots.ts's comment
// for why /login, /signup, and /attendance (noindexed via their own
// metadata) are deliberately left out of the sitemap too, alongside the
// already-disallowed /admin, /dashboard, /api.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/programs", priority: 0.8, changeFrequency: "monthly" },
    { path: "/membership", priority: 0.8, changeFrequency: "monthly" },
    { path: "/location", priority: 0.7, changeFrequency: "monthly" },
    { path: "/calculator", priority: 0.6, changeFrequency: "yearly" },
  ];

  // No lastModified here on purpose — this app has no real per-page
  // "content last changed" timestamp to report, and stamping every entry
  // with the current request time on every crawl would be a fabricated
  // signal, not a genuine one (see the Hard No List: never fake lastmod).
  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
