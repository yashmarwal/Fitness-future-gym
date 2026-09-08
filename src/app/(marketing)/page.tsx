import { redirect } from "next/navigation";
import { getMemberSession } from "@/server/auth/session";
import DesktopHome from "@/components/home/DesktopHome";
import MobileHome from "@/components/home/MobileHome";

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
