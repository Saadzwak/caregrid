# CareGrid — 90-Second Demo Video Script

**Goal:** show CareGrid is a real capacity-optimization engine — it assembles independent & visiting doctors + idle rooms + the waitlist into packed, brand-new sessions, and gets a waiting patient seen weeks earlier. Patient-first; admin views (`/clinic`, `/doc`) are reached by URL.

**Format:** screen recording at 1280px (production build). Voiceover ≈ 180 words. For a perfectly reproducible take, set `CAREGRID_DETERMINISTIC=1`. Three roles sign in at `/login`: Patient, Host doctor, Visiting doctor.

---

### [0:00–0:08] · Landing → sign in
**On screen:** Landing (`/`) — "Stop waiting weeks for care." Click **Get started** → `/login`, pick **Patient**, any email, **Continue**.
**VO:** "CareGrid creates appointments that didn't exist. Three sides — patients, host doctors who lend their cabinet, and visiting doctors. Let's start as a patient."

### [0:08–0:18] · Patient — the everyday problem (`/`)
**On screen:** Landing: "Stop waiting weeks for care." A patient who'd otherwise wait weeks for dermatology clicks **Find an appointment** → pick **Dermatology**.
**VO:** "In France, the first free dermatology slot is often weeks away. Let's see what CareGrid finds."

### [0:12–0:26] · Guided search with real options
**On screen:** Options — reason, *as soon as possible*, location **République**, **within 10 km**. Details are pre-filled. Click **Find my appointment**.
**VO:** "They tell us the specialty, how soon, and where they are — with simple options, not a form to wrestle with."

### [0:26–0:42] · The magic — newly created capacity + checkout
**On screen:** Results sorted by soonest. The top cards read **Newly created capacity · Available today / Tomorrow** (Dr. Amara Diallo · independent · 1.6 km, with a photo); existing clinics sit weeks out ("29d / 33d wait"). Click **Confirm** → a **demo checkout** (order summary + card `4242…`, total ≈ €72) → **Pay & confirm** → the confirmation page.
**VO:** "A brand-new appointment, available today, a kilometre and a half away, with a real specialist — pay and you're booked. No data we don't have, just how soon it is."

### [0:42–0:58] · Behind the scenes — the engine (`/clinic` → Orchestration tab)
**On screen:** Sign in as **Host doctor** → land on **My cabinet** (availability + equipment + appointments). Switch to the **Orchestration** tab, click **Detect opportunities**. The optimization engine reasons (de-branded), then reveals: **17 sessions · 202 patients · +€33,592 · 12 doctors assembled (5 independent · 5 visiting)**.
**VO:** "Behind the scenes: the clinic's evenings and weekends were empty. CareGrid assembled twelve doctors — independent and visiting from other clinics — into those idle rooms. Two hundred and two appointments that didn't exist."

### [0:58–1:14] · A real, detailed plan
**On screen:** The week calendar fills evenings + weekend. Open a session: **28 dermatology patients, 15-min slots, a +15-min travel buffer, the right equipped room**. Radiology was excluded — the clinic has no MRI.
**VO:** "Every session is a full, real day — packed at each specialty's cadence, travel time built in, equipment respected. This is orchestration, not a search filter."

### [1:14–1:26] · The doctor's side (`/doc`)
**On screen:** Sign in as **Visiting doctor** → Dr. Diallo's workspace. **My schedule**: she sets her specialty and taps a weekly board to mark when she's available; booked sessions already show on the same calendar. **Turnkey offers**: a Saturday session assembled for her at a clinic that isn't hers — patients, room, billing arranged, payout shown. One tap to accept. (The **host** side mirrors this: the cabinet owner offers idle slots and toggles equipment, which decides the specialties the cabinet can host.)
**VO:** "Doctors just set their specialty and availability — CareGrid hands back a turnkey offer. Show up and practise."

### [1:26–1:30] · Close
**VO:** "Doctolib books appointments that exist. CareGrid creates appointments that didn't exist yesterday."

---

**Recording tips:** `/clinic` and `/doc` are reached by URL (or the operator bar once there) — the patient never sees them. Set `CAREGRID_DETERMINISTIC=1` for identical numbers each take; the fallback is visually identical to a live run.
