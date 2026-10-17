import type { Metadata } from "next";
import AttendanceForm from "@/frontend/components/attendance/AttendanceForm";

// A front-desk self-serve check-in utility, not a page anyone should land
// on from a search result — noindexed rather than blocked from crawling
// entirely (robots.txt disallow would be the wrong tool here; this page
// has no private data, it's just not search-worthy content).
export const metadata: Metadata = {
  title: "Check In",
  robots: { index: false, follow: true },
};

export default function AttendancePage() {
  return (
    <div className="min-h-[75vh] w-full bg-black flex items-center justify-center px-gutter-mobile lg:px-gutter-desktop py-12">
      <AttendanceForm />
    </div>
  );
}
