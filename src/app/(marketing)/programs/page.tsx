import type { Metadata } from "next";
import DesktopPrograms from "@/frontend/components/programs/DesktopPrograms";
import MobilePrograms from "@/frontend/components/programs/MobilePrograms";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Training Programs",
  description:
    "Group training, personal training, and diet planning at Fitness Future Gym in Nangloi, Delhi — technique-first coaching for every level.",
  alternates: { canonical: `${SITE_URL}/programs` },
};

export default function ProgramsPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Training Programs" path="/programs" />
      <div className="hidden lg:block">
        <DesktopPrograms />
      </div>
      <div className="lg:hidden">
        <MobilePrograms />
      </div>
    </>
  );
}
