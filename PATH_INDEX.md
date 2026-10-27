# JAC Motors Tunisie — Full path index (every case + outcome)

**Public base:** https://charm-choir-butter-centuries.trycloudflare.com  
**Evidence run saved under:** `/opt/cursor/artifacts/demo-paths/`  
**Screenshots:** `/opt/cursor/artifacts/screenshots/0{1-6}-*.png`  
**WhatsApp mode now:** dry-run (messages + PDFs prepared & logged; live send when Cloud API tokens are set)

---

## Map at a glance

```
PUBLIC USER                         ADMIN / STAFF
────────────                        ─────────────
/  Home                             /admin  login
├─ /devis      → ACK + PDF later     ├─ Tableau de bord
├─ /visite     → Visite|Essai|Meet  ├─ Leads
├─ /modeles    → 360 interest       ├─ Clients
├─ /apres-vente#checkup → RDV       ├─ Calendrier RDV
├─ /showrooms                       ├─ Documents (PDFs)
└─ /reserver   (local ticket)       ├─ Utilisateurs
                                    └─ File WhatsApp
```

---

## U1 — Devis (quote PDF) · `/devis`

**User does:** name + WhatsApp + model + color + options + showroom → submit

| Step | What happens | Outcome (proven this run) |
|------|----------------|---------------------------|
| 1 | Form POST `/api/leads/devis` | `ok: true`, leadId `DEV-20261026-G9Q21` |
| 2 | Immediate WhatsApp to **client number** | Personalized ACK — see `messages/01-devis-client-ack.txt` |
| 3 | WhatsApp to **dealer** `21699757218` | New-lead alert with color/options — `messages/01-devis-dealer-alert.txt` |
| 4 | Server builds stamped PDF for **that** selection | PDF URL live HTTP 200 · `01-devis.pdf` |
| 5 | After `PDF_DELAY_MS` (~8s demo) | Document WhatsApp to **same client number** — `messages/01-devis-client-pdf.txt` |
| 6 | Admin | Lead + Document row appear; job in File WhatsApp |

**Client ACK sample:**
```
Bonjour *Path*,
Merci pour votre demande de devis concernant le *JAC T8 PRO*.
… PDF professionnel … sous peu …
Réf. dossier : *DEV-20261026-G9Q21*
```

**PDF caption sample:**
```
Bonjour Path,
Voici votre *devis PDF JAC T8 PRO* (réf. DEV-20261026-G9Q21).
```

**Screenshot:** `screenshots/02-devis.png`

---

## U2 — Google Meet · `/visite` (mode Meet)

**User does:** pick Meet + model + showroom + date/time + WhatsApp → submit

| Step | Outcome |
|------|---------|
| API | `ackSent: true`, `meetUrl` generated |
| WhatsApp client | Confirmation with **Lien Meet** included |
| WhatsApp dealer | Nouveau lead `meet` |
| Admin | Lead type `meet` in Leads |

**Proven message** (`messages/02-meet-client-ack.txt`):
```
… Google Meet … JAC T8 PRO …
• Date / Heure …
• Lien Meet : https://meet.google.com/vis-ite2-026
```

**Screenshot:** `screenshots/03-visite.png`

---

## U3 — Essai routier · `/visite` (mode Essai)

| Step | Outcome |
|------|---------|
| WhatsApp client | Essai confirmation + “apportez un permis” |
| Meet link | none |
| Dealer | alert |

Evidence: `messages/03-essai-client-ack.txt` · API `03-essai-response.json`

---

## U4 — Visite showroom · `/visite` (mode Visite)

| Step | Outcome |
|------|---------|
| WhatsApp client | Visite showroom confirmation (date/time/showroom) |
| Dealer | alert |

Evidence: `messages/04-visite-client-ack.txt` · API `04-visite-response.json`

---

## U5 — 360° interest · `/modeles`

**User does:** after 360 view, leave name + WhatsApp

| Step | Outcome |
|------|---------|
| WhatsApp client | Thanks for 360° interest on JAC model; counselor will recontact |
| Dealer | alert type `360` |

Evidence: `messages/05-360-client-ack.txt` · API `05-360-response.json`  
**Screenshot:** `screenshots/04-modeles.png`

---

## U6 — Check-up atelier (bring your car) · `/apres-vente#checkup`

**User does:** pick date + slot + model + plate + notes → submit

| Step | Outcome |
|------|---------|
| API | appointment created `pending` |
| WhatsApp client | RDV atelier ACK with ref/date/time/plate |
| WhatsApp dealer | `NOUVEAU RDV ATELIER` |
| Slots | chosen time marked `taken: true` |
| Admin calendar | RDV visible; staff can Confirm → `confirmed` |

Evidence: `06-checkup-response.json`, `06-checkup-slots.json`, `messages/06-checkup-client-ack.txt`, `A8-confirm-rdv.json` (status → confirmed)  
**Screenshot:** `screenshots/05-checkup.png`

---

## Admin paths · `/admin`

**Screenshot login:** `screenshots/06-admin-login.png`

### Staff accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jacmotors.tn | JacMotors2026! |
| Sub-admin | subadmin@jacmotors.tn | JacMotors2026! |
| Under-admin | underadmin@jacmotors.tn | JacMotors2026! |

### A0 Login
All three roles login OK (`A0-admin-login.json`, `A0-login-sub.json`, `A0-login-under.json`).

### A1 Dashboard
Live stats from this run: leads **36**, clients **22**, appointments **8**, documents **16**, users **4**.

### A2 Leads
Every devis / visite / meet / essai / 360 appears with status + PDF link when applicable.

### A3 Clients
Customer file: name, phone, model, plate, notes (auto-created from leads/RDV).

### A4 Calendrier RDV
Check-ups & atelier appointments; Confirm / Terminé / Annuler. Proven: RDV `RDV-20261026-3C1F` → `confirmed`.

### A5 Documents
Devis PDFs ready to open/send — HTTP 200 on public PDF URLs.

### A6 Utilisateurs
Admin / Sub-admin / Under-admin (+ optional conseiller).

### A7 File WhatsApp
Queue of ACK + delayed PDF jobs (dry-run log).

### A8 Remplir démo
Admin-only button re-seeds fake data + PDFs per model×color (`npm run seed:demo`).

---

## Sequence diagram — Devis (your exact question)

```
Client form                Automation server              Client WhatsApp           Dealer WhatsApp
    |                            |                              |                         |
    |--- submit devis ---------->|                              |                         |
    |                            |--- ACK text NOW ------------>|                         |
    |                            |--- lead alert --------------------------------------->|
    |                            |-- build PDF (that selection) |                         |
    |<-- success + pdfUrl -------|                              |                         |
    |                            |  … wait PDF_DELAY_MS …       |                         |
    |                            |--- PDF document ------------>|                         |
    |                            |                              |                         |
    |                     Admin sees lead + document + job                                |
```

**Yes:** message is sent to the **number quoted in the form**, with the **name from the form**, then **after some time the document for that selection** is sent automatically.

---

## Sequence — Meet / Visite / Essai

```
Client → /visite → API → WhatsApp ACK (date/time[/Meet link]/permis) → Dealer alert → Admin Leads
```

## Sequence — Check-up

```
Client → calendar slot → API → WhatsApp ACK → Dealer alert → slot taken → Admin calendar (confirm)
```

---

## Current limitation (honest)

WhatsApp Cloud API tokens are **not** configured on this host → mode = **dry-run**.  
That means every message/PDF **is generated exactly as it would be sent**, stored in:

- `server/data/outbox/` (texts + documents)
- `server/data/pdfs/` (stamped PDFs)

When you set `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`, the **same workflow** delivers to real phones — no redesign needed.

---

## Artifact index (this evidence run)

| File | Meaning |
|------|---------|
| `demo-paths/01-devis-response.json` | Devis API result |
| `demo-paths/01-devis.pdf` | Generated PDF binary |
| `demo-paths/messages/01-devis-client-ack.txt` | Client thank-you |
| `demo-paths/messages/01-devis-client-pdf.txt` | Delayed PDF caption |
| `demo-paths/messages/01-devis-dealer-alert.txt` | Dealer alert |
| `demo-paths/messages/02-meet-client-ack.txt` | Meet + link |
| `demo-paths/messages/03-essai-client-ack.txt` | Essai |
| `demo-paths/messages/04-visite-client-ack.txt` | Visite |
| `demo-paths/messages/05-360-client-ack.txt` | 360 |
| `demo-paths/messages/06-checkup-client-ack.txt` | Check-up |
| `demo-paths/A1…A7-*.json` | Admin module snapshots |
| `demo-paths/A8-confirm-rdv.json` | Admin confirmed appointment |
| `screenshots/01-home.png` … `06-admin-login.png` | UI states |
