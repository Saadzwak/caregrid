"use client";

import { motion } from "motion/react";
import type { CapacityPlan } from "@/lib/types";
import { fmt } from "@/components/ui/AnimatedNumber";
import { Card } from "@/components/ui/card";
import { Rooms, Stethoscope, Users, Sparkles, Shield, Calendar, Check } from "@/components/ui/icons";

export const STEP_COUNT = 6;

export function AgentReasoning({ activeStep, plan }: { activeStep: number; plan: CapacityPlan }) {
  const STEPS = [
    { Icon: Rooms, label: "Scanning idle capacity", detail: "Evening + weekend rooms sitting empty across the clinic" },
    { Icon: Shield, label: "Matching equipment to specialties", detail: "Only rooms with the right equipment host each specialty" },
    { Icon: Stethoscope, label: "Finding available doctors", detail: "Independent & visiting specialists with open availability" },
    { Icon: Users, label: "Reading the waitlist", detail: "Longest-waiting, nearest, low-no-show patients first" },
    { Icon: Calendar, label: "Sequencing days + travel", detail: "Packing slots at each specialty's cadence · +15 min travel for visiting doctors" },
    { Icon: Sparkles, label: "Composing the plan", detail: `${plan.sessions.length} sessions · ${plan.totalPatients} patients · ${fmt.euro(plan.totalRevenue)} unlocked` },
  ];
  return (
    <Card className="p-6 relative overflow-hidden shadow-md">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-60 blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--brand) / 0.18), transparent 70%)" }} />
      <div className="flex items-center gap-3 mb-5 relative">
        <div className="w-11 h-11 rounded-xl bg-brand text-brand-foreground flex items-center justify-center pulse-ring"><Sparkles width={22} height={22} /></div>
        <div><div className="kicker text-brand">Optimization engine</div><div className="font-display text-lg font-semibold">Assembling capacity…</div></div>
      </div>
      <ol className="relative flex flex-col gap-0.5">
        <span className="absolute left-[19px] top-3 bottom-3 w-px bg-border" aria-hidden />
        {STEPS.map((s, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          const pending = i > activeStep;
          return (
            <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: pending ? 0.34 : 1, x: 0 }} transition={{ duration: 0.3 }} className="relative flex items-start gap-4 py-2">
              <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: done ? "hsl(var(--brand))" : active ? "hsl(var(--accent))" : "hsl(var(--muted))", color: done ? "#fff" : active ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))" }}>
                {done ? <Check width={20} height={20} /> : active ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}><s.Icon width={19} height={19} /></motion.span> : <s.Icon width={19} height={19} />}
              </div>
              <div className="pt-0.5">
                <div className="font-semibold leading-tight" style={{ color: active ? "hsl(var(--brand))" : "hsl(var(--foreground))" }}>{s.label}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.detail}</div>
              </div>
              {active && <span className="ml-auto self-center w-2 h-2 rounded-full bg-brand animate-breathe" />}
            </motion.li>
          );
        })}
      </ol>
    </Card>
  );
}
