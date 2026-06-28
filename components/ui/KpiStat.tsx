"use client";

import { Card } from "./card";
import { AnimatedNumber } from "./AnimatedNumber";
import type { Euro } from "./icons";

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${26 - ((v - min) / span) * 22 - 2}`).join(" ");
  const color = up ? "hsl(var(--success))" : "hsl(var(--destructive))";
  return (
    <svg viewBox="0 0 100 26" className="w-full h-7" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,26 ${pts} 100,26`} fill={`url(#sg-${up})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiStat({
  label,
  value,
  format,
  Icon,
  delta,
  up = true,
  spark,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  format?: (v: number) => string;
  Icon: typeof Euro;
  delta?: string;
  up?: boolean;
  spark?: number[];
  accent?: string;
  delay?: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="kicker">{label}</span>
        <span className="w-7 h-7 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center"><Icon width={15} height={15} /></span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="font-display text-[1.85rem] font-bold tnum leading-none" style={{ color: accent }}>
          <AnimatedNumber value={value} format={format} delay={delay} />
        </div>
        {spark && spark.length > 1 && (
          <div className="w-[84px] shrink-0 mb-0.5">
            <Sparkline data={spark} up={up} />
          </div>
        )}
      </div>
      {delta && (
        <div className={`text-xs font-semibold mt-2 flex items-center gap-1 ${up ? "text-success" : "text-destructive"}`}>
          <span aria-hidden>{up ? "▲" : "▼"}</span> {delta}
        </div>
      )}
    </Card>
  );
}
