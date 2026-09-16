import type { Metadata } from "next";
import DesktopAbout from "@/frontend/components/about/DesktopAbout";
import MobileAbout from "@/frontend/components/about/MobileAbout";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet the coaches behind Fitness Future Gym in Nangloi, Delhi — raw strength training since 2016, hands-on 1:1 coaching, and a genuine powerlifting/bodybuilding floor culture.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd name="About Us" path="/about" />
      <div className="hidden lg:block">
        <DesktopAbout />
      </div>
      <div className="lg:hidden">
        <MobileAbout />
      </div>
    </>
  );
}
