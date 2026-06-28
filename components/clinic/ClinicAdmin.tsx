"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { FOCAL_CLINIC, ALL_SPECIALTIES, SPECIALTY_META, getDoctor, getClinic, getRoom } from "@/lib/data";
import { WEEK_LABEL, MONTH_LABEL, sessionsForDoctor, WEEK_DAYS } from "@/lib/calendar";
import type { Specialty } from "@/lib/types";
import { fmt } from "@/components/ui/AnimatedNumber";
import { KpiStat } from "@/components/ui/KpiStat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, Badge, SpecialtyDot } from "@/components/ui/bits";
import { AgentReasoning, STEP_COUNT } from "./AgentReasoning";
import { WeekCalendar } from "./WeekCalendar";
import { MonthCalendar } from "./MonthCalendar";
import { DoctorsPanel } from "./DoctorsPanel";
import { SessionDetail } from "./SessionDetail";
import { CabinetView } from "./CabinetView";
import { ChevronLeft, Calendar, Euro, Sparkles, Stethoscope, Users, Star, Building, Grid } from "@/components/ui/icons";

const DAY_ORDER = [5, 6, 2, 3]; // Sat, Sun, Wed eve, Thu eve

function KpiRow() {
  const { plan, clinicPhase, patients } = useStore();
  const r = clinicPhase === "revealed";
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiStat label="New appointments" value={r ? plan.totalPatients : 0} Icon={Calendar} spark={[3, 5, 4, 6, 8, 12, r ? 22 : 7]} delta={r ? "created this weekend" : undefined} />
      <KpiStat label="Revenue unlocked" value={r ? plan.totalRevenue : 0} format={fmt.euroSigned} Icon={Euro} delay={0.05} spark={[12, 15, 13, 17, 21, 27, r ? 34 : 18]} delta={r ? "vs €0 idle weekend" : undefined} />
      <KpiStat label="Doctors assembled" value={r ? plan.doctorsAssembled : 0} Icon={Stethoscope} delay={0.1} spark={[4, 5, 6, 7, 9, 10, r ? 12 : 8]} delta={r ? `${plan.assembledIndependent} indep · ${plan.assembledVisiting} visiting` : undefined} />
      <KpiStat label="Patients waiting" value={patients.length - (r ? plan.totalPatients : 0)} Icon={Users} delay={0.15} spark={[340, 332, 324, 318, 312, 306, r ? 104 : 306]} delta={r ? "scheduled off the list" : undefined} />
    </div>
  );
}

function PlanTab({ onOpen }: { onOpen: (id: string) => void }) {
  const { plan, clinicPhase, agentRationale } = useStore();
  if (clinicPhase !== "revealed") {
    return (
      <Card className="p-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-accent text-brand flex items-center justify-center mx-auto mb-3"><Sparkles width={24} height={24} /></div>
        <div className="font-semibold mb-1">No plan yet</div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">Run <span className="font-medium text-foreground">Detect opportunities</span> and the engine assembles idle rooms, available doctors and the waitlist into packed sessions.</p>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 flex gap-2.5 bg-accent/40 border-brand/20">
        <span className="text-brand shrink-0 mt-0.5"><Sparkles width={16} height={16} /></span>
        <div><div className="kicker text-brand mb-1">Optimization engine · reasoning</div><p className="text-sm text-foreground/90 leading-snug">{agentRationale}</p></div>
      </Card>
      {DAY_ORDER.map((di) => {
        const day = WEEK_DAYS[di];
        const sessions = plan.sessions.filter((s) => s.dayIndex === di);
        if (!sessions.length) return null;
        const pts = sessions.reduce((a, s) => a + s.filledCount, 0);
        const rev = sessions.reduce((a, s) => a + s.estRevenue, 0);
        return (
          <div key={di}>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="font-semibold">{day.long} {day.date} <span className="text-muted-foreground font-normal">· {Number(sessions[0].start.split(":")[0]) >= 17 ? "evening" : "all day"}</span></div>
              <div className="text-sm text-muted-foreground tnum">{sessions.length} sessions · {pts} patients · {fmt.euro(rev)}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {sessions.map((s) => {
                const doc = getDoctor(s.doctorId)!;
                const room = getRoom(s.roomId)!;
                const m = SPECIALTY_META[s.specialty];
                return (
                  <button key={s.id} onClick={() => onOpen(s.id)} className="rounded-xl border bg-card p-3 text-left transition-colors hover:border-brand/40 hover:bg-accent/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge><span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: m.soft, color: m.color }}><SpecialtyDot specialty={s.specialty} size={6} />{m.label}</span></Badge>
                      <span className="text-xs text-muted-foreground tnum">{s.start}–{s.end}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar name={doc.name} hue={doc.hue} size={28} />
                      <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate">{doc.name}</div><div className="text-[0.68rem] text-muted-foreground truncate capitalize">{doc.affiliation}{s.travelMinutes > 0 ? ` · +${s.travelMinutes}m travel` : ""} · {room.name}</div></div>
                      <div className="text-right shrink-0"><div className="font-display font-bold tnum text-sm">{s.filledCount}<span className="text-muted-foreground font-normal">/{s.capacity}</span></div><div className="text-[0.66rem] text-brand font-medium">{fmt.euro(s.estRevenue)}</div></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DoctorDrill({ doctorId }: { doctorId: string }) {
  const { calendarSessions, setSelectedDoctorId } = useStore();
  const doc = getDoctor(doctorId);
  if (!doc) return null;
  const sessions = sessionsForDoctor(calendarSessions, doctorId);
  const home = doc.homeClinicId ? getClinic(doc.homeClinicId)?.name : null;
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setSelectedDoctorId(null)} className="mb-3 -ml-2"><ChevronLeft width={16} height={16} /> Back to clinic calendar</Button>
      <div className="flex items-center gap-3 mb-1">
        <Avatar name={doc.name} hue={doc.hue} size={46} />
        <div><h2 className="font-display text-xl font-bold">{doc.name}</h2><div className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">{doc.affiliation}{home ? ` · home: ${home}` : " · no home clinic"} · <Star width={12} height={12} className="text-warning" />{doc.rating}</div></div>
      </div>
      <div className="kicker mb-4">Clinic admin view · {doc.specialty} schedule at {FOCAL_CLINIC.name}</div>
      <WeekCalendar sessions={sessions} />
    </div>
  );
}

function CalendarTab({ onOpen }: { onOpen: (id: string) => void }) {
  const { calMode, setCalMode, calendarSessions, specialtyFilter, setSpecialtyFilter, selectedDoctorId, setSelectedDoctorId, clinicPhase } = useStore();
  if (selectedDoctorId) return <DoctorDrill doctorId={selectedDoctorId} />;
  const filtered = specialtyFilter === "all" ? calendarSessions : calendarSessions.filter((s) => s.specialty === specialtyFilter);
  const opts: ("all" | Specialty)[] = ["all", ...ALL_SPECIALTIES];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-xs text-muted-foreground">Offered cabinets · {calMode === "week" ? WEEK_LABEL : MONTH_LABEL} · evenings &amp; weekend open</div>
        <Tabs value={calMode} onValueChange={(v) => setCalMode(v as "week" | "month")}>
          <TabsList className="h-9"><TabsTrigger value="week">Week</TabsTrigger><TabsTrigger value="month">Month</TabsTrigger></TabsList>
        </Tabs>
      </div>
      {calMode === "week" && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opts.map((o) => {
            const active = specialtyFilter === o;
            return <button key={o} onClick={() => setSpecialtyFilter(o)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${active ? "bg-brand text-brand-foreground border-brand" : "bg-card text-muted-foreground hover:text-foreground"}`}>{o !== "all" && <SpecialtyDot specialty={o} size={6} />}{o === "all" ? "All" : SPECIALTY_META[o].short}</button>;
          })}
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={calMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {calMode === "week" ? <WeekCalendar sessions={filtered} onSelectSession={onOpen} onSelectDoctor={(id) => setSelectedDoctorId(id)} /> : <MonthCalendar revealed={clinicPhase === "revealed"} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function ClinicAdmin() {
  const { clinicPhase, detectOpportunities, commitReveal, plan, setSelectedDoctorId, setCalMode } = useStore();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [tab, setTab] = useState("calendar");
  const [topTab, setTopTab] = useState("cabinet");

  useEffect(() => {
    if (clinicPhase !== "detecting") return;
    setActiveStep(0);
    setAnimDone(false);
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      if (step >= STEP_COUNT) { setActiveStep(STEP_COUNT); setAnimDone(true); clearInterval(id); }
      else setActiveStep(step);
    }, 850);
    return () => clearInterval(id);
  }, [clinicPhase]);

  useEffect(() => {
    if (clinicPhase === "detecting" && animDone) { const t = setTimeout(() => commitReveal(), 450); return () => clearTimeout(t); }
  }, [clinicPhase, animDone, commitReveal]);

  useEffect(() => {
    if (clinicPhase === "revealed") setTab("plan");
  }, [clinicPhase]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="kicker mb-1">CareGrid · Host workspace</div>
        <h1 className="font-display text-3xl font-bold tracking-tight leading-none">{user?.name ?? "Your cabinet"}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">Manage your cabinet&rsquo;s availability and equipment — and watch CareGrid orchestrate it into brand-new sessions.</p>
      </div>

      <Tabs value={topTab} onValueChange={setTopTab}>
        <TabsList>
          <TabsTrigger value="cabinet"><Building width={15} height={15} /> My cabinet</TabsTrigger>
          <TabsTrigger value="orchestration"><Grid width={15} height={15} /> Orchestration</TabsTrigger>
        </TabsList>

        <TabsContent value="cabinet">
          <CabinetView onOpen={setDetail} />
        </TabsContent>

        <TabsContent value="orchestration">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground max-w-xl">Assemble offered cabinets, visiting doctors and the waitlist into brand-new sessions.</p>
              {clinicPhase === "idle" && <Button onClick={detectOpportunities}><Sparkles width={17} height={17} /> Detect opportunities</Button>}
              {clinicPhase === "detecting" && <Button disabled><Sparkles width={17} height={17} /> Assembling…</Button>}
            </div>

            <KpiRow />

            {clinicPhase === "detecting" ? (
              <AgentReasoning activeStep={activeStep} plan={plan} />
            ) : (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="plan">Capacity plan</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="practitioners">Practitioners</TabsTrigger>
                </TabsList>
                <TabsContent value="plan"><PlanTab onOpen={setDetail} /></TabsContent>
                <TabsContent value="calendar"><Card className="p-5"><CalendarTab onOpen={setDetail} /></Card></TabsContent>
                <TabsContent value="practitioners"><Card className="p-5"><DoctorsPanel onSelect={(id) => { setSelectedDoctorId(id); setCalMode("week"); setTab("calendar"); }} /></Card></TabsContent>
              </Tabs>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AnimatePresence>{detail && <SessionDetail sessionId={detail} onClose={() => setDetail(null)} />}</AnimatePresence>
    </div>
  );
}
