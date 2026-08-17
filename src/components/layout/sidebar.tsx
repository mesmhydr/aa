"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { NavSection } from "@/lib/nav";
import { getNavIcon } from "@/components/layout/icons";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Sidebar({ nav, user }: { nav: NavSection[]; user: { name: string; role: string } }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          AA
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Academic Atelier</p>
          <p className="text-[11px] text-muted-foreground">College ERP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {nav.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = getNavIcon(item.icon);
                if (item.upcoming) {
                  return (
                    <li key={item.label}>
                      <span className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          Upcoming
                        </Badge>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                        active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="leading-tight">
            <p className="truncate text-xs font-medium">{user.name}</p>
            <p className="text-[11px] text-muted-foreground">{user.role.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
