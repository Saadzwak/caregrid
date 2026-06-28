"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import {
  SPECIALTY_META, ALL_SPECIALTIES, getDoctor, getRoom, FOCAL_CLINIC,
  doctorPhoto, bandForHour, availabilityToBandKeys,
} from "@/lib/data";
import { WEEK_DAYS } from "@/lib/calendar";
import type { Specialty } from "@/lib/types";
import { fmt } from "@/components/ui/AnimatedNumber";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge, DoctorAvatar, SpecialtyDot } from "@/components/ui/bits";
import { AvailabilityBoard, type BoardSession } from "@/components/ui/AvailabilityBoard";
import { Calendar, Check, Clock, Euro, Rooms, Sparkles, Star, Stethoscope, Users } from "@/components/ui/icons";

const AFF: Record<string, string> = { independent: "Independent practitioner", visiting: "Visiting", resident: "Resident" };
const payoutOf = (rev: number) => Math.round(rev * 0.42);

export function DocApp() {
  const { plan } = useStore();
  // The visiting doctor is the logged-in identity (the intervenant signs in as Dr. Amara Diallo).
  const doc = getDoctor("dr-diallo")!;
  const sessions = useMemo(() => plan.sessions.filter((s) => s.doctorId === doc.id), [plan, doc.id]);

  const [tab, setTab] = useState("schedule");
  const [avail, setAvail] = useState<Set<string>>(() => new Set(availabilityToBandKeys(doc.availabilities)));
  const [specialty, setSpecialty] = useState<Specialty>(doc.specialty);
  const [accepted, setAccepted] = useState<string[]>([]);

  const board: BoardSession[] = useMemo(
    () => sessions.map((s) => ({
      id: s.id,
      dayIndex: s.dayIndex,
      band: bandForHour(Number(s.start.split(":")[0])),
      title: SPECIALTY_META[s.specialty].short,
      sub: `${s.start} · ${s.filledCount} pts`,
      count: s.filledCount,
    })),
    [sessions]
  );

  const accSessions = sessions.filter((s) => accepted.includes(s.id));
  const earned = doc.revenueViaCareGrid + accSessions.reduce((s, x) => s + payoutOf(x.estRevenue), 0);
  const count = doc.sessionsViaCareGrid + accSessions.length;

  const toggle = (k: string) => setAvail((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div className="flex flex-col gap-5 max-w-[1000px] mx-auto">
      <div>
        <div className="kicker mb-1">Practitioner workspace</div>
        <h1 className="font-display text-3xl font-bold tracking-tight leading-none">Your practice</h1>
      </div>

      <Card className="p-5 flex flex-wrap items-center gap-5">
        <DoctorAvatar name={doc.name} photo={doctorPhoto(doc.id)} hue={doc.hue} size={58} />
        <div className="flex-1 min-w-[180px]">
          <div className="font-display text-xl font-bold">{doc.name}</div>
          <div className="text-muted-foreground text-sm flex items-center gap-1.5">{doc.credential} · {AFF[doc.affiliation]} · <Star width={13} height={13} className="text-warning" />{doc.rating}</div>
        </div>
        <div className="flex gap-8">
          <div><div className="kicker mb-1">Sessions via CareGrid</div><div className="font-display text-2xl font-bold tnum">{count}</div></div>
          <div><div className="kicker mb-1">Earned via CareGrid</div><div className="font-display text-2xl font-bold tnum text-brand">{fmt.euro(earned)}</div></div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="schedule"><Calendar width={15} height={15} /> My schedule</TabsTrigger>
          <TabsTrigger value="offers"><Sparkles width={15} height={15} /> Turnkey offers{sessions.length > 0 && <span className="ml-1 rounded-full bg-brand text-brand-foreground text-[0.6rem] px-1.5 py-0.5 font-bold">{sessions.length}</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1"><Stethoscope width={16} height={16} className="text-brand" /><h2 className="font-semibold">Your specialty</h2></div>
              <p className="text-sm text-muted-foreground mb-3">CareGrid matches you into equipped cabinets for this specialty.</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SPECIALTIES.map((s) => {
                  const active = specialty === s;
                  return (
                    <button key={s} onClick={() => setSpecialty(s)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-brand text-brand-foreground border-brand" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                      <SpecialtyDot specialty={s} size={7} /> {SPECIALTY_META[s].label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1"><Calendar width={16} height={16} className="text-brand" /><h2 className="font-semibold">Your availability</h2></div>
              <p className="text-sm text-muted-foreground mb-4">Tap a slot to tell CareGrid when you can travel to a cabinet. <span className="text-success font-medium">Open</span> = available; <span className="text-brand font-medium">booked</span> = a session is on your calendar.</p>
              <AvailabilityBoard available={avail} onToggle={toggle} sessions={board} onSelectSession={() => setTab("offers")} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <div>
            <div className="kicker mb-3">Offers assembled for you — fully arranged, one tap to accept</div>
            <div className="grid md:grid-cols-2 gap-4">
              {sessions.map((s) => {
                const room = getRoom(s.roomId)!;
                const day = WEEK_DAYS[s.dayIndex];
                const m = SPECIALTY_META[s.specialty];
                const isAcc = accepted.includes(s.id);
                return (
                  <motion.div key={s.id} layout>
                    <Card className="overflow-hidden">
                      <div className="px-5 py-3 flex items-center gap-2" style={{ background: isAcc ? "hsl(var(--success) / 0.12)" : "hsl(var(--accent))" }}>
                        <span className="w-2 h-2 rounded-full pulse-ring" style={{ background: isAcc ? "hsl(var(--success))" : "hsl(var(--brand))" }} />
                        <span className="kicker" style={{ color: isAcc ? "hsl(var(--success))" : "hsl(var(--brand))" }}>{isAcc ? "Confirmed · on your calendar" : "New turnkey offer"}</span>
                        <Badge className="ml-auto"><span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: m.soft, color: m.color }}>{m.label}</span></Badge>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Calendar width={15} height={15} className="text-muted-foreground" /> {day.long} {day.date} · {s.start}–{s.end} · {FOCAL_CLINIC.name}</div>
                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                          <div className="flex items-center gap-1.5"><Users width={14} height={14} className="text-muted-foreground" /> {s.filledCount} patients arranged</div>
                          <div className="flex items-center gap-1.5"><Rooms width={14} height={14} className="text-muted-foreground" /> {room.name}</div>
                          <div className="flex items-center gap-1.5"><Clock width={14} height={14} className="text-muted-foreground" /> {s.travelMinutes > 0 ? `+${s.travelMinutes} min travel` : "No travel"}</div>
                          <div className="flex items-center gap-1.5"><Euro width={14} height={14} className="text-muted-foreground" /> payout {fmt.euro(payoutOf(s.estRevenue))}</div>
                        </div>
                        {isAcc ? (
                          <div className="rounded-lg p-3 flex items-center gap-2 text-sm bg-success/10 text-success"><Check width={16} height={16} /> Confirmed — room, patients, equipment &amp; billing locked in.</div>
                        ) : (
                          <Button onClick={() => setAccepted((a) => [...a, s.id])} className="w-full"><Check width={17} height={17} /> Accept session</Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              {sessions.length === 0 && <Card className="p-8 text-center text-muted-foreground text-sm">No sessions assembled for you yet.</Card>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
