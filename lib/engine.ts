// CareGrid optimization engine — greedy, deterministic, scoped to the focal clinic.
// Fills idle evening/weekend room-windows by assembling the best available doctor
// (resident / visiting / independent) for a specialty the room's equipment supports,
// then packs the day slot-by-slot with the best-matched waitlist patients.

import type {
  ApptOption,
  CapacityPlan,
  ComposedSession,
  Patient,
  SlotAssignment,
  Specialty,
} from "./types";
import {
  ALL_SPECIALTIES,
  CLINICS,
  DOCTORS,
  FOCAL_CLINIC,
  FOCAL_CLINIC_ID,
  FREE_WINDOWS,
  HERO_PATIENT_ID,
  ROOMS,
  SPECIALTY_META,
  getClinic,
  getDoctor,
  getRoom,
  haversineKm,
  minToTime,
  roomCanHost,
  toMin,
} from "./data";
import { WEEK_DAYS, inDaysFromToday } from "./calendar";

const MIN_SESSION_MIN = 120;

const ROOM_PRIORITY: Record<string, Specialty[]> = {
  "lum-r3": ["Dermatology"],
  "lum-r4": ["Cardiology"],
  "lum-r6": ["Ophthalmology"],
  "lum-r5": ["Gynecology", "Radiology"], // Radiology excluded — room lacks MRI/CT
  "lum-r1": ["General Medicine"],
  "lum-r2": ["Endocrinology", "General Medicine"],
};

const affRank = (a: string) => (a === "independent" ? 0 : a === "visiting" ? 1 : 2);

function buildSlots(startMin: number, endMin: number, consultMin: number, travelMin: number) {
  const slots: { kind: "consult" | "break" | "travel"; start: number; end: number }[] = [];
  let t = startMin;
  if (travelMin > 0) {
    slots.push({ kind: "travel", start: t, end: t + travelMin });
    t += travelMin;
  }
  const breaks: [number, number][] = [];
  if (startMin <= 750 && endMin >= 810) breaks.push([750, 810]); // 12:30–13:30 lunch
  let nb = t + 150;
  while (nb < endMin - 60) {
    if (!(nb >= 750 && nb < 810)) breaks.push([nb, nb + 10]);
    nb += 160;
  }
  breaks.sort((a, b) => a[0] - b[0]);
  let bi = 0;
  while (t + consultMin <= endMin) {
    if (bi < breaks.length && t + consultMin > breaks[bi][0] && t < breaks[bi][1]) {
      slots.push({ kind: "break", start: breaks[bi][0], end: breaks[bi][1] });
      t = breaks[bi][1];
      bi++;
      continue;
    }
    slots.push({ kind: "consult", start: t, end: t + consultMin });
    t += consultMin;
  }
  return slots;
}

function scorePatient(p: Patient, focalLat: number, focalLng: number): number {
  const urgency = p.urgency === "urgent" ? 3 : p.urgency === "soon" ? 2 : 1;
  const dist = haversineKm(p.lat, p.lng, focalLat, focalLng);
  return urgency * 10 + Math.min(p.waitDays, 90) / 3 - p.noShowRisk * 8 - dist * 0.8;
}

export function buildCapacityPlan(
  patients: Patient[],
  opts?: { source?: "agent" | "fallback" }
): CapacityPlan {
  const assigned = new Set<string>();
  const usedDoctorDay = new Set<string>();
  const sessions: ComposedSession[] = [];
  let firstDermDone = false;

  for (const win of FREE_WINDOWS) {
    for (const room of ROOMS) {
      const specs = (ROOM_PRIORITY[room.id] ?? []).filter((s) => roomCanHost(room, s));
      for (const spec of specs) {
        // available doctors for this specialty overlapping the window for >= MIN_SESSION_MIN
        const cands = DOCTORS.filter((d) => d.specialty === spec)
          .map((d) => {
            const av = d.availabilities.find((a) => a.dayIndex === win.dayIndex);
            if (!av) return null;
            const start = Math.max(toMin(av.start), toMin(win.start));
            const end = Math.min(toMin(av.end), toMin(win.end));
            if (end - start < MIN_SESSION_MIN) return null;
            if (usedDoctorDay.has(`${d.id}-${win.dayIndex}`)) return null;
            return { d, start, end };
          })
          .filter((x): x is { d: (typeof DOCTORS)[number]; start: number; end: number } => !!x)
          .sort((a, b) => affRank(a.d.affiliation) - affRank(b.d.affiliation) || b.d.rating - a.d.rating);

        if (!cands.length) continue;
        const { d, start, end } = cands[0];

        const travel = d.affiliation === "resident" && d.homeClinicId === FOCAL_CLINIC_ID ? 0 : 15;
        const consultMin = SPECIALTY_META[spec].consultMinutes;
        const rawSlots = buildSlots(start, end, consultMin, travel);
        const consultSlots = rawSlots.filter((s) => s.kind === "consult");

        // eligible patients
        let pool = patients
          .filter(
            (p) =>
              p.status === "waiting" &&
              !assigned.has(p.id) &&
              p.specialty === spec &&
              (!p.requiresEquipment || room.equipmentPresent.includes(p.requiresEquipment))
          )
          .sort((a, b) => scorePatient(b, FOCAL_CLINIC.lat, FOCAL_CLINIC.lng) - scorePatient(a, FOCAL_CLINIC.lat, FOCAL_CLINIC.lng));

        // guarantee the hero lands in the first dermatology session (demo coherence)
        if (spec === "Dermatology" && !firstDermDone) {
          const hi = pool.findIndex((p) => p.id === HERO_PATIENT_ID);
          if (hi > 0) pool.unshift(pool.splice(hi, 1)[0]);
          firstDermDone = true;
        }

        const chosen = pool.slice(0, consultSlots.length);
        if (chosen.length < Math.min(4, consultSlots.length)) continue; // not worth opening

        chosen.forEach((p) => assigned.add(p.id));
        usedDoctorDay.add(`${d.id}-${win.dayIndex}`);

        let ci = 0;
        const slots: SlotAssignment[] = rawSlots.map((s) => {
          if (s.kind === "consult") {
            const p = chosen[ci++];
            return { time: minToTime(s.start), endTime: minToTime(s.end), patientId: p ? p.id : null, kind: "consult" };
          }
          return {
            time: minToTime(s.start),
            endTime: minToTime(s.end),
            patientId: null,
            kind: s.kind,
            label: s.kind === "travel" ? "Travel / setup" : "Break",
          };
        });

        const estRevenue = Math.round(chosen.reduce((sum, p) => sum + p.estValue, 0));
        sessions.push({
          id: `${room.id}-d${win.dayIndex}`,
          clinicId: FOCAL_CLINIC_ID,
          roomId: room.id,
          doctorId: d.id,
          specialty: spec,
          affiliation: d.affiliation,
          dayIndex: win.dayIndex,
          start: minToTime(start),
          end: minToTime(end),
          consultMinutes: consultMin,
          slots,
          patientIds: chosen.map((p) => p.id),
          filledCount: chosen.length,
          capacity: consultSlots.length,
          travelMinutes: travel,
          travelFromClinicId: travel > 0 ? d.homeClinicId : null,
          estRevenue,
          utilization: consultSlots.length ? chosen.length / consultSlots.length : 0,
          justification: buildJustification(d, room, spec, chosen.length, travel),
        });
        break; // room filled for this window
      }
    }
  }

  const docIds = new Set(sessions.map((s) => s.doctorId));
  const totalPatients = sessions.reduce((s, x) => s + x.filledCount, 0);
  const totalSlots = sessions.reduce((s, x) => s + x.capacity, 0);
  return {
    focalClinicId: FOCAL_CLINIC_ID,
    sessions,
    totalPatients,
    totalSlots,
    totalRevenue: sessions.reduce((s, x) => s + x.estRevenue, 0),
    avgUtilization: totalSlots ? totalPatients / totalSlots : 0,
    doctorsAssembled: docIds.size,
    assembledVisiting: [...docIds].filter((id) => getDoctor(id)?.affiliation === "visiting").length,
    assembledIndependent: [...docIds].filter((id) => getDoctor(id)?.affiliation === "independent").length,
    source: opts?.source ?? "fallback",
  };
}

function buildJustification(
  d: (typeof DOCTORS)[number],
  room: { name: string },
  spec: Specialty,
  count: number,
  travel: number
): string {
  const origin =
    d.affiliation === "independent"
      ? "independent specialist"
      : d.affiliation === "visiting"
      ? `visiting from ${getClinic(d.homeClinicId ?? "")?.name ?? "another clinic"}`
      : "resident";
  const t = travel > 0 ? ` (+${travel} min travel)` : "";
  return `${d.name} — ${origin}${t} — fills ${room.name} with ${count} ${SPECIALTY_META[spec].label.toLowerCase()} patients from the waitlist.`;
}

/* ------------------------------------------------------------------ */
/* Patient search                                                      */
/* ------------------------------------------------------------------ */

const EXISTING_DAYS: Record<string, number> = {
  saintmarc: 38,
  bastille: 51,
  republique: 44,
  nation: 33,
  opera: 47,
  montparnasse: 29,
  belleville: 41,
};
const EXISTING_DOCTOR: Record<string, string> = {
  saintmarc: "Dr. P. Lemaire",
  bastille: "Dr. N. Aziz",
  republique: "Dr. C. Wong",
  nation: "Dr. R. Faivre",
  opera: "Dr. S. Brandt",
  montparnasse: "Dr. M. Olsen",
  belleville: "Dr. F. Costa",
};

export interface SearchOpts {
  maxKm?: number;
  preferEveningWeekend?: boolean;
}

export function searchAppointments(
  specialty: Specialty,
  origin: { lat: number; lng: number },
  plan: CapacityPlan,
  searchPatientId: string | null,
  opts: SearchOpts = {}
): ApptOption[] {
  const out: ApptOption[] = [];

  // Newly-created capacity from the plan (focal clinic), earliest first.
  const planSessions = plan.sessions
    .filter((s) => s.specialty === specialty)
    .sort((a, b) => inDaysFromToday(a.dayIndex) - inDaysFromToday(b.dayIndex) || toMin(a.start) - toMin(b.start));

  planSessions.slice(0, 2).forEach((s) => {
    const doc = getDoctor(s.doctorId)!;
    const day = WEEK_DAYS[s.dayIndex];
    // a representative slot time — the searching patient's reserved slot if present
    let slot = s.slots.find((x) => x.kind === "consult" && x.patientId === searchPatientId);
    if (!slot) slot = s.slots.find((x) => x.kind === "consult" && x.patientId);
    out.push({
      id: `new-${s.id}`,
      clinicId: FOCAL_CLINIC_ID,
      clinicName: FOCAL_CLINIC.name,
      area: FOCAL_CLINIC.area,
      doctorId: doc.id,
      doctorName: doc.name,
      affiliation: doc.affiliation,
      specialty,
      dayIndex: s.dayIndex,
      timeLabel: `${day.short} ${day.date} · ${slot ? slot.time : s.start}`,
      inDays: inDaysFromToday(s.dayIndex),
      distanceKm: haversineKm(origin.lat, origin.lng, FOCAL_CLINIC.lat, FOCAL_CLINIC.lng),
      isNew: true,
      sessionId: s.id,
      patientId: searchPatientId,
      evening: toMin(s.start) >= 17 * 60,
      weekend: s.dayIndex >= 5,
    });
  });

  // Existing status-quo slots at other clinics.
  CLINICS.filter((c) => c.id !== FOCAL_CLINIC_ID).forEach((c) => {
    const inDays = EXISTING_DAYS[c.id] ?? 45;
    out.push({
      id: `exist-${c.id}`,
      clinicId: c.id,
      clinicName: c.name,
      area: c.area,
      doctorId: "",
      doctorName: EXISTING_DOCTOR[c.id] ?? "Available doctor",
      affiliation: null,
      specialty,
      dayIndex: null,
      timeLabel: `In ${inDays} days`,
      inDays,
      distanceKm: haversineKm(origin.lat, origin.lng, c.lat, c.lng),
      isNew: false,
      sessionId: null,
      patientId: null,
      evening: false,
      weekend: false,
    });
  });

  let results = out;
  if (opts.maxKm) results = results.filter((r) => r.distanceKm <= opts.maxKm!);
  return results.sort((a, b) => {
    if (opts.preferEveningWeekend && a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    return a.inDays - b.inDays || a.distanceKm - b.distanceKm;
  });
}
