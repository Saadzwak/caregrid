import type { ReactNode } from "react";
import type { Specialty, Urgency } from "@/lib/types";
import { SPECIALTY_META } from "@/lib/data";
import { cn } from "@/lib/utils";

export function initials(name: string) {
  const parts = name.replace(/^Dr\.\s*/, "").split(" ");
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export function Avatar({ name, hue = 217, size = 40 }: { name: string; hue?: number; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(140deg, hsl(${hue} 70% 56%), hsl(${hue + 18} 72% 44%))`,
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
      }}
    >
      {initials(name)}
    </div>
  );
}

/** Doctor headshot: real photo (object-cover, fixed box) when available, else the initials avatar. */
export function DoctorAvatar({
  name,
  photo,
  hue = 217,
  size = 40,
  rounded = "full",
}: {
  name: string;
  photo?: string | null;
  hue?: number;
  size?: number;
  rounded?: "full" | "lg";
}) {
  if (!photo) return <Avatar name={name} hue={hue} size={size} />;
  return (
    <span
      className="block overflow-hidden shrink-0 bg-secondary"
      style={{ width: size, height: size, borderRadius: rounded === "full" ? "9999px" : "0.7rem" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={name}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 22%" }}
      />
    </span>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold leading-tight whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

const URGENCY: Record<Urgency, { cls: string; label: string }> = {
  urgent: { cls: "bg-destructive/10 text-destructive", label: "Urgent" },
  soon: { cls: "bg-warning/15 text-warning", label: "Soon" },
  routine: { cls: "bg-secondary text-secondary-foreground", label: "Routine" },
};

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  const s = URGENCY[urgency];
  return <Badge className={s.cls}>{s.label}</Badge>;
}

export function SpecialtyDot({ specialty, size = 8 }: { specialty: Specialty; size?: number }) {
  return <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: SPECIALTY_META[specialty].color }} />;
}

export function SpecialtyTag({ specialty }: { specialty: Specialty }) {
  const m = SPECIALTY_META[specialty];
  return (
    <Badge>
      <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5" style={{ background: m.soft, color: m.color }}>
        <SpecialtyDot specialty={specialty} size={6} />
        {m.label}
      </span>
    </Badge>
  );
}

export function RiskMeter({ risk }: { risk: number }) {
  const pct = Math.round(risk * 100);
  const cls = risk >= 0.28 ? "bg-destructive" : risk >= 0.18 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", cls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tnum text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}
