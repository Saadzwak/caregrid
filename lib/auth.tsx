"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type Role = "patient" | "host" | "intervenant";

export interface User {
  email: string;
  name: string;
  role: Role;
}

export const ROLE_HOME: Record<Role, string> = {
  patient: "/app",
  host: "/clinic",
  intervenant: "/doc",
};

export const ROLE_META: Record<Role, { label: string; blurb: string }> = {
  patient: { label: "Patient", blurb: "Find care sooner, near you" },
  host: { label: "Host doctor", blurb: "Offer your cabinet · orchestrate capacity" },
  intervenant: { label: "Visiting doctor", blurb: "Accept turnkey sessions" },
};

function nameFromEmail(email: string, role: Role): string {
  // Demo-friendly representative names per role.
  if (role === "host") return "Dr. Hélène Faure";
  if (role === "intervenant") return "Dr. Amara Diallo";
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Patient";
  return local.replace(/\b\w/g, (c) => c.toUpperCase()) || "Patient";
}

interface AuthValue {
  user: User | null;
  login: (email: string, role: Role, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const login = useCallback((email: string, role: Role, name?: string) => {
    setUser({ email, role, name: name?.trim() || nameFromEmail(email, role) });
  }, []);
  const logout = useCallback(() => setUser(null), []);
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
