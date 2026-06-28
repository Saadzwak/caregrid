"use client";

import Link from "next/link";
import { AuthGate } from "@/components/ui/AuthGate";
import { useStore } from "@/lib/store";
import { Brand } from "@/components/ui/Brand";
import { UserMenu } from "@/components/ui/UserMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { Calendar, ChevronLeft, Search } from "@/components/ui/icons";

function Inner() {
  const { bookings, toggleReminder } = useStore();
  const past = [
    { id: "past-1", clinicName: "Cabinet Saint-Marc", area: "3rd arr.", doctorName: "Dr. P. Lemaire", affiliation: null, specialty: "Dermatology" as const, timeLabel: "Mar 12 · 09:00", inDays: 0, distanceKm: 2.1, daysSooner: 0, isNew: false, reminder: false, photo: null },
    { id: "past-2", clinicName: "Pôle République", area: "10th arr.", doctorName: "Dr. C. Wong", affiliation: null, specialty: "General Medicine" as const, timeLabel: "Nov 04 · 14:30", inDays: 0, distanceKm: 1.4, daysSooner: 0, isNew: false, reminder: false, photo: null },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[860px] px-6 h-[60px] flex items-center">
          <Link href="/app"><Brand size={28} /></Link>
          <div className="ml-auto"><UserMenu /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[860px] px-6 py-7 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/app" className="text-sm text-muted-foreground hover:text-brand flex items-center gap-1 mb-1.5"><ChevronLeft width={14} height={14} /> Back</Link>
            <h1 className="font-display text-3xl font-bold tracking-tight">My appointments</h1>
          </div>
          <Button asChild><Link href="/app"><Search width={16} height={16} /> Book</Link></Button>
        </div>

        <div className="kicker mb-2.5">Upcoming</div>
        {bookings.length > 0 ? (
          <div className="flex flex-col gap-3 mb-8">
            {bookings.map((b) => <AppointmentCard key={b.id} b={b} onToggleReminder={toggleReminder} />)}
          </div>
        ) : (
          <Card className="p-8 text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-3"><Calendar width={24} height={24} /></div>
            <div className="font-semibold mb-1">No upcoming appointments</div>
            <p className="text-sm text-muted-foreground mb-4">Find one — CareGrid surfaces brand-new capacity near you.</p>
            <Button asChild><Link href="/app"><Search width={16} height={16} /> Find an appointment</Link></Button>
          </Card>
        )}

        <div className="kicker mb-2.5">Past</div>
        <div className="flex flex-col gap-3">
          {past.map((b) => <AppointmentCard key={b.id} b={b} />)}
        </div>
      </main>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <AuthGate>
      <Inner />
    </AuthGate>
  );
}
