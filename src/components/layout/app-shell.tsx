import * as React from "react";
import { getNavForAccess } from "@/lib/nav";
import type { Access } from "@/lib/access";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";

export function AppShell({ access, children }: { access: Access; children: React.ReactNode }) {
  const nav = getNavForAccess(access);

  return (
    <div className="min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <Sidebar nav={nav} user={access.user} />
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <a href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              AA
            </span>
          </a>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <UserMenu user={access.user} roleCodes={access.roleCodes} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileNav nav={nav} />
    </div>
  );
}
