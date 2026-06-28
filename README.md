# CareGrid

**The capacity layer for healthcare.** CareGrid is an AI agent that *creates* medical capacity that didn't exist — assembling idle cabinets, available doctors, equipment and the patient waitlist into brand-new, optimized sessions.

> *"Doctolib helps you book an appointment that exists. CareGrid creates appointments that didn't exist yesterday."*

**Paris Builds (Y Combinator × Unaite) — Track: _The Next Big Decacorn_.**

- ▶️ **Demo video:** _add your video link here before submitting_
- 📊 **Pitch deck:** [`PITCH_DECK.md`](PITCH_DECK.md)
- 🎬 **Demo script (voiceover + beats):** [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)

---

## What it does

In France, patients wait weeks or months for a specialist while equipped cabinets sit empty every evening and weekend. CareGrid closes that gap. It takes three things that already exist but never meet —

1. **Host doctors** — own a cabinet that's idle evenings/weekends and offer it (equipment + open windows).
2. **Visiting doctors** — specialists willing to consult in someone else's cabinet (a +15-min travel buffer is built in).
3. **Patients** — on a waitlist, searching for a specialty near them.

— and an **optimization engine assembles them into a brand-new session**: the right specialist, in an equipped cabinet, packed slot-by-slot with the longest-waiting nearby patients. Appointments that did not exist yesterday.

## How it works

### The engine (`lib/engine.ts`)
- **Doctors are independent entities** (`resident` / `visiting` / `independent`) with their own availabilities, matched into *any* cabinet — including ones that aren't their home. Non-resident doctors get a **+15-min travel buffer** baked into the schedule.
- The engine greedily fills each idle evening/weekend room-window with the best available doctor for a specialty the room's **equipment** supports, then **packs the day slot-by-slot** at that specialty's consult cadence (Derm 15 min, Cardio 30 min, …) with the best-matched waitlist patients. Equipment is respected — Radiology is excluded at the focal clinic because it has no MRI/CT.
- Output: a plan of **~17 sessions · ~200 patients · +€33,592 · 12 doctors (5 independent · 5 visiting)** across one weekend + evenings, with per-session justification. Numbers tie out to the underlying records.

### Real AI, robust by design
- A reasoning model (server-side only, via `/v1/messages`) receives the live candidate set — idle windows, rooms + equipment, the available-doctor network, waitlist demand by specialty — and returns the **strategic rationale** shown (de-branded) in the orchestration console. The deterministic engine computes the actual assignments and numbers, so headline figures always tie out.
- **The demo never breaks.** The call is wrapped in `try/catch` with a deterministic, precomputed fallback. Missing key, network down, or `CAREGRID_DETERMINISTIC=1` → the app renders **identically**. No model or engine name is ever shown in the UI.
- **No secrets in the repo.** The API key is read from `process.env.ANTHROPIC_API_KEY` server-side only and lives in `.env.local` (git-ignored). It is never bundled to the browser.

## The product — three spaces

A **marketing landing** (`/`) is the public entry (hero, how-it-works, stats — no patient data). **Get started / Log in** → a demo **fake auth** (`/login`, `/signup`): any email signs you in, you pick a **role**, and you're routed to that space. State is held in memory only (no backend, no storage); the signed-in name shows consistently everywhere.

1. **Patient (`/app`)** — a guided flow: choose a **specialty**, set **options** (reason, urgency, evening/weekend preference, location, max distance), confirm details, get matched. Results are **sorted by soonest** and show **how soon** each option is (*Available today / tomorrow / in N days*) and **distance**; brand-new CareGrid capacity appears first. Confirm → a **demo checkout** (order summary + card form, clearly labelled demo — no real payment) → a **confirmation page** → the booking appears in **My appointments** (`/appointments`, with reminders) and back on the home.
2. **Host doctor (`/clinic`)** — opens on **My cabinet**: a weekly **availability board** (offer idle morning/afternoon/evening slots — Open / Booked / Closed), an **equipment manager** whose toggles decide *which specialties the cabinet can host*, and the list of appointments booked into the cabinet. A second **Orchestration** tab is the engine console: press **Detect opportunities** and the plan assembles onto a KPI dashboard + week/month calendar — tap any session for slot-by-slot detail.
3. **Visiting doctor (`/doc`)** — **My schedule**: set your **specialty** and tap a weekly board to mark your **availability**; booked sessions show on the same calendar. **Turnkey offers**: sessions composed for you at a cabinet that isn't yours — room, patients, equipment, billing arranged, travel + payout shown — one tap to accept.

The patient experience is the public default; the host and doctor consoles are reached by role at sign-in (or by URL), never linked from the patient view.

## Install & run

```bash
npm install

# Optional — enable the live AI rationale (read server-side only, never committed):
cp .env.example .env.local      # then set ANTHROPIC_API_KEY=...

npm run dev                     # http://localhost:3000
```

**No key needed to demo** — the deterministic fallback produces the same plan. For a fully reproducible recording, set `CAREGRID_DETERMINISTIC=1` in `.env.local` (fixed numbers, identical visuals every run). For reliable screenshots use the production build (`npm run build && npm run start`); dev HMR can interfere with capture. View at ~1280px for the intended layout.

**Routes:** `/` (landing) · `/login` · `/signup` · `/app` (patient) · `/appointments` · `/clinic` (host) · `/doc` (visiting doctor) · `/profile`.

## Demo flow (end-to-end)

1. **Landing (`/`)** → **Get started** → **`/login`**: pick **Patient**, any email → **Continue**.
2. **Patient (`/app`)** → **Find an appointment** → **Dermatology** → options (ASAP, République, ≤10 km) → details → **Find my appointment** (short loading).
3. Results sorted by soonest → top card **Newly created capacity · available within days · Dr. Diallo · 1.6 km** → **Confirm** → **demo checkout** → **Pay & confirm** → **confirmation page** → it appears in **My appointments**.
4. Log out → sign in as **Host doctor** → **`/clinic` → My cabinet** (availability + equipment + appointments). Open the **Orchestration** tab → **Detect opportunities** → engine reveals **17 sessions · 202 patients · +€33,592 · 12 doctors**; open a session for the slot-by-slot day.
5. Sign in as **Visiting doctor** → **`/doc`**: set specialty + availability on **My schedule**, then **Turnkey offers** → **Accept**.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · **shadcn/ui** primitives (Card, Button, Tabs, Input, Label) · Radix · Motion · a server-side Anthropic API route. Real URL routing over a shared in-memory store (no persistence). Rich **deterministic** dataset (8 clinics, ~18 decoupled doctors, ~300 located patients) for reproducible recordings.

## Design

**shadcn/ui** design system, Apple-minimalist: near-**monochrome** base (white / off-white, deep near-**black** for text and **primary buttons**), neutral grays, thin borders, ~zero shadows, soft radius. **Medical blue is the accent only** (active items, links, "new capacity", sparklines); vivid colors are reserved for data-viz (specialty coding, ▲/▼ deltas). Tailwind v4 tokens are raw HSL channels mapped through `@theme inline` so alpha modifiers work; `--primary` (black) and `--brand` (blue) are split so buttons and accents never collide. Typography **Inter / Inter Tight**; line icons, no emoji in-app. Patterns reproduced: **KPI cards with sparkline + colored delta**, an **admin sidebar**, `BorderBeam` on hero/auth cards, and a scroll-drawn capacity animation on the landing.
