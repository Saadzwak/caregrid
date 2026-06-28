"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { PATIENTS, HERO_PATIENT_ID, doctorPhoto } from "./data";
import { buildCapacityPlan } from "./engine";
import { STANDARD_DAYTIME, composedToCalSessions, type CalSession } from "./calendar";
import type { ApptOption, Booking, CapacityPlan, Patient, Specialty } from "./types";

export type ClinicPhase = "idle" | "detecting" | "revealed";
export type CalMode = "week" | "month";
export type SpecialtyFilter = "all" | Specialty;

const FALLBACK_RATIONALE =
  "The clinic's evenings and weekend rooms sit idle. I assembled available specialists — including independent and visiting doctors from other clinics — into the equipped rooms that match their specialty, then packed each day at its natural consult cadence. Travel time for visiting doctors is built in, and the longest-waiting, nearest, low-no-show patients fill the slots first.";

interface StoreValue {
  plan: CapacityPlan;
  patients: Patient[];
  heroPatient: Patient;

  clinicPhase: ClinicPhase;
  agentRationale: string;
  bookedPatientIds: string[];
  lastBookedPatientId: string | null;

  calMode: CalMode;
  setCalMode: (m: CalMode) => void;
  selectedDoctorId: string | null;
  setSelectedDoctorId: (id: string | null) => void;
  specialtyFilter: SpecialtyFilter;
  setSpecialtyFilter: (s: SpecialtyFilter) => void;

  calendarSessions: CalSession[];

  bookings: Booking[];
  lastBookingId: string | null;

  detectOpportunities: () => Promise<void>;
  commitReveal: () => void;
  confirmBooking: (patientId: string) => void;
  addBooking: (appt: ApptOption, daysSooner: number) => void;
  toggleReminder: (id: string) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // The plan is computed once at init — CareGrid's optimization already done for
  // this weekend — so the patient experience works standalone.
  const [plan] = useState<CapacityPlan>(() => buildCapacityPlan(PATIENTS.map((p) => ({ ...p }))));
  const [patients, setPatients] = useState<Patient[]>(() => PATIENTS.map((p) => ({ ...p })));

  const [clinicPhase, setClinicPhase] = useState<ClinicPhase>("idle");
  const [agentRationale, setAgentRationale] = useState<string>(FALLBACK_RATIONALE);
  const [bookedPatientIds, setBookedPatientIds] = useState<string[]>([]);
  const [lastBookedPatientId, setLastBookedPatientId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);

  const [calMode, setCalMode] = useState<CalMode>("week");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyFilter>("all");

  const heroPatient = useMemo(() => patients.find((p) => p.id === HERO_PATIENT_ID)!, [patients]);

  const detectOpportunities = useCallback(async () => {
    setClinicPhase("detecting");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.rationale) setAgentRationale(json.rationale as string);
      }
    } catch {
      setAgentRationale(FALLBACK_RATIONALE);
    }
  }, []);

  const commitReveal = useCallback(() => setClinicPhase("revealed"), []);

  const confirmBooking = useCallback((patientId: string) => {
    setBookedPatientIds((prev) => (prev.includes(patientId) ? prev : [...prev, patientId]));
    setLastBookedPatientId(patientId);
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, status: "confirmed" as const } : p)));
  }, []);

  const addBooking = useCallback((appt: ApptOption, daysSooner: number) => {
    setBookings((prev) => {
      if (prev.some((b) => b.id === appt.id)) return prev;
      const b: Booking = {
        id: appt.id,
        clinicName: appt.clinicName,
        area: appt.area,
        doctorName: appt.doctorName,
        affiliation: appt.affiliation,
        specialty: appt.specialty,
        timeLabel: appt.timeLabel,
        inDays: appt.inDays,
        distanceKm: appt.distanceKm,
        daysSooner,
        isNew: appt.isNew,
        reminder: true,
        photo: doctorPhoto(appt.doctorId),
      };
      return [...prev, b];
    });
    setLastBookingId(appt.id);
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, reminder: !b.reminder } : b)));
  }, []);

  const reset = useCallback(() => {
    setClinicPhase("idle");
    setBookedPatientIds([]);
    setLastBookedPatientId(null);
    setBookings([]);
    setLastBookingId(null);
    setSelectedDoctorId(null);
    setSpecialtyFilter("all");
    setPatients(PATIENTS.map((p) => ({ ...p })));
  }, []);

  const calendarSessions = useMemo(() => {
    const composed = clinicPhase === "revealed" ? composedToCalSessions(plan) : [];
    return [...STANDARD_DAYTIME, ...composed];
  }, [clinicPhase, plan]);

  const value: StoreValue = {
    plan,
    patients,
    heroPatient,
    clinicPhase,
    agentRationale,
    bookedPatientIds,
    lastBookedPatientId,
    calMode,
    setCalMode,
    selectedDoctorId,
    setSelectedDoctorId,
    specialtyFilter,
    setSpecialtyFilter,
    calendarSessions,
    bookings,
    lastBookingId,
    detectOpportunities,
    commitReveal,
    confirmBooking,
    addBooking,
    toggleReminder,
    reset,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
