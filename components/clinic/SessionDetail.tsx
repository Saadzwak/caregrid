"use client";

import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import { getDoctor, getRoom, getClinic, getPatient, SPECIALTY_META } from "@/lib/data";
import { WEEK_DAYS } from "@/lib/calendar";
import { fmt } from "@/components/ui/AnimatedNumber";
import { Avatar, SpecialtyTag } from "@/components/ui/bits";
import { Clock, Plus, Rooms, Star } from "@/components/ui/icons";

const AFF: Record<string, string> = { independent: "Independent", visiting: "Visiting", resident: "Resident" };

export function SessionDetail({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { plan, patients } = useStore();
  const s = plan.sessions.find((x) => x.id === sessionId);
  if (!s) return null;
  const doc = getDoctor(s.doctorId)!;
  const room = getRoom(s.roomId)!;
  const day = WEEK_DAYS[s.dayIndex];
  const home = s.travelFromClinicId ? getClinic(s.travelFromClinicId)?.name : null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-foreground/30 z-50" />
      <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed top-0 right-0 bottom-0 w-full max-w-[460px] bg-card z-50 shadow-xl flex flex-col">
        <div className="px-6 py-5 text-brand-foreground relative overflow-hidden bg-brand">
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"><Plus width={16} height={16} style={{ transform: "rotate(45deg)" }} /></button>
          <div className="kicker mb-2 text-white/75">Composed session · {day.long} {day.date}</div>
          <h3 className="font-display text-xl font-bold">{SPECIALTY_META[s.specialty].label} session</h3>
          <div className="flex items-center gap-2 text-white/85 text-sm mt-1.5"><Clock width={14} height={14} /> {s.start}–{s.end}</div>
        </div>
        <div className="p-6 overflow-y-auto scroll-soft flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={doc.name} hue={doc.hue} size={44} />
            <div className="flex-1"><div className="font-semibold">{doc.name}</div><div className="text-sm text-muted-foreground flex items-center gap-1.5">{AFF[doc.affiliation]}{home ? ` · ${home}` : ""} · <Star width={12} height={12} className="text-warning" />{doc.rating}</div></div>
            <SpecialtyTag specialty={s.specialty} />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl border bg-muted/50 p-2.5"><div className="kicker mb-1">Patients</div><div className="font-display text-lg font-bold tnum">{s.filledCount}/{s.capacity}</div></div>
            <div className="rounded-xl border bg-muted/50 p-2.5"><div className="kicker mb-1">Revenue</div><div className="font-display text-lg font-bold tnum text-brand">{fmt.euro(s.estRevenue)}</div></div>
            <div className="rounded-xl border bg-muted/50 p-2.5"><div className="kicker mb-1">Util.</div><div className="font-display text-lg font-bold tnum">{Math.round(s.utilization * 100)}%</div></div>
          </div>
          <div className="rounded-xl border p-3 mb-4 flex items-start gap-2 text-sm">
            <Rooms width={15} height={15} className="text-muted-foreground mt-0.5 shrink-0" />
            <div><span className="font-medium">{room.name}</span><span className="text-muted-foreground"> · {room.equipmentPresent.join(", ")}</span>{s.travelMinutes > 0 && <span className="text-warning"> · +{s.travelMinutes} min travel{home ? ` from ${home}` : ""}</span>}</div>
          </div>
          <div className="kicker mb-2">Slot-by-slot schedule</div>
          <div className="rounded-xl border overflow-hidden">
            {s.slots.map((slot, i) => {
              const pat = slot.patientId ? getPatient(slot.patientId, patients) : null;
              if (slot.kind !== "consult") {
                return <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-sm bg-muted/50 border-b last:border-0"><span className="font-mono text-xs text-muted-foreground w-20">{slot.time}–{slot.endTime}</span><span className="text-muted-foreground italic text-xs">{slot.label}</span></div>;
              }
              return <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-sm border-b last:border-0"><span className="font-mono text-xs text-muted-foreground w-20">{slot.time}</span><span className="font-medium truncate flex-1">{pat?.name ?? "—"}</span><span className="text-xs text-muted-foreground truncate max-w-[150px]">{pat?.reason}</span></div>;
            })}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
