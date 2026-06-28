"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, ROLE_META } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Avatar } from "./bits";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { Building, Grid, LogOut, Search, Settings, Stethoscope, Users } from "./icons";

const GROUPS: { label: string; items: { href: string; label: string; Icon: typeof Grid }[] }[] = [
  {
    label: "Spaces",
    items: [
      { href: "/clinic", label: "Orchestration", Icon: Grid },
      { href: "/doc", label: "Practitioner", Icon: Stethoscope },
      { href: "/app", label: "Patient view", Icon: Search },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "Profile & settings", Icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <aside className="hidden md:flex w-[244px] shrink-0 flex-col border-r bg-card sticky top-0 h-screen">
      <div className="px-4 h-[60px] flex items-center gap-2.5 border-b">
        <Brand size={24} />
        <span className="ml-auto rounded-md bg-secondary px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground"><Building width={11} height={11} className="inline -mt-0.5 mr-0.5" />Ops</span>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search width={15} height={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search…" className="w-full h-9 rounded-lg border bg-secondary/50 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-5">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</div>
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href;
                return (
                  <Link key={it.href} href={it.href} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors", active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                    <it.Icon width={16} height={16} className={active ? "text-brand" : ""} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t p-3 flex items-center gap-2.5">
          <Avatar name={user.name} size={32} hue={217} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-[0.68rem] text-muted-foreground truncate">{ROLE_META[user.role].label}</div>
          </div>
          <button onClick={logout} aria-label="Log out" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><LogOut width={15} height={15} /></button>
        </div>
      )}
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { reset, clinicPhase } = useStore();
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* slim mobile bar */}
        <div className="md:hidden border-b h-[56px] flex items-center px-4">
          <Brand size={24} />
        </div>
        <main className="mx-auto w-full max-w-[1200px] px-6 py-6 flex-1">
          {pathname === "/clinic" && clinicPhase !== "idle" && (
            <div className="flex justify-end mb-3">
              <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">Reset demo</button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
