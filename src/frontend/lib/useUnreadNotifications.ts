"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Used by both DashboardTabBar and DashboardDesktopNav to light up a dot on
// the Settings tab. Re-checks whenever the route changes rather than just
// once on mount — these nav bars live in the dashboard layout and never
// unmount, so a plain mount-only fetch would never notice that visiting
// Settings just marked everything read (see NotificationBar's handleToggle).
export function useUnreadNotifications(): boolean {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.status === "ok") setHasUnread(d.count > 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return hasUnread;
}
