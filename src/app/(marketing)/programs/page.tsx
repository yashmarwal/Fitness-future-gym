import DesktopPrograms from "@/frontend/components/programs/DesktopPrograms";
import MobilePrograms from "@/frontend/components/programs/MobilePrograms";

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
