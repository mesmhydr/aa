"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, User } from "lucide-react";
import type { NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";

function firstItems(nav: NavSection[], count = 4): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  for (const s of nav) {
    for (const i of s.items) {
      if (i.upcoming) continue;
      out.push({ label: i.label, href: i.href });
      if (out.length >= count) return out;
    }
  }
  return out;
}

export function MobileNav({ nav }: { nav: NavSection[] }) {
  const pathname = usePathname();
  const items = firstItems(nav);

  const tabs = [
    ...items.map((i) => ({ key: i.href, href: i.href, label: i.label, icon: LayoutDashboard })),
    { key: "notifications", href: "/notifications", label: "Alerts", icon: Bell },
    { key: "profile", href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="grid h-14 grid-cols-5">
        {tabs.slice(0, 5).map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.key}
              href={t.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
