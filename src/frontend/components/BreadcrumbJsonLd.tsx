import { SITE_URL } from "@/frontend/lib/siteConfig";

// Real navigation path only — Home > this page. Not used on the homepage
// itself (a single-item breadcrumb back to itself has no value).
export default function BreadcrumbJsonLd({ name, path }: { name: string; path: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
