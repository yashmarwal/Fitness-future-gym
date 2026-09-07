import DesktopHome from "@/components/home/DesktopHome";
import MobileHome from "@/components/home/MobileHome";

export default function Home() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopHome />
      </div>
      <div className="lg:hidden">
        <MobileHome />
      </div>
    </>
  );
}
