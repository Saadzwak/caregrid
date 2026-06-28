// Rich, fully deterministic dataset for CareGrid (fixed seed; no Date.now/random
// at render). Doctors are independent entities with their own availabilities and
// can be matched into clinics that are not their own.

import type {
  Availability,
  Clinic,
  Doctor,
  Patient,
  Room,
  Specialty,
  SpecialtyMeta,
  Urgency,
} from "./types";

/* ------------------------------------------------------------------ */
/* PRNG                                                                */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = 20260629;
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function range(rng: () => number, min: number, max: number, decimals = 0): number {
  const v = min + rng() * (max - min);
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

/* ------------------------------------------------------------------ */
/* Specialties                                                         */
/* ------------------------------------------------------------------ */
export const SPECIALTY_META: Record<Specialty, SpecialtyMeta> = {
  Dermatology: { label: "Dermatology", short: "Derm", color: "#1668e3", soft: "#e3edfd", consultMinutes: 15, requiredEquipment: ["Dermatoscope"] },
  Cardiology: { label: "Cardiology", short: "Cardio", color: "#e0533a", soft: "#fbe4df", consultMinutes: 30, requiredEquipment: ["ECG"] },
  "General Medicine": { label: "General Medicine", short: "General", color: "#119b6e", soft: "#d9f3ea", consultMinutes: 20, requiredEquipment: [] },
  Ophthalmology: { label: "Ophthalmology", short: "Ophthal", color: "#0ea5b8", soft: "#d6f1f4", consultMinutes: 20, requiredEquipment: ["Slit lamp"] },
  Gynecology: { label: "Gynecology", short: "Gyn", color: "#b5468f", soft: "#f6e1ef", consultMinutes: 25, requiredEquipment: ["Ultrasound"] },
  Radiology: { label: "Radiology", short: "Imaging", color: "#e09017", soft: "#fbeccf", consultMinutes: 35, requiredEquipment: ["MRI"] },
  Endocrinology: { label: "Endocrinology", short: "Endo", color: "#7c5cf0", soft: "#e8e3fd", consultMinutes: 25, requiredEquipment: [] },
};

export const ALL_SPECIALTIES: Specialty[] = [
  "Dermatology", "Cardiology", "General Medicine", "Ophthalmology", "Gynecology", "Radiology", "Endocrinology",
];

const VALUE_RANGE: Record<Specialty, [number, number]> = {
  Dermatology: [90, 320],
  Cardiology: [140, 320],
  "General Medicine": [60, 110],
  Ophthalmology: [90, 180],
  Gynecology: [100, 220],
  Radiology: [150, 400],
  Endocrinology: [110, 220],
};

/* ------------------------------------------------------------------ */
/* Clinics & rooms                                                     */
/* ------------------------------------------------------------------ */
export const FOCAL_CLINIC_ID = "lumiere";

export const CLINICS: Clinic[] = [
  { id: "lumiere", name: "Lumière Health", area: "11th arr.", lat: 48.857, lng: 2.378 },
  { id: "saintmarc", name: "Clinique Saint-Marc", area: "3rd arr.", lat: 48.863, lng: 2.362 },
  { id: "bastille", name: "Centre Médical Bastille", area: "12th arr.", lat: 48.853, lng: 2.369 },
  { id: "republique", name: "Pôle Santé République", area: "10th arr.", lat: 48.867, lng: 2.363 },
  { id: "nation", name: "Clinique Nation", area: "12th arr.", lat: 48.848, lng: 2.396 },
  { id: "opera", name: "Clinique Opéra", area: "9th arr.", lat: 48.871, lng: 2.332 },
  { id: "montparnasse", name: "Centre Montparnasse", area: "14th arr.", lat: 48.84, lng: 2.323 },
  { id: "belleville", name: "Pôle Belleville", area: "20th arr.", lat: 48.872, lng: 2.383 },
];

// Focal clinic rooms — varied equipment (note Radiology cannot be hosted: no MRI/CT).
export const ROOMS: Room[] = [
  { id: "lum-r1", clinicId: "lumiere", name: "Consultation A", kind: "Consultation", equipmentPresent: ["Exam table", "Vitals station"], equipmentMissing: [] },
  { id: "lum-r2", clinicId: "lumiere", name: "Consultation B", kind: "Consultation", equipmentPresent: ["Exam table", "Vitals station"], equipmentMissing: [] },
  { id: "lum-r3", clinicId: "lumiere", name: "Dermatology Suite", kind: "Procedure", equipmentPresent: ["Dermatoscope", "Cryotherapy unit", "Excision kit"], equipmentMissing: [] },
  { id: "lum-r4", clinicId: "lumiere", name: "Cardiology Lab", kind: "Procedure", equipmentPresent: ["ECG", "Echocardiograph"], equipmentMissing: ["Stress test"] },
  { id: "lum-r5", clinicId: "lumiere", name: "Imaging Room", kind: "Imaging", equipmentPresent: ["Ultrasound"], equipmentMissing: ["MRI", "CT scanner"] },
  { id: "lum-r6", clinicId: "lumiere", name: "Ophthalmology Room", kind: "Consultation", equipmentPresent: ["Slit lamp", "OCT"], equipmentMissing: [] },
];

export function roomCanHost(room: Room, specialty: Specialty): boolean {
  const req = SPECIALTY_META[specialty].requiredEquipment;
  return req.every((e) => room.equipmentPresent.includes(e));
}

/* ------------------------------------------------------------------ */
/* Doctors — independent entities                                      */
/* ------------------------------------------------------------------ */
const EVE = (d: number): Availability => ({ dayIndex: d, start: "18:00", end: "21:00" });
const SAT_FULL: Availability = { dayIndex: 5, start: "09:00", end: "18:00" };
const SAT_AM: Availability = { dayIndex: 5, start: "09:00", end: "13:00" };
const SAT_PM: Availability = { dayIndex: 5, start: "13:00", end: "18:00" };
const SUN_AM: Availability = { dayIndex: 6, start: "09:00", end: "13:00" };

export const DOCTORS: Doctor[] = [
  { id: "dr-diallo", name: "Dr. Amara Diallo", credential: "MD, Dermatology", specialty: "Dermatology", affiliation: "independent", homeClinicId: null, rating: 4.9, availabilities: [SAT_FULL, SUN_AM, EVE(2)], hue: 212, sessionsViaCareGrid: 14, revenueViaCareGrid: 48200 },
  { id: "dr-haddad", name: "Dr. Omar Haddad", credential: "MD, Dermatologic Surgery", specialty: "Dermatology", affiliation: "independent", homeClinicId: null, rating: 4.9, availabilities: [SUN_AM, EVE(4)], hue: 230, sessionsViaCareGrid: 6, revenueViaCareGrid: 27600 },
  { id: "dr-fontaine", name: "Dr. Léa Fontaine", credential: "MD, Dermatology", specialty: "Dermatology", affiliation: "visiting", homeClinicId: "saintmarc", rating: 4.8, availabilities: [SAT_AM, EVE(3)], hue: 198, sessionsViaCareGrid: 9, revenueViaCareGrid: 31100 },
  { id: "dr-chevalier", name: "Dr. Marc Chevalier", credential: "MD, Cardiology", specialty: "Cardiology", affiliation: "visiting", homeClinicId: "bastille", rating: 4.7, availabilities: [SAT_FULL, EVE(0)], hue: 8, sessionsViaCareGrid: 7, revenueViaCareGrid: 33400 },
  { id: "dr-becker", name: "Dr. Tomás Becker", credential: "MD, Cardiology", specialty: "Cardiology", affiliation: "resident", homeClinicId: "lumiere", rating: 4.7, availabilities: [EVE(1), EVE(3)], hue: 18, sessionsViaCareGrid: 5, revenueViaCareGrid: 19800 },
  { id: "dr-ricci", name: "Dr. Sofia Ricci", credential: "MD, General Medicine", specialty: "General Medicine", affiliation: "resident", homeClinicId: "lumiere", rating: 4.8, availabilities: [SAT_FULL, EVE(1), EVE(3)], hue: 150, sessionsViaCareGrid: 11, revenueViaCareGrid: 21300 },
  { id: "dr-osei", name: "Dr. Kwame Osei", credential: "MD, General Medicine", specialty: "General Medicine", affiliation: "independent", homeClinicId: null, rating: 4.6, availabilities: [SAT_PM, SUN_AM], hue: 140, sessionsViaCareGrid: 4, revenueViaCareGrid: 9800 },
  { id: "dr-khan", name: "Dr. Inès Khan", credential: "MD, Ophthalmology", specialty: "Ophthalmology", affiliation: "independent", homeClinicId: null, rating: 4.8, availabilities: [SAT_FULL, SUN_AM], hue: 188, sessionsViaCareGrid: 8, revenueViaCareGrid: 25600 },
  { id: "dr-park", name: "Dr. Hana Park", credential: "MD, Ophthalmology", specialty: "Ophthalmology", affiliation: "visiting", homeClinicId: "opera", rating: 4.7, availabilities: [EVE(2), EVE(4)], hue: 178, sessionsViaCareGrid: 3, revenueViaCareGrid: 8700 },
  { id: "dr-mercier", name: "Dr. Paul Mercier", credential: "MD, Gynecology", specialty: "Gynecology", affiliation: "visiting", homeClinicId: "republique", rating: 4.8, availabilities: [SAT_FULL, EVE(0)], hue: 322, sessionsViaCareGrid: 6, revenueViaCareGrid: 22900 },
  { id: "dr-leroy", name: "Dr. Claire Leroy", credential: "MD, Gynecology", specialty: "Gynecology", affiliation: "independent", homeClinicId: null, rating: 4.7, availabilities: [SUN_AM, EVE(1)], hue: 312, sessionsViaCareGrid: 2, revenueViaCareGrid: 6400 },
  { id: "dr-novak", name: "Dr. Elena Novak", credential: "MD, Endocrinology", specialty: "Endocrinology", affiliation: "visiting", homeClinicId: "opera", rating: 4.6, availabilities: [SAT_PM, EVE(2)], hue: 268, sessionsViaCareGrid: 4, revenueViaCareGrid: 12800 },
  { id: "dr-weiss", name: "Dr. Daniel Weiss", credential: "MD, Endocrinology", specialty: "Endocrinology", affiliation: "resident", homeClinicId: "lumiere", rating: 4.6, availabilities: [EVE(0), EVE(4)], hue: 256, sessionsViaCareGrid: 3, revenueViaCareGrid: 10200 },
  { id: "dr-aziz", name: "Dr. Nadia Aziz", credential: "MD, Radiology", specialty: "Radiology", affiliation: "visiting", homeClinicId: "nation", rating: 4.7, availabilities: [SAT_FULL], hue: 38, sessionsViaCareGrid: 5, revenueViaCareGrid: 28400 },
  { id: "dr-marchetti", name: "Dr. Gio Marchetti", credential: "MD, Cardiology", specialty: "Cardiology", affiliation: "independent", homeClinicId: null, rating: 4.8, availabilities: [SUN_AM], hue: 0, sessionsViaCareGrid: 6, revenueViaCareGrid: 26100 },
  { id: "dr-traore", name: "Dr. Awa Traoré", credential: "MD, Dermatology", specialty: "Dermatology", affiliation: "visiting", homeClinicId: "belleville", rating: 4.7, availabilities: [SAT_PM, EVE(1)], hue: 222, sessionsViaCareGrid: 4, revenueViaCareGrid: 14700 },
];

export function doctorAvailableFor(
  doc: Doctor,
  win: { dayIndex: number; start: string; end: string }
): boolean {
  return doc.availabilities.some(
    (a) => a.dayIndex === win.dayIndex && toMin(a.start) <= toMin(win.start) && toMin(a.end) >= toMin(win.end)
  );
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export { toMin };

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */
const FIRST = ["Camille","Lucas","Emma","Hugo","Léa","Nathan","Chloé","Louis","Manon","Gabriel","Inès","Raphaël","Jade","Arthur","Louise","Adam","Alice","Noah","Lina","Ethan","Sarah","Tom","Anna","Yanis","Zoé","Aaron","Mila","Sacha","Rose","Mohamed","Eva","Théo","Romy","Liam","Nour","Maël","Iris","Naël","Ambre","Imran","Fatima","Antoine","Yasmine","Paul","Aïcha","Victor","Salomé","Mehdi","Capucine","Idris"];
const LAST = ["Martin","Bernard","Dubois","Moreau","Laurent","Lefebvre","Garcia","Roux","Fournier","Girard","Bonnet","Dupont","Lambert","Rousseau","Vincent","Muller","Faure","André","Mercier","Blanc","Diop","Nguyen","Khan","Rossi","Da Silva","Benali","Cohen","Traoré","Lopez","Marchetti","Schmitt","Leclerc","Gauthier","Perrin","Robin","Clément","Morel","Henry","Aubert","Sanchez"];
const AREAS = ["11th arr.","3rd arr.","4th arr.","10th arr.","12th arr.","19th arr.","20th arr.","Montreuil","Vincennes","2nd arr.","9th arr.","14th arr."];

const REASONS: Record<Specialty, { text: string; equip: string | null }[]> = {
  Dermatology: [
    { text: "Suspicious mole — needs dermoscopy", equip: "Dermatoscope" },
    { text: "Changing pigmented lesion", equip: "Dermatoscope" },
    { text: "Severe cystic acne flare", equip: null },
    { text: "Persistent eczema, failed topical Rx", equip: null },
    { text: "Annual skin cancer screening", equip: "Dermatoscope" },
    { text: "Lesion excision follow-up", equip: "Excision kit" },
    { text: "Rosacea management", equip: null },
  ],
  Cardiology: [
    { text: "Palpitations on exertion", equip: "ECG" },
    { text: "Uncontrolled hypertension", equip: "ECG" },
    { text: "Atrial fibrillation review", equip: "ECG" },
    { text: "Chest tightness workup", equip: "ECG" },
  ],
  "General Medicine": [
    { text: "Chronic fatigue workup", equip: null },
    { text: "Medication review", equip: null },
    { text: "Recurrent migraines", equip: null },
    { text: "Annual check-up", equip: null },
  ],
  Ophthalmology: [
    { text: "Blurred vision, needs slit-lamp", equip: "Slit lamp" },
    { text: "Diabetic retinopathy screening", equip: "Slit lamp" },
    { text: "Recurrent eye strain", equip: null },
    { text: "Glaucoma follow-up", equip: "Slit lamp" },
  ],
  Gynecology: [
    { text: "Pelvic ultrasound review", equip: "Ultrasound" },
    { text: "Annual screening", equip: null },
    { text: "Irregular cycles workup", equip: "Ultrasound" },
  ],
  Radiology: [
    { text: "Knee MRI review", equip: "MRI" },
    { text: "Abdominal CT follow-up", equip: "CT scanner" },
  ],
  Endocrinology: [
    { text: "Type 2 diabetes review", equip: null },
    { text: "Thyroid nodule follow-up", equip: null },
    { text: "Newly elevated HbA1c", equip: null },
  ],
};

const SPECIALTY_PLAN: { specialty: Specialty; count: number }[] = [
  { specialty: "Dermatology", count: 92 },
  { specialty: "General Medicine", count: 58 },
  { specialty: "Cardiology", count: 44 },
  { specialty: "Ophthalmology", count: 38 },
  { specialty: "Gynecology", count: 30 },
  { specialty: "Endocrinology", count: 26 },
  { specialty: "Radiology", count: 18 },
];

const URGENCY_WEIGHT: Record<Urgency, number> = { urgent: 3, soon: 2, routine: 1 };

function generatePatients(): Patient[] {
  const rng = mulberry32(SEED);
  const patients: Patient[] = [];
  let n = 0;
  for (const { specialty, count } of SPECIALTY_PLAN) {
    for (let i = 0; i < count; i++) {
      n++;
      const u = rng();
      const urgency: Urgency = u > 0.78 ? "urgent" : u > 0.42 ? "soon" : "routine";
      const waitDays = urgency === "urgent" ? range(rng, 8, 26) : urgency === "soon" ? range(rng, 18, 52) : range(rng, 30, 88);
      const currentNextSlotDays = urgency === "urgent" ? range(rng, 22, 40) : range(rng, 34, 63);
      const lat = 48.857 + (rng() - 0.5) * 0.075;
      const lng = 2.365 + (rng() - 0.5) * 0.1;
      let noShowRisk = 0.06 + (urgency === "routine" ? 0.14 : urgency === "soon" ? 0.08 : 0.03) + rng() * 0.14;
      noShowRisk = Math.min(0.46, Math.round(noShowRisk * 100) / 100);
      const reason = pick(rng, REASONS[specialty]);
      const [vmin, vmax] = VALUE_RANGE[specialty];
      patients.push({
        id: `p-${n.toString().padStart(3, "0")}`,
        name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
        age: range(rng, 19, 78),
        specialty,
        reason: reason.text,
        urgency,
        waitDays,
        currentNextSlotDays,
        lat,
        lng,
        area: pick(rng, AREAS),
        noShowRisk,
        estValue: range(rng, vmin, vmax),
        requiresEquipment: reason.equip,
        status: "waiting",
      });
    }
  }
  return patients;
}

export const PATIENTS: Patient[] = generatePatients();

export const HERO_PATIENT_ID = (() => {
  const c = PATIENTS.find((p) => p.specialty === "Dermatology" && p.urgency === "soon" && p.currentNextSlotDays > 45);
  return c?.id ?? PATIENTS.find((p) => p.specialty === "Dermatology")!.id;
})();

/* ------------------------------------------------------------------ */
/* Free capacity windows for the focal clinic                          */
/* ------------------------------------------------------------------ */
export const FREE_WINDOWS = [
  { dayIndex: 5, start: "09:00", end: "18:00" }, // Saturday
  { dayIndex: 6, start: "09:00", end: "13:00" }, // Sunday morning
  { dayIndex: 2, start: "18:00", end: "21:00" }, // Wed evening
  { dayIndex: 3, start: "18:00", end: "21:00" }, // Thu evening
];

/* ------------------------------------------------------------------ */
/* Distance + getters                                                  */
/* ------------------------------------------------------------------ */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

// Doctors with a real headshot in /public/doctors/<id>.jpg (gender-matched stock).
// Doctors not in this set fall back to the initials avatar.
const DOCTORS_WITH_PHOTO = new Set([
  "dr-diallo", "dr-fontaine", "dr-ricci", "dr-khan", "dr-traore", "dr-osei",
  "dr-chevalier", "dr-marchetti", "dr-becker", "dr-haddad", "dr-mercier", "dr-weiss",
]);
export const doctorPhoto = (id: string | null | undefined): string | null =>
  id && DOCTORS_WITH_PHOTO.has(id) ? `/doctors/${id}.jpg` : null;

/* ------------------------------------------------------------------ */
/* Availability bands — coarse self-service grid for host & doctor views */
/* ------------------------------------------------------------------ */
export const BANDS = [
  { key: "morning", label: "Morning", sub: "08–12", startHour: 8, endHour: 12 },
  { key: "afternoon", label: "Afternoon", sub: "13–17", startHour: 13, endHour: 17 },
  { key: "evening", label: "Evening", sub: "18–21", startHour: 18, endHour: 21 },
] as const;
export type BandKey = (typeof BANDS)[number]["key"];

export function bandForHour(h: number): BandKey {
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
export const bandKey = (dayIndex: number, band: string) => `${dayIndex}-${band}`;

/** Turn a doctor's Availability windows into the set of band keys they cover. */
export function availabilityToBandKeys(avails: Availability[]): string[] {
  const keys = new Set<string>();
  for (const a of avails) {
    const s = toMin(a.start), e = toMin(a.end);
    for (const b of BANDS) {
      if (s < b.endHour * 60 && e > b.startHour * 60) keys.add(bandKey(a.dayIndex, b.key));
    }
  }
  return [...keys];
}

/* Equipment ↔ specialty — single source of truth is SPECIALTY_META.requiredEquipment */
export function specialtiesForEquipment(present: string[]): Specialty[] {
  return ALL_SPECIALTIES.filter((s) => SPECIALTY_META[s].requiredEquipment.every((e) => present.includes(e)));
}
export function specialtiesUnlockedBy(equipment: string): Specialty[] {
  return ALL_SPECIALTIES.filter((s) => SPECIALTY_META[s].requiredEquipment.includes(equipment));
}

/** Host cabinet demo state — mirrors HostProfile (equipment + offered slots). */
export const CABINET_EQUIPMENT: { name: string; default: boolean }[] = [
  { name: "Exam table", default: true },
  { name: "Vitals station", default: true },
  { name: "Dermatoscope", default: true },
  { name: "ECG", default: true },
  { name: "Ultrasound", default: true },
  { name: "Slit lamp", default: true },
  { name: "MRI", default: false },
];
export const CABINET_OFFERED_DEFAULT = ["0-evening", "2-evening", "5-morning", "5-afternoon", "6-morning"];

export const getClinic = (id: string) => CLINICS.find((c) => c.id === id);
export const getRoom = (id: string) => ROOMS.find((r) => r.id === id);
export const getDoctor = (id: string) => DOCTORS.find((d) => d.id === id);
export const getPatient = (id: string, list: Patient[] = PATIENTS) => list.find((p) => p.id === id);
export const FOCAL_CLINIC = CLINICS.find((c) => c.id === FOCAL_CLINIC_ID)!;
