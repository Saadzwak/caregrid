"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  FOCAL_CLINIC, SPECIALTY_META, getDoctor, bandForHour, doctorPhoto,
  CABINET_EQUIPMENT, CABINET_OFFERED_DEFAULT, specialtiesForEquipment, specialtiesUnlockedBy,
} from "@/lib/data";
import { WEEK_DAYS } from "@/lib/calendar";
import { fmt } from "@/components/ui/AnimatedNumber";
import { Card } from "@/components/ui/card";
import { Badge, DoctorAvatar, SpecialtyDot } from "@/components/ui/bits";
import { AvailabilityBoard, type BoardSession } from "@/components/ui/AvailabilityBoard";
import { Building, Calendar, Check, Euro, Stethoscope, Users } from "@/components/ui/icons";

function Stat({ label, value, brand }: { label: string; value: string; brand?: boolean }) {
  return (
    <div>
      <div className="kicker mb-1">{label}</div>
      <div className={`font-display text-2xl font-bold tnum ${brand ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}

export function CabinetView({ onOpen }: { onOpen: (sessionId: string) => void }) {
  const { plan } = useStore();
  const [offered, setOffered] = useState<Set<string>>(() => new Set(CABINET_OFFERED_DEFAULT));
  const [equip, setEquip] = useState<Set<string>>(() => new Set(CABINET_EQUIPMENT.filter((e) => e.default).map((e) => e.name)));

  // Sessions booked into this cabinet (the focal clinic = the host's cabinet).
  const sessions: BoardSession[] = useMemo(
    () => plan.sessions.map((s) => ({
      id: s.id,
      dayIndex: s.dayIndex,
      band: bandForHour(Number(s.start.split(":")[0])),
      title: SPECIALTY_META[s.specialty].short,
      sub: `${s.filledCount} patients`,
      count: s.filledCount,
    })),
    [plan]
  );

  const hostable = specialtiesForEquipment([...equip]);
  const upcoming = useMemo(
    () => [...plan.sessions].sort((a, b) => a.dayIndex - b.dayIndex || a.start.localeCompare(b.start)),
    [plan]
  );
  const rentRevenue = Math.round(plan.totalRevenue * 0.18);

  const toggleOffered = (k: string) => setOffered((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleEquip = (name: string) => setEquip((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5 flex flex-wrap items-center gap-5">
        <span className="w-12 h-12 rounded-xl bg-accent text-brand flex items-center justify-center"><Building width={24} height={24} /></span>
        <div className="flex-1 min-w-[180px]">
          <div className="font-display text-xl font-bold">Cabinet Lumière Health</div>
          <div className="text-muted-foreground text-sm">{FOCAL_CLINIC.area} · 6 rooms · offered evenings &amp; weekends</div>
        </div>
        <div className="flex gap-8">
          <Stat label="Sessions hosted" value={String(plan.sessions.length)} />
          <Stat label="Patients seen" value={String(plan.totalPatients)} />
          <Stat label="Revenue from renting" value={fmt.euro(rentRevenue)} brand />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1"><Calendar width={16} height={16} className="text-brand" /><h2 className="font-semibold">Cabinet availability</h2></div>
        <p className="text-sm text-muted-foreground mb-4">Tap a slot to offer your cabinet when it sits idle. <span className="text-success font-medium">Open</span> slots get matched with visiting doctors; <span className="text-brand font-medium">booked</span> slots already hold a session.</p>
        <AvailabilityBoard available={offered} onToggle={toggleOffered} sessions={sessions} onSelectSession={onOpen} />
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1"><Stethoscope width={16} height={16} className="text-brand" /><h2 className="font-semibold">Equipment</h2></div>
        <p className="text-sm text-muted-foreground mb-4">What&rsquo;s installed decides which specialties your cabinet can host.</p>
        <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
          {CABINET_EQUIPMENT.map((e) => {
            const on = equip.has(e.name);
            const unlocks = specialtiesUnlockedBy(e.name);
            return (
              <button key={e.name} onClick={() => toggleEquip(e.name)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${on ? "border-brand/40 bg-accent/40" : "hover:bg-secondary/50"}`}>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${on ? "bg-brand text-brand-foreground" : "border border-input"}`}>{on && <Check width={13} height={13} />}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{e.name}</div>
                  <div className="text-[0.7rem] text-muted-foreground truncate">{unlocks.length ? `Unlocks ${unlocks.map((s) => SPECIALTY_META[s].short).join(", ")}` : "General-purpose"}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-xl bg-secondary/50 p-3.5">
          <div className="kicker mb-2">Your cabinet can host</div>
          <div className="flex flex-wrap gap-1.5">
            {hostable.map((s) => (
              <Badge key={s}><span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: SPECIALTY_META[s].soft, color: SPECIALTY_META[s].color }}><SpecialtyDot specialty={s} size={6} />{SPECIALTY_META[s].label}</span></Badge>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4"><Users width={16} height={16} className="text-brand" /><h2 className="font-semibold">Appointments in your cabinet</h2></div>
        <div className="divide-y">
          {upcoming.map((s) => {
            const doc = getDoctor(s.doctorId)!;
            const day = WEEK_DAYS[s.dayIndex];
            const m = SPECIALTY_META[s.specialty];
            return (
              <button key={s.id} onClick={() => onOpen(s.id)} className="w-full flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-accent/30 -mx-2 px-2 rounded-lg">
                <div className="text-center shrink-0 w-[52px]">
                  <div className="text-xs font-bold">{day.short} {day.date}</div>
                  <div className="text-[0.62rem] text-muted-foreground tnum">{s.start}</div>
                </div>
                <DoctorAvatar name={doc.name} photo={doctorPhoto(doc.id)} hue={doc.hue} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{doc.name}</div>
                  <div className="text-[0.7rem] text-muted-foreground flex items-center gap-1.5 capitalize"><SpecialtyDot specialty={s.specialty} size={6} /> {m.label} · {doc.affiliation}{s.travelMinutes > 0 ? ` · +${s.travelMinutes}m travel` : ""}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tnum flex items-center gap-1 justify-end"><Users width={12} height={12} className="text-muted-foreground" />{s.filledCount}</div>
                  <div className="text-[0.66rem] text-brand font-medium flex items-center gap-0.5 justify-end"><Euro width={11} height={11} />{fmt.euro(s.estRevenue)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
