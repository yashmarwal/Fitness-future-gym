import DesktopAbout from "@/components/about/DesktopAbout";
import MobileAbout from "@/components/about/MobileAbout";

export default function AboutPage() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopAbout />
      </div>
      <div className="lg:hidden">
        <MobileAbout />
      </div>
    </>
  );
}
