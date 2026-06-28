// Calendar display model for the clinic admin view.

import type { CapacityPlan, ComposedSession, Specialty } from "./types";
import { ROOMS, DOCTORS, SPECIALTY_META } from "./data";

export interface WeekDay {
  index: number;
  short: string;
  long: string;
  date: number;
  closed?: boolean;
}

export const MONTH_LABEL = "June 2026";
export const WEEK_LABEL = "Week of June 24 – 30";
export const WEEK_DAYS: WeekDay[] = [
  { index: 0, short: "Mon", long: "Monday", date: 24 },
  { index: 1, short: "Tue", long: "Tuesday", date: 25 },
  { index: 2, short: "Wed", long: "Wednesday", date: 26 },
  { index: 3, short: "Thu", long: "Thursday", date: 27 },
  { index: 4, short: "Fri", long: "Friday", date: 28 },
  { index: 5, short: "Sat", long: "Saturday", date: 29 },
  { index: 6, short: "Sun", long: "Sunday", date: 30 },
];

export const TODAY_INDEX = 2; // Wednesday, June 26
export const SATURDAY_INDEX = 5;
export const WORK_START = 8;
export const WORK_END = 21; // show evenings (the unused capacity)

export function toHour(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

export function inDaysFromToday(dayIndex: number): number {
  return (dayIndex - TODAY_INDEX + 7) % 7;
}

export interface CalSession {
  id: string;
  dayIndex: number;
  start: string;
  end: string;
  roomId: string;
  doctorId: string;
  specialty: Specialty;
  title: string;
  booked: number;
  capacity: number;
  origin: "standard" | "composed";
  sessionId?: string;
}

// Existing weekday-daytime schedule for the focal clinic (busy context). Evenings
// and weekends are intentionally empty — that's the capacity CareGrid fills.
const DAY_PATTERN: Record<string, ("FULL" | "AM" | "PM" | "OFF")[]> = {
  "lum-r1": ["FULL", "AM", "PM", "PM", "FULL"],
  "lum-r2": ["AM", "FULL", "AM", "FULL", "OFF"],
  "lum-r3": ["PM", "FULL", "OFF", "AM", "PM"],
  "lum-r4": ["FULL", "FULL", "PM", "FULL", "AM"],
  "lum-r5": ["AM", "OFF", "FULL", "AM", "FULL"],
  "lum-r6": ["FULL", "PM", "AM", "FULL", "PM"],
};
const ROOM_DEFAULT_SPEC: Record<string, Specialty> = {
  "lum-r1": "General Medicine",
  "lum-r2": "Endocrinology",
  "lum-r3": "Dermatology",
  "lum-r4": "Cardiology",
  "lum-r5": "Gynecology",
  "lum-r6": "Ophthalmology",
};
function span(seg: string): { start: string; end: string } | null {
  if (seg === "AM") return { start: "08:00", end: "12:00" };
  if (seg === "PM") return { start: "13:00", end: "17:00" };
  if (seg === "FULL") return { start: "08:00", end: "17:00" };
  return null;
}

export const STANDARD_DAYTIME: CalSession[] = (() => {
  const out: CalSession[] = [];
  ROOMS.forEach((room) => {
    const pat = DAY_PATTERN[room.id];
    const spec = ROOM_DEFAULT_SPEC[room.id];
    // assign a plausible resident-ish doctor of that specialty for display
    const doc = DOCTORS.find((d) => d.specialty === spec) ?? DOCTORS[0];
    pat.forEach((seg, dayIndex) => {
      const s = span(seg);
      if (!s) return;
      const hours = seg === "FULL" ? 8 : 4;
      const cap = Math.round((hours * 60) / SPECIALTY_META[spec].consultMinutes);
      out.push({
        id: `std-${room.id}-${dayIndex}`,
        dayIndex,
        start: s.start,
        end: s.end,
        roomId: room.id,
        doctorId: doc.id,
        specialty: spec,
        title: `${SPECIALTY_META[spec].short} clinic`,
        booked: Math.round(cap * 0.82),
        capacity: cap,
        origin: "standard",
      });
    });
  });
  return out;
})();

export function composedToCalSessions(plan: CapacityPlan | null): CalSession[] {
  if (!plan) return [];
  return plan.sessions.map((s: ComposedSession) => ({
    id: `cmp-${s.id}`,
    dayIndex: s.dayIndex,
    start: s.start,
    end: s.end,
    roomId: s.roomId,
    doctorId: s.doctorId,
    specialty: s.specialty,
    title: `${SPECIALTY_META[s.specialty].short} session`,
    booked: s.filledCount,
    capacity: s.capacity,
    origin: "composed",
    sessionId: s.id,
  }));
}

export function sessionsForDay(sessions: CalSession[], dayIndex: number): CalSession[] {
  return sessions.filter((s) => s.dayIndex === dayIndex).sort((a, b) => toHour(a.start) - toHour(b.start));
}
export function sessionsForDoctor(sessions: CalSession[], doctorId: string): CalSession[] {
  return sessions.filter((s) => s.doctorId === doctorId);
}
