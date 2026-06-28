"use client";

import { motion } from "motion/react";
import type { CalSession } from "@/lib/calendar";
import { WEEK_DAYS, WORK_START, WORK_END, TODAY_INDEX, toHour } from "@/lib/calendar";
import { SPECIALTY_META, getDoctor } from "@/lib/data";

const HOURS = WORK_END - WORK_START;
const HOUR_H = 33;

function Block({ s, onClick }: { s: CalSession; onClick?: () => void }) {
  const meta = SPECIALTY_META[s.specialty];
  const doc = getDoctor(s.doctorId);
  const top = (toHour(s.start) - WORK_START) * HOUR_H;
  const height = (toHour(s.end) - toHour(s.start)) * HOUR_H - 3;
  const composed = s.origin === "composed";
  return (
    <motion.button
      onClick={onClick}
      initial={composed ? { opacity: 0, scale: 0.92 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden cursor-pointer"
      style={{
        top,
        height,
        background: composed ? "hsl(var(--brand))" : meta.soft,
        border: composed ? "1px solid hsl(var(--brand))" : `1px solid ${meta.color}22`,
        borderLeft: composed ? undefined : `3px solid ${meta.color}`,
        boxShadow: composed ? "0 4px 12px -4px hsl(var(--brand) / 0.5)" : "none",
        color: composed ? "#fff" : "hsl(var(--foreground))",
      }}
    >
      <div className="flex items-center gap-1">
        {!composed && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />}
        <span className="text-[0.66rem] font-semibold truncate">{meta.short}</span>
        {composed && <span className="ml-auto rounded bg-white/25 px-1 text-[0.55rem] font-semibold">New</span>}
      </div>
      {height > 30 && <div className={`text-[0.6rem] truncate ${composed ? "text-white/85" : "text-muted-foreground"}`}>{s.booked}/{s.capacity} · {doc?.name.replace("Dr. ", "Dr ")}</div>}
    </motion.button>
  );
}

export function WeekCalendar({ sessions, onSelectSession, onSelectDoctor }: { sessions: CalSession[]; onSelectSession?: (id: string) => void; onSelectDoctor?: (id: string) => void }) {
  return (
    <div className="overflow-x-auto scroll-soft">
      <div className="min-w-[720px]">
        <div className="grid" style={{ gridTemplateColumns: "44px repeat(7, 1fr)" }}>
          <div />
          {WEEK_DAYS.map((d) => {
            const today = d.index === TODAY_INDEX;
            const weekend = d.index >= 5;
            return (
              <div key={d.index} className="px-1 pb-1.5 text-center">
                <div className="inline-flex flex-col items-center px-2 py-0.5 rounded-lg" style={{ background: today ? "hsl(var(--brand))" : "transparent", color: today ? "#fff" : weekend ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))" }}>
                  <span className="text-[0.62rem] font-semibold uppercase">{d.short}</span>
                  <span className="text-sm font-bold tnum">{d.date}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid" style={{ gridTemplateColumns: "44px repeat(7, 1fr)" }}>
          <div className="relative" style={{ height: HOURS * HOUR_H }}>
            {Array.from({ length: HOURS + 1 }).map((_, i) => (
              <div key={i} className="absolute right-1 -translate-y-1/2 text-[0.58rem] text-muted-foreground tnum" style={{ top: i * HOUR_H }}>{String(WORK_START + i).padStart(2, "0")}</div>
            ))}
          </div>
          {WEEK_DAYS.map((d) => {
            const dayS = sessions.filter((s) => s.dayIndex === d.index);
            const today = d.index === TODAY_INDEX;
            const weekend = d.index >= 5;
            return (
              <div key={d.index} className="relative border-l" style={{ height: HOURS * HOUR_H, background: today ? "hsl(var(--accent))" : weekend ? "hsl(var(--muted))" : "transparent", backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${HOUR_H - 1}px, hsl(var(--border)) ${HOUR_H - 1}px, hsl(var(--border)) ${HOUR_H}px)` }}>
                {dayS.map((s) => (
                  <Block key={s.id} s={s} onClick={() => (s.origin === "composed" ? onSelectSession?.(s.sessionId!) : onSelectDoctor?.(s.doctorId))} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
