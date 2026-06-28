"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/ui/AuthGate";
import { UserMenu } from "@/components/ui/UserMenu";
import { useAuth, ROLE_HOME, ROLE_META } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { FOCAL_CLINIC, getDoctor, SPECIALTY_META } from "@/lib/data";
import { fmt } from "@/components/ui/AnimatedNumber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, Badge } from "@/components/ui/bits";
import { Brand } from "@/components/ui/Brand";
import { Building, Calendar, Check, Clock, MapPin, Star, Stethoscope, Wallet } from "@/components/ui/icons";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={value} />
    </div>
  );
}

function SaveBar() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex items-center gap-3 justify-end">
      {saved && <span className="text-sm text-success flex items-center gap-1"><Check width={14} height={14} /> Saved</span>}
      <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}>Save changes</Button>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between p-5 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function PatientProfile({ name, email }: { name: string; email: string }) {
  const { lastBookedPatientId, heroPatient } = useStore();
  const upcoming = lastBookedPatientId === heroPatient.id;
  return (
    <>
      <Section title="Personal details" action={<SaveBar />}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={name} />
          <Field label="Email" value={email} />
          <Field label="Location" value="Place de la République, Paris" />
          <Field label="Phone" value="+33 6 12 34 56 78" />
        </div>
      </Section>
      <Section title="Upcoming appointment">
        {upcoming ? (
          <div className="flex items-center gap-3 rounded-lg border border-brand/30 bg-accent/40 p-3.5">
            <span className="w-9 h-9 rounded-lg bg-brand text-brand-foreground flex items-center justify-center"><Calendar width={18} height={18} /></span>
            <div className="flex-1"><div className="font-semibold text-sm">Dermatology · Lumière Health</div><div className="text-xs text-muted-foreground">This Saturday · a session created by CareGrid</div></div>
            <Badge className="bg-success/15 text-success"><Check width={12} height={12} /> Confirmed</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming appointment. <Link href="/app" className="text-brand font-medium hover:underline">Find one →</Link></p>
        )}
      </Section>
      <Section title="Appointment history">
        <div className="divide-y">
          {[{ s: "Dermatology", d: "Mar 2026", c: "Cabinet Saint-Marc" }, { s: "General Medicine", d: "Nov 2025", c: "Pôle République" }].map((h, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium">{h.s}</span>
              <span className="text-muted-foreground">{h.c} · {h.d}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function HostProfile({ name, email }: { name: string; email: string }) {
  return (
    <>
      <Section title="Personal details" action={<SaveBar />}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={name} />
          <Field label="Email" value={email} />
          <Field label="Specialty" value="General Medicine" />
          <Field label="Rating" value="4.8 ★" />
        </div>
      </Section>
      <Section title="My cabinet" action={<SaveBar />}>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Field label="Cabinet name" value="Cabinet Dr. Faure" />
          <Field label="Address" value="14 rue Oberkampf, 11th arr., Paris" />
        </div>
        <Label className="mb-2 block">Equipment available to visiting doctors</Label>
        <div className="flex flex-wrap gap-1.5">
          {["Exam table", "Vitals station", "Dermatoscope", "ECG", "Ultrasound", "Slit lamp"].map((e) => (
            <Badge key={e} className="bg-secondary text-secondary-foreground">{e}</Badge>
          ))}
        </div>
      </Section>
      <Section title="Offered slots (cabinet idle time)">
        <div className="flex flex-wrap gap-1.5">
          {["Mon evening", "Wed evening", "Saturday all day", "Sunday morning"].map((w) => (
            <Badge key={w} className="bg-accent text-accent-foreground"><Clock width={11} height={11} /> {w}</Badge>
          ))}
        </div>
      </Section>
      <Section title="Earnings — renting my cabinet">
        <div className="grid grid-cols-2 gap-4">
          <div><div className="kicker mb-1">This month</div><div className="font-display text-2xl font-bold tnum">{fmt.euro(3240)}</div><div className="text-xs text-success font-medium mt-1">▲ 18% vs last month</div></div>
          <div><div className="kicker mb-1">Sessions hosted</div><div className="font-display text-2xl font-bold tnum">11</div></div>
        </div>
      </Section>
    </>
  );
}

function IntervenantProfile({ name, email }: { name: string; email: string }) {
  const { plan } = useStore();
  const doc = getDoctor("dr-diallo")!;
  const sessions = plan.sessions.filter((s) => s.doctorId === doc.id);
  return (
    <>
      <Section title="Personal details" action={<SaveBar />}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={name} />
          <Field label="Email" value={email} />
          <Field label="Specialty" value={SPECIALTY_META[doc.specialty].label} />
          <Field label="Status" value="Independent practitioner" />
        </div>
      </Section>
      <Section title="My availability" action={<SaveBar />}>
        <div className="flex flex-wrap gap-1.5">
          {["Saturday all day", "Sunday morning", "Wed evening"].map((w) => (
            <Badge key={w} className="bg-accent text-accent-foreground"><Clock width={11} height={11} /> {w}</Badge>
          ))}
        </div>
      </Section>
      <Section title="Accepted sessions">
        <div className="divide-y">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium flex items-center gap-1.5"><Stethoscope width={14} height={14} className="text-muted-foreground" /> {SPECIALTY_META[s.specialty].label}</span>
              <span className="text-muted-foreground">{s.start}–{s.end} · {s.filledCount} patients</span>
            </div>
          ))}
          {!sessions.length && <p className="text-sm text-muted-foreground py-2">No accepted sessions yet.</p>}
        </div>
      </Section>
      <Section title="Earnings via CareGrid">
        <div className="grid grid-cols-2 gap-4">
          <div><div className="kicker mb-1">Total earned</div><div className="font-display text-2xl font-bold tnum">{fmt.euro(doc.revenueViaCareGrid)}</div><div className="text-xs text-success font-medium mt-1">▲ 12% vs last month</div></div>
          <div><div className="kicker mb-1">Sessions</div><div className="font-display text-2xl font-bold tnum">{doc.sessionsViaCareGrid}</div></div>
        </div>
      </Section>
    </>
  );
}

function ProfileInner() {
  const { user } = useAuth();
  if (!user) return null;
  const m = ROLE_META[user.role];
  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[860px] px-6 h-[60px] flex items-center gap-2.5">
          <Link href={ROLE_HOME[user.role]}><Brand size={28} /></Link>
          <div className="ml-auto"><UserMenu /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[860px] px-6 py-7 flex-1 flex flex-col gap-5">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Avatar name={user.name} size={64} hue={user.role === "host" ? 24 : user.role === "intervenant" ? 212 : 320} />
            <div className="flex-1">
              <div className="font-display text-2xl font-bold">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">{m.label}</Badge>
          </CardContent>
        </Card>
        {user.role === "patient" && <PatientProfile name={user.name} email={user.email} />}
        {user.role === "host" && <HostProfile name={user.name} email={user.email} />}
        {user.role === "intervenant" && <IntervenantProfile name={user.name} email={user.email} />}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGate>
      <ProfileInner />
    </AuthGate>
  );
}
