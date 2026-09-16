import type { MetadataRoute } from "next";
import { SITE_URL } from "@/frontend/lib/siteConfig";

// /admin/* and /dashboard/* are already session-gated (see proxy.ts — an
// unauthenticated request just gets redirected to a login page), but
// disallowing them here too avoids crawlers wasting budget on redirect
// chains into private areas. /login, /signup, and /attendance are real,
// reachable public pages (not blocked here — this is a crawl directive,
// not an indexing one) but have no unique search-worthy content of their
// own, so they're noindexed via each page's own metadata instead — see
// the Hard No List: "robots.txt is not a substitute for noindex."
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
