"use client";

import { BANDS, bandKey } from "@/lib/data";
import { WEEK_DAYS, TODAY_INDEX } from "@/lib/calendar";
import { Check, Plus } from "@/components/ui/icons";

export interface BoardSession {
  id: string;
  dayIndex: number;
  band: string; // band key (morning/afternoon/evening)
  title: string;
  sub?: string;
  count?: number;
}

/**
 * Weekly band grid (7 days × Morning/Afternoon/Evening). Cells are:
 *   Open (green, toggleable) · Booked (brand, from sessions) · Closed (dashed).
 * Pass onToggle to make Open/Closed cells editable.
 */
export function AvailabilityBoard({
  available,
  onToggle,
  sessions = [],
  onSelectSession,
}: {
  available: Set<string>;
  onToggle?: (key: string) => void;
  sessions?: BoardSession[];
  onSelectSession?: (id: string) => void;
}) {
  const byCell = new Map<string, BoardSession[]>();
  for (const s of sessions) {
    const k = bandKey(s.dayIndex, s.band);
    byCell.set(k, [...(byCell.get(k) || []), s]);
  }
  return (
    <div className="overflow-x-auto scroll-soft">
      <div className="min-w-[680px]">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "84px repeat(7, 1fr)" }}>
          <div />
          {WEEK_DAYS.map((d) => {
            const today = d.index === TODAY_INDEX;
            const weekend = d.index >= 5;
            return (
              <div key={d.index} className="text-center pb-1.5">
                <div className="inline-flex flex-col items-center px-2 py-0.5 rounded-lg" style={{ background: today ? "hsl(var(--brand))" : "transparent", color: today ? "#fff" : weekend ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))" }}>
                  <span className="text-[0.6rem] font-semibold uppercase">{d.short}</span>
                  <span className="text-sm font-bold tnum">{d.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {BANDS.map((b) => (
          <div key={b.key} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "84px repeat(7, 1fr)" }}>
            <div className="flex flex-col justify-center pr-1">
              <div className="text-xs font-semibold">{b.label}</div>
              <div className="text-[0.62rem] text-muted-foreground tnum">{b.sub}</div>
            </div>
            {WEEK_DAYS.map((d) => {
              const key = bandKey(d.index, b.key);
              const booked = byCell.get(key) || [];
              if (booked.length) {
                const s = booked[0];
                const pts = booked.reduce((a, x) => a + (x.count || 0), 0);
                return (
                  <button key={key} onClick={() => onSelectSession?.(s.id)} disabled={!onSelectSession} className="rounded-lg px-2 py-1.5 text-left bg-brand text-brand-foreground min-h-[48px] shadow-sm overflow-hidden transition-transform hover:scale-[1.02] disabled:hover:scale-100">
                    <div className="text-[0.66rem] font-semibold truncate">{booked.length > 1 ? `${booked.length} sessions` : s.title}</div>
                    <div className="text-[0.58rem] text-white/85 truncate">{booked.length > 1 ? `${pts} patients` : s.sub}</div>
                  </button>
                );
              }
              if (available.has(key)) {
                return (
                  <button key={key} onClick={() => onToggle?.(key)} disabled={!onToggle} className="rounded-lg min-h-[48px] flex items-center justify-center gap-1 text-[0.66rem] font-semibold border border-success/40 bg-success/15 text-success transition-colors hover:bg-success/25 disabled:hover:bg-success/15">
                    <Check width={13} height={13} /> Open
                  </button>
                );
              }
              return (
                <button key={key} onClick={() => onToggle?.(key)} disabled={!onToggle} className="rounded-lg min-h-[48px] flex items-center justify-center text-muted-foreground/40 border border-dashed border-border transition-colors hover:text-brand hover:border-brand/50 disabled:hover:text-muted-foreground/40 disabled:hover:border-border">
                  {onToggle ? <Plus width={14} height={14} /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/20 border border-success/40" /> Open</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-dashed border-border" /> Closed</span>
      </div>
    </div>
  );
}
