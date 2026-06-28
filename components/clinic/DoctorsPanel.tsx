"use client";

import { DOCTORS, SPECIALTY_META, getClinic } from "@/lib/data";
import { WEEK_DAYS } from "@/lib/calendar";
import { useStore } from "@/lib/store";
import { Avatar, Badge, SpecialtyDot } from "@/components/ui/bits";
import { ChevronRight, Star } from "@/components/ui/icons";

const AFF: Record<string, { label: string; cls: string }> = {
  independent: { label: "Independent", cls: "bg-accent text-accent-foreground" },
  visiting: { label: "Visiting", cls: "bg-warning/15 text-warning" },
  resident: { label: "Resident", cls: "bg-success/15 text-success" },
};

function availSummary(id: string): string {
  const doc = DOCTORS.find((d) => d.id === id)!;
  return doc.availabilities.map((a) => (Number(a.start.split(":")[0]) >= 17 ? `${WEEK_DAYS[a.dayIndex].short} eve` : WEEK_DAYS[a.dayIndex].short)).join(" · ");
}

export function DoctorsPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const { plan, clinicPhase } = useStore();
  const assembled = new Set(clinicPhase === "revealed" ? plan.sessions.map((s) => s.doctorId) : []);
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Doctors are independent of any single clinic — CareGrid matches them wherever there's an equipped room and demand.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {DOCTORS.map((p) => {
          const aff = AFF[p.affiliation];
          const home = p.homeClinicId ? getClinic(p.homeClinicId)?.name : null;
          const isAssembled = assembled.has(p.id);
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors hover:border-brand/40 hover:bg-accent/40 ${isAssembled ? "bg-accent border-brand/30" : "bg-card"}`}>
              <Avatar name={p.name} hue={p.hue} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate">{p.name}</span>
                  <Badge className={`!px-1.5 !py-0.5 text-[0.58rem] ${aff.cls}`}>{aff.label}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><SpecialtyDot specialty={p.specialty} size={6} /><span className="truncate">{SPECIALTY_META[p.specialty].label}{home ? ` · ${home}` : ""}</span></div>
                <div className="text-[0.66rem] text-muted-foreground mt-0.5">Free: {availSummary(p.id)}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="flex items-center gap-0.5 text-[0.66rem] text-muted-foreground"><Star width={10} height={10} className="text-warning" /> {p.rating}</span>
                <ChevronRight width={15} height={15} className="text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
