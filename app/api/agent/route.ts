import { NextResponse } from "next/server";
import {
  DOCTORS,
  FREE_WINDOWS,
  PATIENTS,
  ROOMS,
  SPECIALTY_META,
  getClinic,
} from "@/lib/data";
import { buildCapacityPlan } from "@/lib/engine";
import { WEEK_DAYS } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIMARY_MODEL = "claude-opus-4-8";

const FALLBACK_RATIONALE =
  "The clinic's evenings and weekend rooms sit idle. I assembled available specialists — including independent and visiting doctors from other clinics — into the equipped rooms that match their specialty, then packed each day at each specialty's natural consult cadence. Travel time for visiting doctors is built into the schedule, and the longest-waiting, nearest, low-no-show patients fill the slots first.";

const SYSTEM_PROMPT = `You are CareGrid's capacity-optimization engine for a clinic. You assemble idle rooms + available doctors (resident, visiting from other clinics, or fully independent) + the patient waitlist into brand-new sessions that fill otherwise-empty evening and weekend capacity, maximizing patients treated while respecting room equipment and 15-minute travel for non-resident doctors.
Respond with PURE JSON only, no markdown:
{ "rationale": string (2-3 sentences explaining the assembly strategy), "headline": string (one punchy line) }`;

function candidateSummary() {
  const windows = FREE_WINDOWS.map((w) => `${WEEK_DAYS[w.dayIndex].long} ${w.start}-${w.end}`).join("; ");
  const rooms = ROOMS.map((r) => `${r.name} [${r.equipmentPresent.join(", ")}]${r.equipmentMissing.length ? ` (missing: ${r.equipmentMissing.join(", ")})` : ""}`).join("\n");
  const docs = DOCTORS.map((d) => `${d.name} — ${d.specialty} — ${d.affiliation}${d.homeClinicId ? ` (home: ${getClinic(d.homeClinicId)?.name})` : ""}`).join("\n");
  const demand = Object.keys(SPECIALTY_META)
    .map((s) => `${s}: ${PATIENTS.filter((p) => p.specialty === s && p.status === "waiting").length} waiting (${SPECIALTY_META[s as keyof typeof SPECIALTY_META].consultMinutes}min each)`)
    .join("; ");
  return `FOCAL CLINIC: Lumière Health, Paris (11th). Today is Wednesday.\n\nIDLE WINDOWS:\n${windows}\n\nROOMS + EQUIPMENT:\n${rooms}\n\nAVAILABLE DOCTORS (independent of clinics):\n${docs}\n\nWAITLIST DEMAND:\n${demand}`;
}

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const deterministic = process.env.CAREGRID_DETERMINISTIC === "1";

  // The plan is computed deterministically (the engine IS the optimizer). The
  // model supplies the strategic narrative; on any failure we use a canned one.
  const plan = buildCapacityPlan(PATIENTS.map((p) => ({ ...p })), { source: apiKey && !deterministic ? "agent" : "fallback" });

  if (!apiKey || deterministic) {
    return NextResponse.json({ plan, rationale: FALLBACK_RATIONALE, source: "fallback" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `${candidateSummary()}\n\nAssemble the optimal weekend + evening capacity plan and explain your strategy.` }],
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text: string = data?.content?.map((b: { text?: string }) => b.text ?? "").join("") ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : null;
    const rationale = parsed?.rationale?.trim() || FALLBACK_RATIONALE;
    return NextResponse.json({ plan, rationale, source: "agent" });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ plan: { ...plan, source: "fallback" }, rationale: FALLBACK_RATIONALE, source: "fallback" });
  }
}
