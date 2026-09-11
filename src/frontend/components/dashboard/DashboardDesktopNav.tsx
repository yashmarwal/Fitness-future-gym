import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/card", label: "Membership Card" },
  { href: "/dashboard/attendance", label: "Attendance" },
  { href: "/dashboard/workouts", label: "Workouts" },
  { href: "/dashboard/nutrition", label: "Nutrition" },
  { href: "/dashboard/timer", label: "Timer" },
  { href: "/dashboard/fees", label: "Fees" },
];

export default function DashboardDesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-6 bg-surface-container-low border-b border-surface-variant/50 px-gutter-desktop h-12">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary-container transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
