"use client";

import { AuthGate } from "@/components/ui/AuthGate";
import { PatientApp } from "@/components/patient/PatientApp";

export default function AppPage() {
  return (
    <AuthGate>
      <PatientApp />
    </AuthGate>
  );
}
