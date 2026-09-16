import type { Metadata } from "next";
import DesktopMembership from "@/frontend/components/membership/DesktopMembership";
import MobileMembership from "@/frontend/components/membership/MobileMembership";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Membership Plans",
  description:
    "Membership tiers and free trial pass registration at Fitness Future Gym in Nangloi, Delhi — no predatory contracts or hidden fees.",
  alternates: { canonical: `${SITE_URL}/membership` },
};

export default function MembershipPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Membership Plans" path="/membership" />
      <div className="hidden lg:block">
        <DesktopMembership />
      </div>
      <div className="lg:hidden">
        <MobileMembership />
      </div>
    </>
  );
}
