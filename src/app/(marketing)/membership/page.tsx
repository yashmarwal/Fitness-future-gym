import DesktopMembership from "@/frontend/components/membership/DesktopMembership";
import MobileMembership from "@/frontend/components/membership/MobileMembership";

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
