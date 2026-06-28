"use client";

import { AuthGate } from "@/components/ui/AuthGate";
import { AdminShell } from "@/components/ui/Sidebar";
import { ClinicAdmin } from "@/components/clinic/ClinicAdmin";

export default function ClinicPage() {
  return (
    <AuthGate>
      <AdminShell>
        <ClinicAdmin />
      </AdminShell>
    </AuthGate>
  );
}
