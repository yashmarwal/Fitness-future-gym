import SiteHeader from "@/frontend/components/SiteHeader";
import SiteFooter from "@/frontend/components/SiteFooter";
import MobileTabBar from "@/frontend/components/MobileTabBar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-24 lg:pt-28 pb-16 xl:pb-0 flex-1">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}
