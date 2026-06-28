"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ROLE_HOME, ROLE_META, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BorderBeam } from "@/components/ui/border-beam";
import { Brand } from "@/components/ui/Brand";
import { Building, Search, Stethoscope, ArrowRight, Check } from "@/components/ui/icons";

const ROLES: { id: Role; Icon: typeof Search }[] = [
  { id: "patient", Icon: Search },
  { id: "host", Icon: Building },
  { id: "intervenant", Icon: Stethoscope },
];

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("patient");

  function submit() {
    login(email || "demo@caregrid.health", role, name);
    router.push(ROLE_HOME[role]);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <Card className="relative w-full max-w-md overflow-hidden shadow-md">
        <BorderBeam size={170} duration={10} />
        <div className="p-8">
          <div className="mb-7"><Brand size={32} /></div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Join CareGrid in seconds.</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>

          <div className="mb-6">
            <Label className="mb-2 block">Account type</Label>
            <div className="grid gap-2">
              {ROLES.map((r) => {
                const active = role === r.id;
                const m = ROLE_META[r.id];
                return (
                  <button key={r.id} onClick={() => setRole(r.id)} className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${active ? "border-brand ring-1 ring-brand bg-accent/40" : "hover:bg-accent/40"}`}>
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-brand text-brand-foreground" : "bg-secondary text-muted-foreground"}`}><r.Icon width={18} height={18} /></span>
                    <div className="flex-1"><div className="font-semibold text-sm">{m.label}</div><div className="text-xs text-muted-foreground">{m.blurb}</div></div>
                    {active && <Check width={18} height={18} className="text-brand" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={submit}>Create account <ArrowRight width={16} height={16} /></Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link href="/login" className="text-brand font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
