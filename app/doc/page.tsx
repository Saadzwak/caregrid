"use client";

import { AuthGate } from "@/components/ui/AuthGate";
import { AdminShell } from "@/components/ui/Sidebar";
import { DocApp } from "@/components/doc/DocApp";

export default function DocPage() {
  return (
    <AuthGate>
      <AdminShell>
        <DocApp />
      </AdminShell>
    </AuthGate>
  );
}
