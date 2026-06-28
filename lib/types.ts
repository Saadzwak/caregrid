// CareGrid domain model.

export type Specialty =
  | "Dermatology"
  | "Cardiology"
  | "General Medicine"
  | "Ophthalmology"
  | "Gynecology"
  | "Radiology"
  | "Endocrinology";

export type Urgency = "routine" | "soon" | "urgent";
export type PatientStatus = "waiting" | "matched" | "confirmed";

/** How a doctor relates to the clinic they're being matched into. */
export type Affiliation = "resident" | "visiting" | "independent";

export interface Availability {
  dayIndex: number; // 0=Mon .. 6=Sun
  start: string; // "18:00"
  end: string; // "21:00"
}

export interface Doctor {
  id: string;
  name: string;
  credential: string;
  specialty: Specialty;
  affiliation: Affiliation;
  /** Home clinic for resident/visiting; null for independent. */
  homeClinicId: string | null;
  rating: number;
  availabilities: Availability[];
  hue: number;
  sessionsViaCareGrid: number;
  revenueViaCareGrid: number;
}

export interface Room {
  id: string;
  clinicId: string;
  name: string;
  kind: string;
  equipmentPresent: string[];
  equipmentMissing: string[];
}

export interface Clinic {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  specialty: Specialty;
  reason: string;
  urgency: Urgency;
  waitDays: number;
  /** Days until their existing next appointment (the status quo). */
  currentNextSlotDays: number;
  lat: number;
  lng: number;
  area: string;
  noShowRisk: number;
  estValue: number;
  /** Equipment this specific case requires (e.g. a dermatoscope procedure). */
  requiresEquipment: string | null;
  status: PatientStatus;
}

export interface SpecialtyMeta {
  label: string;
  short: string;
  color: string;
  soft: string;
  consultMinutes: number;
  requiredEquipment: string[];
}

/* ------------------------------------------------------------------ */
/* Engine output                                                       */
/* ------------------------------------------------------------------ */

export type SlotKind = "consult" | "procedure" | "break" | "travel";

export interface SlotAssignment {
  time: string;
  endTime: string;
  patientId: string | null;
  kind: SlotKind;
  label?: string;
}

export interface ComposedSession {
  id: string;
  clinicId: string;
  roomId: string;
  doctorId: string;
  specialty: Specialty;
  affiliation: Affiliation;
  dayIndex: number;
  start: string;
  end: string;
  consultMinutes: number;
  slots: SlotAssignment[];
  patientIds: string[];
  filledCount: number;
  capacity: number;
  travelMinutes: number;
  travelFromClinicId: string | null;
  estRevenue: number;
  utilization: number;
  justification: string;
}

export interface CapacityPlan {
  focalClinicId: string;
  sessions: ComposedSession[];
  totalPatients: number;
  totalSlots: number;
  totalRevenue: number;
  avgUtilization: number;
  doctorsAssembled: number;
  assembledVisiting: number;
  assembledIndependent: number;
  /** Source of the plan — internal only, never shown in the UI. */
  source: "agent" | "fallback";
}

/** A confirmed booking held in the patient's in-memory account. */
export interface Booking {
  id: string;
  clinicName: string;
  area: string;
  doctorName: string;
  affiliation: Affiliation | null;
  specialty: Specialty;
  timeLabel: string;
  inDays: number;
  distanceKm: number;
  daysSooner: number;
  isNew: boolean;
  reminder: boolean;
  photo: string | null;
}

/** A bookable result surfaced to a patient. */
export interface ApptOption {
  id: string;
  clinicId: string;
  clinicName: string;
  area: string;
  doctorId: string;
  doctorName: string;
  affiliation: Affiliation | null;
  specialty: Specialty;
  dayIndex: number | null;
  timeLabel: string; // "Sat 29 · 10:30"
  inDays: number;
  distanceKm: number;
  isNew: boolean; // created by CareGrid optimization
  sessionId: string | null;
  patientId: string | null; // the slot's reserved patient (hero) when applicable
  evening: boolean;
  weekend: boolean;
}
