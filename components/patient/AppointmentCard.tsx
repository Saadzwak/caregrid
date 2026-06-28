"use client";

import type { Booking } from "@/lib/types";
import { SPECIALTY_META } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge, DoctorAvatar, SpecialtyDot } from "@/components/ui/bits";
import { Bell, Building, MapPin, Sparkles, Stethoscope } from "@/components/ui/icons";

export function AppointmentCard({ b, onToggleReminder }: { b: Booking; onToggleReminder?: (id: string) => void }) {
  const m = SPECIALTY_META[b.specialty];
  const when = b.timeLabel.split("·");
  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="text-center shrink-0 w-[78px]">
          <div className="font-display text-base font-bold leading-none text-foreground">{when[0]?.trim()}</div>
          <div className="text-[0.64rem] text-muted-foreground mt-0.5">{when[1]?.trim() || "appointment"}</div>
        </div>
        <div className="w-px self-stretch bg-border" />
        <DoctorAvatar name={b.doctorName} photo={b.photo} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-semibold"><Stethoscope width={14} height={14} className="text-muted-foreground" /> {b.doctorName}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Building width={12} height={12} /> {b.clinicName}{b.affiliation ? ` · ${b.affiliation}` : ""}</span>
            <span className="flex items-center gap-1"><MapPin width={12} height={12} /> {b.distanceKm} km · {b.area}</span>
            <span className="flex items-center gap-1"><SpecialtyDot specialty={b.specialty} size={6} /> {m.label}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {b.isNew && <Badge className="bg-accent text-brand"><Sparkles width={11} height={11} /> Newly created</Badge>}
          {onToggleReminder ? (
            <button
              onClick={() => onToggleReminder(b.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${b.reminder ? "border-brand/40 text-brand bg-accent/40" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Bell width={13} height={13} /> {b.reminder ? "Reminder on" : "Set reminder"}
            </button>
          ) : (
            b.reminder && <span className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground"><Bell width={12} height={12} /> 1 day before</span>
          )}
        </div>
      </div>
    </Card>
  );
}
