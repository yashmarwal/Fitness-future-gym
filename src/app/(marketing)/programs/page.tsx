import DesktopPrograms from "@/components/programs/DesktopPrograms";
import MobilePrograms from "@/components/programs/MobilePrograms";

export default function ProgramsPage() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopPrograms />
      </div>
      <div className="lg:hidden">
        <MobilePrograms />
      </div>
    </>
  );
}
