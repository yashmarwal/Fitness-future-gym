import { redirect } from "next/navigation";
import { getMemberSession } from "@/backend/auth/session";
import DesktopHome from "@/frontend/components/home/DesktopHome";
import MobileHome from "@/frontend/components/home/MobileHome";

export default async function Home() {
  const session = await getMemberSession();
  if (session) {
    redirect("/dashboard");
  }

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
