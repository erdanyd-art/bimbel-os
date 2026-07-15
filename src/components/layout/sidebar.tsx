"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Students", href: "/students", icon: Users, enabled: true },
  { label: "Teachers", href: "/teachers", icon: GraduationCap, enabled: false },
  { label: "Classes", href: "/classes", icon: BookOpen, enabled: false },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck, enabled: false },
  { label: "Payments", href: "/payments", icon: CreditCard, enabled: false },
  { label: "Reports", href: "/reports", icon: BarChart3, enabled: false },
  { label: "Settings", href: "/settings", icon: Settings, enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-sidebar flex w-16 shrink-0 flex-col border-r md:w-60">
      <div className="flex h-14 items-center border-b border-inherit px-4 md:px-5">
        <span className="hidden text-[15px] font-semibold tracking-tight md:inline">Bimbel OS</span>
        <span className="text-primary text-[15px] font-semibold md:hidden">B</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.enabled && pathname.startsWith(item.href);
          const Icon = item.enabled ? item.icon : Lock;

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                title="Coming in future sprints"
                aria-disabled="true"
                className="text-tertiary flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm"
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden truncate md:inline">{item.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="hidden truncate md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
