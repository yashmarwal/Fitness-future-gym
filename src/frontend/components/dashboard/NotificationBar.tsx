"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: "broadcast" | "fee_reminder";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<Notification["type"], string> = {
  broadcast: "campaign",
  fee_reminder: "payments",
};

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.status === "ok") setNotifications(data.notifications);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  async function handleToggle() {
    const opening = !expanded;
    setExpanded(opening);
    if (opening && unreadCount > 0) {
      setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, isRead: true })) : prev));
      await fetch("/api/dashboard/notifications", { method: "POST" }).catch(() => {});
    }
  }

  if (notifications === null) return null;

  return (
    <div className="bg-surface-container-low shadow-hard mb-6">
      <button onClick={handleToggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-lg leading-none ${
              unreadCount > 0
                ? "text-primary-container rounded-full animate-[notif-glow_1.8s_ease-in-out_infinite]"
                : "text-tertiary"
            }`}
          >
            notifications
          </span>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface">Notifications</span>
          {unreadCount > 0 && (
            <span className="font-label text-[9px] uppercase px-1.5 py-0.5 bg-primary-container text-on-primary-container rounded-full animate-[notif-glow_1.8s_ease-in-out_infinite]">
              {unreadCount} new
            </span>
          )}
        </span>
        <span className="material-symbols-outlined text-lg text-tertiary leading-none">
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col divide-y divide-surface-variant/30 border-t border-surface-variant/30">
          {notifications.length === 0 ? (
            <p className="font-body text-sm text-tertiary p-4">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-4 py-3 flex items-start gap-3">
                <span className="material-symbols-outlined text-base text-primary-container leading-none shrink-0 mt-0.5">
                  {TYPE_ICON[n.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-label text-xs uppercase text-on-surface truncate">{n.title}</p>
                    <span className="font-body text-[10px] text-outline shrink-0">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="font-body text-sm text-tertiary mt-1">{n.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
