import DesktopMembership from "@/components/membership/DesktopMembership";
import MobileMembership from "@/components/membership/MobileMembership";

export default function MembershipPage() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopMembership />
      </div>
      <div className="lg:hidden">
        <MobileMembership />
      </div>
    </>
  );
}
