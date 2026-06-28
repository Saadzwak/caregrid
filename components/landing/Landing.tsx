"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import { DoctorAvatar } from "@/components/ui/bits";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { ArrowRight, Building, Calendar, Check, MapPin, Sparkles, Stethoscope, Users } from "@/components/ui/icons";

const STEPS = [
  { Icon: Building, title: "A doctor offers their cabinet", text: "Independent doctors lend their equipped cabinet during the evenings and weekends it sits empty." },
  { Icon: Stethoscope, title: "A specialist steps in", text: "An available visiting doctor is matched to the cabinet — travel and equipment accounted for." },
  { Icon: Calendar, title: "A patient is seen sooner", text: "Waiting patients get matched into the new session — often days away, close to home." },
];

const STATS = [
  { value: "202", label: "appointments created in one weekend" },
  { value: "12", label: "doctors assembled across the city" },
  { value: "+€34k", label: "of idle capacity put to work" },
];

const SIDES = [
  {
    Icon: Users,
    tag: "For patients",
    title: "Care in days, not months",
    points: ["Brand-new sessions surfaced near you", "Sorted by soonest — book in two taps", "Reminders so you never miss it"],
  },
  {
    Icon: Building,
    tag: "For host doctors",
    title: "Your empty cabinet, earning",
    points: ["Offer the evenings & weekends it sits idle", "Equipment matched automatically", "Passive revenue, zero admin"],
  },
  {
    Icon: Stethoscope,
    tag: "For visiting specialists",
    title: "Fill your open hours",
    points: ["Get matched to ready-to-use cabinets", "Travel & equipment accounted for", "More patients, less downtime"],
  },
];

function CapacityScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p1 = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const p2 = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const p3 = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const p4 = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const p5 = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);
  return (
    <section ref={ref} className="relative h-[230vh] w-full bg-neutral-950 overflow-clip pt-40">
      <GoogleGeminiEffect
        pathLengths={[p1, p2, p3, p4, p5]}
        title="Capacity, drawn into being."
        description="Each line is a session that didn't exist yesterday — an idle cabinet, an available doctor and a waiting patient, assembled the moment they line up."
        cta={
          <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg">
            Find care sooner <ArrowRight width={15} height={15} />
          </Link>
        }
      />
    </section>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1120px] px-6 h-[64px] flex items-center justify-between">
          <Brand size={28} />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
            <Button asChild size="sm"><Link href="/login">Get started <ArrowRight width={15} height={15} /></Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-[1120px] px-6 pt-20 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" /> The capacity layer for healthcare
            </div>
            <h1 className="font-display text-[3rem] md:text-[4.2rem] font-bold leading-[1.02] tracking-tight max-w-[840px] mx-auto">
              Stop waiting weeks<br />for care.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-[600px] mx-auto leading-relaxed">
              CareGrid creates appointments that didn&rsquo;t exist — assembling idle cabinets, available doctors and waiting patients into brand-new sessions.
            </p>
            <div className="flex items-center justify-center gap-3 mt-9">
              <Button asChild size="lg"><Link href="/login">Get started <ArrowRight width={17} height={17} /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/login">I&rsquo;m a doctor</Link></Button>
            </div>
          </motion.div>

          {/* Product preview */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mt-16 max-w-[560px] mx-auto">
            <Card className="relative overflow-hidden text-left shadow-md">
              <BorderBeam size={180} duration={11} />
              <div className="px-4 py-1.5 flex items-center gap-1.5 bg-brand text-brand-foreground text-xs font-semibold">
                <Sparkles width={12} height={12} /> Newly created capacity
                <span className="ml-auto rounded bg-white/20 px-1.5 py-0.5">In 2 days</span>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="text-center shrink-0 w-[72px]">
                  <div className="font-display text-base font-bold leading-none text-brand">This Sat</div>
                  <div className="text-[0.64rem] text-muted-foreground mt-0.5">10:30</div>
                </div>
                <div className="w-px self-stretch bg-border" />
                <DoctorAvatar name="Dr. Amara Diallo" photo="/doctors/dr-diallo.jpg" size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-semibold"><Stethoscope width={14} height={14} className="text-muted-foreground" /> Dr. Amara Diallo</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Building width={12} height={12} /> Cabinet Diallo · independent</span>
                    <span className="flex items-center gap-1"><MapPin width={12} height={12} /> 1.6 km · 11th arr.</span>
                  </div>
                </div>
                <span className="rounded-lg bg-success/15 text-success px-2.5 py-1 text-xs font-semibold flex items-center gap-1"><Check width={13} height={13} /> Booked</span>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Capacity scroll story (Gemini effect) */}
        <CapacityScroll />

        {/* How it works */}
        <section className="border-t bg-card/40">
          <div className="mx-auto max-w-[1120px] px-6 py-16">
            <div className="text-center mb-10">
              <div className="kicker mb-2">How it works</div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Capacity that didn&rsquo;t exist, assembled by AI.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {STEPS.map((s, i) => (
                <motion.div key={s.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card className="p-6 h-full">
                    <div className="w-11 h-11 rounded-xl bg-secondary text-brand flex items-center justify-center mb-4"><s.Icon width={22} height={22} /></div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Step {i + 1}</div>
                    <div className="font-semibold text-lg mb-1.5">{s.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Three sides */}
        <section className="border-t">
          <div className="mx-auto max-w-[1120px] px-6 py-16">
            <div className="text-center mb-10">
              <div className="kicker mb-2">One network, three wins</div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Built for every side of the visit.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {SIDES.map((s, i) => (
                <motion.div key={s.tag} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><s.Icon width={20} height={20} /></div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand">{s.tag}</span>
                    </div>
                    <div className="font-semibold text-lg mb-3">{s.title}</div>
                    <ul className="flex flex-col gap-2 mt-auto">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check width={16} height={16} className="text-brand shrink-0 mt-0.5" /> {p}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t bg-card/40">
          <div className="mx-auto max-w-[1120px] px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="font-display text-4xl font-bold tracking-tight tnum text-brand">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1.5 max-w-[200px] mx-auto">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section className="border-t">
          <div className="mx-auto max-w-[820px] px-6 py-20 text-center">
            <div className="font-display text-2xl md:text-[2rem] font-semibold tracking-tight leading-snug">
              &ldquo;A cabinet sitting empty on a Saturday is a patient waiting two months. CareGrid closes that gap.&rdquo;
            </div>
            <div className="flex items-center justify-center gap-3 mt-7">
              <DoctorAvatar name="Dr. Hélène Faure" photo="/doctors/dr-ricci.jpg" size={40} />
              <div className="text-left">
                <div className="font-semibold text-sm">Dr. Hélène Faure</div>
                <div className="text-xs text-muted-foreground">Host physician · 11th arr.</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-card/40">
          <div className="mx-auto max-w-[1120px] px-6 py-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight max-w-[620px] mx-auto">Find care sooner — or put your cabinet to work.</h2>
            <div className="flex items-center justify-center gap-3 mt-7">
              <Button asChild size="lg"><Link href="/login">Get started <ArrowRight width={17} height={17} /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/login">I&rsquo;m a doctor</Link></Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-[1120px] px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Brand size={24} />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Patients</Link>
            <Link href="/login" className="hover:text-foreground">Doctors</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 CareGrid</div>
        </div>
      </footer>
    </div>
  );
}
