import type { Metadata } from "next";
import LocationPageContent from "@/frontend/components/location/LocationPageContent";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL, BUSINESS_NAME, BUSINESS_ADDRESS } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Location & Timings",
  description: `Find ${BUSINESS_NAME} in ${BUSINESS_ADDRESS.addressLocality} — full address, opening hours, phone numbers, and directions.`,
  alternates: { canonical: `${SITE_URL}/location` },
};

export default function LocationPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Location & Timings" path="/location" />
      <LocationPageContent />
    </>
  );
}
