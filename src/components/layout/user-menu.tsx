"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function UserMenu({ user, roleCodes }: { user: { name: string; email: string; role: string }; roleCodes: string[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 text-xs font-semibold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-[140px] truncate sm:block">{user.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {roleCodes.join(", ").replace(/_/g, " ")}
            </p>
          </div>
          <a
            href="/profile"
            className={cn("flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted")}
          >
            <User className="h-4 w-4" /> Profile
          </a>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-destructive hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
