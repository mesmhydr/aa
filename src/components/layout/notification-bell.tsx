"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

export function NotificationBell() {
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<
    Array<{ id: string; title: string; message: string | null; type: string; createdAt: string; isRead: boolean; actionUrl: string | null }>
  >([]);
  const ref = React.useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications?limit=6", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    }
  }

  React.useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => {
      clearInterval(t);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }), headers: { "Content-Type": "application/json" } });
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 rounded-lg border border-border bg-card p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold">Notifications</p>
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>}
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.actionUrl ?? "/notifications"}
                onClick={() => setOpen(false)}
                className={cn("block rounded-md px-2 py-2 hover:bg-muted", !n.isRead && "bg-accent/40")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-sm bg-primary" />}
                </div>
                {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </Link>
            ))}
          </div>
          <div className="border-t border-border p-1">
            <Link href="/notifications" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-center text-sm text-primary hover:bg-muted">
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
