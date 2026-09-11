import Link from "next/link";

const TABS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/workouts", label: "Workouts", icon: "fitness_center" },
  { href: "/dashboard/nutrition", label: "Food", icon: "restaurant" },
  { href: "/dashboard/timer", label: "Timer", icon: "timer" },
  { href: "/dashboard/fees", label: "Fees", icon: "payments" },
];

export default function DashboardTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-surface-variant/50 grid grid-cols-5 lg:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-on-surface-variant hover:text-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-xl leading-none">{tab.icon}</span>
          <span className="font-label text-[10px] uppercase tracking-wider">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
