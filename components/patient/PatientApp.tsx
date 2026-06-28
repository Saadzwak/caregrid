"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ALL_SPECIALTIES, SPECIALTY_META, doctorPhoto } from "@/lib/data";
import { searchAppointments, type SearchOpts } from "@/lib/engine";
import type { ApptOption, Specialty } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BorderBeam } from "@/components/ui/border-beam";
import { Brand } from "@/components/ui/Brand";
import { UserMenu } from "@/components/ui/UserMenu";
import { Badge, DoctorAvatar, SpecialtyDot } from "@/components/ui/bits";
import { AppointmentCard } from "./AppointmentCard";
import { fmt } from "@/components/ui/AnimatedNumber";
import { ArrowRight, Bell, Building, Calendar, Check, ChevronLeft, Clock, MapPin, Search, Shield, Sparkles, Stethoscope, Wallet } from "@/components/ui/icons";

type Step = "home" | "specialty" | "options" | "details" | "searching" | "results" | "checkout" | "confirmed";

const CONSULT_FEE: Record<Specialty, number> = {
  Dermatology: 70, Cardiology: 110, "General Medicine": 30, Ophthalmology: 60, Gynecology: 80, Radiology: 130, Endocrinology: 80,
};

const PRESETS = [
  { label: "Place de la République, Paris", lat: 48.8675, lng: 2.3636 },
  { label: "Bastille, Paris", lat: 48.8531, lng: 2.3692 },
  { label: "Nation, Paris", lat: 48.8483, lng: 2.3958 },
  { label: "Le Marais, Paris", lat: 48.859, lng: 2.361 },
];

const REASON_CHIPS: Record<Specialty, string[]> = {
  Dermatology: ["Skin lesion / mole", "Acne or eczema", "Annual screening"],
  Cardiology: ["Palpitations", "Blood pressure", "Follow-up"],
  "General Medicine": ["Check-up", "Medication review", "Fatigue"],
  Ophthalmology: ["Vision check", "Screening", "Follow-up"],
  Gynecology: ["Screening", "Ultrasound", "Consultation"],
  Radiology: ["MRI / CT review", "Imaging"],
  Endocrinology: ["Diabetes review", "Thyroid", "Hormones"],
};

function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["specialty", "options", "details", "results"];
  const idx = step === "searching" ? 3 : order.indexOf(step);
  const labels = ["Specialty", "Details", "You", "Match"];
  return (
    <div className="flex items-center gap-1.5 justify-center mb-7">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: i <= idx ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))" }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold" style={{ background: i < idx ? "hsl(var(--brand))" : i === idx ? "hsl(var(--accent))" : "hsl(var(--muted))", color: i < idx ? "#fff" : i === idx ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))" }}>
              {i < idx ? <Check width={12} height={12} /> : i + 1}
            </span>
            {l}
          </div>
          {i < 3 && <span className="w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant={active ? "default" : "outline"} size="sm" onClick={onClick} className="rounded-full">
      {children}
    </Button>
  );
}

export function PatientApp() {
  const { heroPatient, plan, confirmBooking, addBooking, bookings, toggleReminder } = useStore();
  const { user } = useAuth();
  const router = useRouter();
  const firstName = (user?.name || "there").split(" ")[0];

  const [step, setStep] = useState<Step>("home");
  const [specialty, setSpecialty] = useState<Specialty>(heroPatient.specialty);
  const [reason, setReason] = useState<string>(REASON_CHIPS[heroPatient.specialty][0]);
  const [urgency, setUrgency] = useState<"asap" | "soon" | "flex">("asap");
  const [timePref, setTimePref] = useState<"any" | "evening" | "weekend">("any");
  const [loc, setLoc] = useState(PRESETS[0]);
  const [maxKm, setMaxKm] = useState<number>(10);
  const [results, setResults] = useState<ApptOption[]>([]);
  const [pending, setPending] = useState<ApptOption | null>(null);
  const [confirmed, setConfirmed] = useState<{ appt: ApptOption; daysSooner: number } | null>(null);
  const [calAdded, setCalAdded] = useState(false);

  const daysSooner = (r: ApptOption) => heroPatient.currentNextSlotDays - r.inDays;

  function runSearch() {
    setStep("searching");
    const opts: SearchOpts = { maxKm: maxKm || undefined, preferEveningWeekend: timePref !== "any" };
    const found = searchAppointments(specialty, loc, plan, heroPatient.id, opts);
    setTimeout(() => {
      setResults(found);
      setStep("results");
    }, 1400);
  }

  function startCheckout(appt: ApptOption) {
    setPending(appt);
    setStep("checkout");
  }

  function pay() {
    if (!pending) return;
    const ds = daysSooner(pending);
    confirmBooking(heroPatient.id);
    addBooking(pending, ds);
    setConfirmed({ appt: pending, daysSooner: ds });
    setCalAdded(false);
    setStep("confirmed");
  }

  const confirmedBooking = confirmed ? bookings.find((b) => b.id === confirmed.appt.id) : null;

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[900px] px-6 h-[60px] flex items-center">
          <button onClick={() => setStep("home")}><Brand size={28} /></button>
          <div className="ml-auto"><UserMenu /></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-6 py-8 flex-1">
        <AnimatePresence mode="wait">
          {/* HOME */}
          {step === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {bookings.length > 0 ? (
                <div className="pt-2">
                  <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back, {firstName}.</h1>
                  <p className="text-muted-foreground mt-1.5 mb-6">Here are your upcoming appointments.</p>
                  <div className="flex flex-col gap-3 mb-6">
                    {bookings.map((b) => <AppointmentCard key={b.id} b={b} onToggleReminder={toggleReminder} />)}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setStep("specialty")}><Search width={16} height={16} /> Book another appointment</Button>
                    <Button variant="outline" onClick={() => router.push("/appointments")}>View all appointments</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-8">
                  <Badge className="bg-accent text-accent-foreground mb-5"><Sparkles width={13} height={13} /> Find care, sooner</Badge>
                  <h1 className="font-display text-[2.6rem] md:text-[3rem] font-bold leading-[1.05] tracking-tight">Hello {firstName}.<br />When do you need care?</h1>
                  <p className="text-muted-foreground text-lg mt-4 max-w-[480px] mx-auto leading-relaxed">Search by specialty and location — CareGrid surfaces brand-new sessions near you, often available within days.</p>
                  <Button size="lg" onClick={() => setStep("specialty")} className="mt-7"><Search width={18} height={18} /> Find an appointment</Button>
                </div>
              )}
            </motion.div>
          )}

          {/* SPECIALTY */}
          {step === "specialty" && (
            <motion.div key="specialty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Stepper step={step} />
              <h2 className="font-display text-2xl font-bold text-center mb-1">What do you need?</h2>
              <p className="text-muted-foreground text-center text-sm mb-6">Choose a specialty</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_SPECIALTIES.map((s) => {
                  const m = SPECIALTY_META[s];
                  const active = specialty === s;
                  return (
                    <button key={s} onClick={() => { setSpecialty(s); setReason(REASON_CHIPS[s][0]); }} className={`rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3 transition-shadow hover:shadow-md ${active ? "ring-2 ring-brand border-brand" : ""}`}>
                      <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: m.soft, color: m.color }}><Stethoscope width={20} height={20} /></span>
                      <div className="flex-1 text-left"><div className="font-semibold">{m.label}</div><div className="text-xs text-muted-foreground">~{m.consultMinutes} min consult</div></div>
                      {active && <Check width={18} height={18} className="text-brand" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep("home")}><ChevronLeft width={16} height={16} /> Back</Button>
                <Button onClick={() => setStep("options")}>Continue <ArrowRight width={16} height={16} /></Button>
              </div>
            </motion.div>
          )}

          {/* OPTIONS */}
          {step === "options" && (
            <motion.div key="options" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Stepper step={step} />
              <h2 className="font-display text-2xl font-bold text-center mb-6">Tell us a bit more</h2>
              <Card className="p-5 flex flex-col gap-5">
                <Section label="Reason"><div className="flex flex-wrap gap-2">{REASON_CHIPS[specialty].map((r) => <Chip key={r} active={reason === r} onClick={() => setReason(r)}>{r}</Chip>)}</div></Section>
                <Section label="How soon?"><div className="flex flex-wrap gap-2"><Chip active={urgency === "asap"} onClick={() => setUrgency("asap")}>As soon as possible</Chip><Chip active={urgency === "soon"} onClick={() => setUrgency("soon")}>Within a few weeks</Chip><Chip active={urgency === "flex"} onClick={() => setUrgency("flex")}>Flexible</Chip></div></Section>
                <Section label="Preferred time"><div className="flex flex-wrap gap-2"><Chip active={timePref === "any"} onClick={() => setTimePref("any")}>Any time</Chip><Chip active={timePref === "evening"} onClick={() => setTimePref("evening")}>Evenings</Chip><Chip active={timePref === "weekend"} onClick={() => setTimePref("weekend")}>Weekends</Chip></div></Section>
                <Section label="Your location">
                  <div className="relative mb-2">
                    <MapPin width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input list="loc-presets" value={loc.label} onChange={(e) => { const m = PRESETS.find((p) => p.label === e.target.value); setLoc(m ?? { ...loc, label: e.target.value }); }} className="pl-9" />
                    <datalist id="loc-presets">{PRESETS.map((p) => <option key={p.label} value={p.label} />)}</datalist>
                  </div>
                  <div className="flex flex-wrap gap-2">{[2, 5, 10, 0].map((k) => <Chip key={k} active={maxKm === k} onClick={() => setMaxKm(k)}>{k === 0 ? "Any distance" : `Within ${k} km`}</Chip>)}</div>
                </Section>
              </Card>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep("specialty")}><ChevronLeft width={16} height={16} /> Back</Button>
                <Button onClick={() => setStep("details")}>Continue <ArrowRight width={16} height={16} /></Button>
              </div>
            </motion.div>
          )}

          {/* DETAILS */}
          {step === "details" && (
            <motion.div key="details" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Stepper step={step} />
              <h2 className="font-display text-2xl font-bold text-center mb-1">Almost there</h2>
              <p className="text-muted-foreground text-center text-sm mb-6">We&rsquo;ll hold your slot the moment we find one</p>
              <Card className="p-5 grid sm:grid-cols-2 gap-4">
                <Field label="Full name" value={user?.name || ""} />
                <Field label="Email" value={user?.email || ""} />
                <Field label="Phone" value="+33 6 12 34 56 78" />
                <Field label="Date of birth" value="14 / 03 / 1989" />
              </Card>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep("options")}><ChevronLeft width={16} height={16} /> Back</Button>
                <Button onClick={runSearch}><Search width={17} height={17} /> Find my appointment</Button>
              </div>
            </motion.div>
          )}

          {/* SEARCHING */}
          {step === "searching" && (
            <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
              <Card className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent text-brand flex items-center justify-center mx-auto mb-4 pulse-ring">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}><Sparkles width={26} height={26} /></motion.span>
                </div>
                <div className="font-display text-xl font-semibold mb-1">Searching capacity near {loc.label.split(",")[0]}…</div>
                <div className="text-muted-foreground text-sm">Including brand-new sessions CareGrid just created</div>
              </Card>
            </motion.div>
          )}

          {/* RESULTS */}
          {step === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display text-xl font-bold">{results.length} options near you</h2>
                <button onClick={() => setStep("options")} className="text-sm text-muted-foreground hover:text-brand flex items-center gap-1"><ChevronLeft width={14} height={14} /> Edit search</button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Sorted by soonest — brand-new sessions near you appear first.</p>
              <div className="flex flex-col gap-3">
                {results.map((r) => <ResultCard key={r.id} r={r} onConfirm={() => startCheckout(r)} />)}
              </div>
            </motion.div>
          )}

          {/* CHECKOUT — demo payment (not connected to any processor) */}
          {step === "checkout" && pending && (() => {
            const fee = CONSULT_FEE[pending.specialty];
            const service = 2;
            const total = fee + service;
            return (
              <motion.div key="checkout" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-2">
                <button onClick={() => setStep("results")} className="text-sm text-muted-foreground hover:text-brand flex items-center gap-1 mb-3"><ChevronLeft width={14} height={14} /> Back to results</button>
                <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Confirm &amp; pay</h2>
                <p className="text-sm text-muted-foreground mb-5">Secure your slot. <span className="font-medium text-foreground">Demo</span> — no real payment is taken.</p>
                <div className="grid md:grid-cols-[1fr_320px] gap-5">
                  <Card className="p-5 order-2 md:order-1">
                    <div className="flex items-center gap-2 mb-4"><Wallet width={16} height={16} className="text-brand" /><span className="font-semibold">Payment details</span><Badge className="ml-auto bg-secondary text-secondary-foreground"><Shield width={11} height={11} /> Demo</Badge></div>
                    <div className="flex flex-col gap-4">
                      <Field label="Cardholder name" value={user?.name || "Demo Patient"} />
                      <div className="space-y-1.5">
                        <Label>Card number</Label>
                        <div className="relative">
                          <Input defaultValue="4242 4242 4242 4242" className="pl-9" />
                          <Wallet width={15} height={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Expiry" value="12 / 28" />
                        <Field label="CVC" value="123" />
                      </div>
                    </div>
                    <Button onClick={pay} size="lg" className="w-full mt-5">Pay {fmt.euro(total)} &amp; confirm <ArrowRight width={16} height={16} /></Button>
                    <p className="text-[0.7rem] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1"><Shield width={12} height={12} /> Demo checkout — your card is never charged.</p>
                  </Card>
                  <Card className="p-5 h-fit order-1 md:order-2">
                    <div className="kicker mb-3">Your appointment</div>
                    <div className="flex items-center gap-3 mb-4">
                      <DoctorAvatar name={pending.doctorName} photo={doctorPhoto(pending.doctorId)} size={44} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{pending.doctorName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5"><SpecialtyDot specialty={pending.specialty} size={6} /> {SPECIALTY_META[pending.specialty].label}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-sm border-t pt-3">
                      <div className="flex items-center gap-2 text-muted-foreground"><Calendar width={14} height={14} /> {pending.timeLabel}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Building width={14} height={14} /> {pending.clinicName} · {pending.area}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><MapPin width={14} height={14} /> {pending.distanceKm} km away</div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-sm border-t mt-3 pt-3">
                      <div className="flex justify-between"><span className="text-muted-foreground">Consultation</span><span className="tnum">{fmt.euro(fee)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span className="tnum">{fmt.euro(service)}</span></div>
                      <div className="flex justify-between font-semibold border-t pt-1.5 mt-0.5"><span>Total</span><span className="tnum">{fmt.euro(total)}</span></div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            );
          })()}

          {/* CONFIRMED — dedicated confirmation page */}
          {step === "confirmed" && confirmed && (
            <motion.div key="confirmed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-2">
              <div className="text-center mb-6">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="w-16 h-16 rounded-2xl bg-success text-success-foreground flex items-center justify-center mx-auto mb-4">
                  <Check width={34} height={34} />
                </motion.div>
                <h1 className="font-display text-3xl font-bold tracking-tight">Appointment confirmed</h1>
                <p className="text-muted-foreground mt-1.5">{firstName}, you&rsquo;re all set for {confirmed.appt.timeLabel}.</p>
              </div>

              <Card className="relative overflow-hidden">
                <BorderBeam size={180} duration={11} />
                <div className="px-5 py-3.5 border-b flex items-center gap-3 bg-accent/40">
                  <DoctorAvatar name={confirmed.appt.doctorName} photo={doctorPhoto(confirmed.appt.doctorId)} size={44} />
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight truncate">{confirmed.appt.doctorName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5"><SpecialtyDot specialty={confirmed.appt.specialty} size={6} /> {SPECIALTY_META[confirmed.appt.specialty].label}{confirmed.appt.affiliation ? ` · ${confirmed.appt.affiliation}` : ""}</div>
                  </div>
                  {confirmed.appt.isNew && <Badge className="ml-auto bg-brand text-brand-foreground"><Sparkles width={11} height={11} /> Newly created</Badge>}
                </div>
                <div className="p-5 grid sm:grid-cols-2 gap-x-6 gap-y-4">
                  <Detail Icon={Calendar} label="When" value={confirmed.appt.timeLabel} />
                  <Detail Icon={Building} label="Where" value={`${confirmed.appt.clinicName} · ${confirmed.appt.area}`} />
                  <Detail Icon={MapPin} label="Distance" value={`${confirmed.appt.distanceKm} km away`} />
                  <Detail Icon={Clock} label="Duration" value={`${SPECIALTY_META[confirmed.appt.specialty].consultMinutes} min consult`} />
                  <Detail Icon={Sparkles} label="Availability" value="Newly created for you" />
                </div>
                <div className="p-5 pt-0 flex flex-wrap gap-2.5">
                  <Button variant="outline" onClick={() => setCalAdded(true)}>{calAdded ? <><Check width={15} height={15} /> Added</> : <><Calendar width={15} height={15} /> Add to calendar</>}</Button>
                  <Button variant="outline" onClick={() => toggleReminder(confirmed.appt.id)} className={confirmedBooking?.reminder ? "border-brand/40 text-brand" : ""}>
                    <Bell width={15} height={15} /> {confirmedBooking?.reminder ? "Reminder set" : "Set a reminder"}
                  </Button>
                  <Button onClick={() => router.push("/appointments")}>View my appointments <ArrowRight width={15} height={15} /></Button>
                </div>
              </Card>

              <div className="text-center mt-6">
                <Button variant="ghost" onClick={() => { setConfirmed(null); setStep("home"); }}>Done</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="kicker mb-2">{label}</div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={value} />
    </div>
  );
}

function Detail({ Icon, label, value }: { Icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0"><Icon width={15} height={15} /></span>
      <div className="min-w-0"><div className="kicker mb-0.5">{label}</div><div className="text-sm font-medium leading-snug">{value}</div></div>
    </div>
  );
}

function ResultCard({ r, onConfirm }: { r: ApptOption; onConfirm: () => void }) {
  const m = SPECIALTY_META[r.specialty];
  const soonWord = r.inDays <= 0 ? "Today" : r.inDays === 1 ? "Tomorrow" : null;
  const soonChip = r.inDays <= 0 ? "Available today" : r.inDays === 1 ? "Available tomorrow" : `In ${r.inDays} days`;
  const whenBig = r.isNew ? (soonWord ?? r.timeLabel.split("·")[0].trim()) : `${r.inDays}d`;
  const whenSub = r.isNew ? r.timeLabel.split("·")[1]?.trim() : "wait";
  return (
    <Card className={`relative overflow-hidden ${r.isNew ? "border-brand shadow-md" : ""}`}>
      {r.isNew && (
        <>
          <BorderBeam size={120} duration={8} />
          <div className="px-4 py-1.5 flex items-center gap-1.5 bg-brand text-brand-foreground text-xs font-semibold">
            <Sparkles width={12} height={12} /> Newly created capacity
            <span className="ml-auto rounded bg-white/20 px-1.5 py-0.5">{soonChip}</span>
          </div>
        </>
      )}
      <div className="p-4 flex items-center gap-4">
        <div className="text-center shrink-0 w-[80px]">
          <div className="font-display text-base font-bold leading-none" style={{ color: r.isNew ? "hsl(var(--brand))" : "hsl(var(--foreground))" }}>{whenBig}</div>
          <div className="text-[0.64rem] text-muted-foreground mt-0.5">{whenSub}</div>
        </div>
        <div className="w-px self-stretch bg-border" />
        <DoctorAvatar name={r.doctorName} photo={doctorPhoto(r.doctorId)} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-semibold"><Stethoscope width={14} height={14} className="text-muted-foreground" /> {r.doctorName}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Building width={12} height={12} /> {r.clinicName}{r.affiliation ? ` · ${r.affiliation}` : ""}</span>
            <span className="flex items-center gap-1"><MapPin width={12} height={12} /> {r.distanceKm} km · {r.area}</span>
            <span className="flex items-center gap-1"><SpecialtyDot specialty={r.specialty} size={6} /> {m.label}</span>
          </div>
        </div>
        {r.isNew ? (
          <Button size="sm" onClick={onConfirm} className="shrink-0">Confirm</Button>
        ) : (
          <Button size="sm" variant="outline" className="shrink-0" disabled>Book</Button>
        )}
      </div>
    </Card>
  );
}
