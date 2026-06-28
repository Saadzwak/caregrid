"use client";

import { motion } from "motion/react";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = 26;
const LEADING = 5;
const colOf = (date: number) => (LEADING + date - 1) % 7;

export function MonthCalendar({ revealed }: { revealed: boolean }) {
  const cells: (number | null)[] = [...Array.from({ length: LEADING }, () => null), ...Array.from({ length: 30 }, (_, i) => i + 1)];
  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {DOW.map((d) => <div key={d} className="text-center text-[0.64rem] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (date === null) return <div key={`b${i}`} />;
          const col = colOf(date);
          const weekend = col >= 5;
          const isToday = date === TODAY;
          const load = weekend ? 0 : 0.5 + ((date * 7) % 5) * 0.09;
          const composedHere = revealed && (date === 29 || date === 30);
          return (
            <div key={date} className="rounded-lg border p-2 min-h-[68px] flex flex-col" style={{ borderColor: isToday ? "hsl(var(--brand))" : "hsl(var(--border))", background: weekend && !composedHere ? "hsl(var(--muted))" : "hsl(var(--card))", boxShadow: isToday ? "inset 0 0 0 1px hsl(var(--brand))" : undefined }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tnum" style={{ color: isToday ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))" }}>{date}</span>
                {isToday && <span className="text-[0.52rem] font-semibold text-brand uppercase">Today</span>}
              </div>
              {composedHere ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-auto rounded-md bg-brand text-brand-foreground text-[0.56rem] font-semibold px-1 py-0.5 leading-tight">{date === 29 ? "+6 sessions" : "+5 sessions"}</motion.div>
              ) : load > 0 ? (
                <div className="mt-auto"><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-brand/70" style={{ width: `${Math.round(load * 100)}%` }} /></div></div>
              ) : (
                <div className="mt-auto text-[0.56rem] text-muted-foreground">{weekend ? "idle" : ""}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
