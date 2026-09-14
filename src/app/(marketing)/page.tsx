import DesktopHome from "@/frontend/components/home/DesktopHome";
import MobileHome from "@/frontend/components/home/MobileHome";

// The logged-in-member redirect used to live here via getMemberSession() —
// moved to proxy.ts (middleware) instead, since a Server Component reading
// cookies() is forced dynamic on every request, which meant this page
// (the site's most-visited, heaviest one) could never be statically
// rendered/cached, for anonymous and logged-in visitors alike. Middleware
// handles the redirect before this component ever renders, so it's now a
// plain static page.
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
