"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, ROLE_META } from "@/lib/auth";
import { Avatar } from "./bits";
import { Calendar, LogOut, Users } from "./icons";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full border bg-card pl-1 pr-3 py-1 hover:bg-accent/50 transition-colors">
        <Avatar name={user.name} size={28} hue={217} />
        <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{user.name}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 rounded-xl border bg-card shadow-md z-50 p-1.5">
            <div className="px-3 py-2">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              <span className="text-[0.62rem] mt-1.5 inline-block rounded bg-secondary px-1.5 py-0.5 font-semibold text-secondary-foreground">{ROLE_META[user.role].label}</span>
            </div>
            <div className="h-px bg-border my-1" />
            {user.role === "patient" && (
              <Link href="/appointments" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent/60 transition-colors"><Calendar width={15} height={15} /> My appointments</Link>
            )}
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent/60 transition-colors"><Users width={15} height={15} /> Profile &amp; settings</Link>
            <button onClick={() => logout()} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"><LogOut width={15} height={15} /> Log out</button>
          </div>
        </>
      )}
    </div>
  );
}
