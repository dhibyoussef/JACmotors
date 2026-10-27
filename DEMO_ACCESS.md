# JAC Motors Tunisie — DEMO ACCESS

> **This is a DEMO.**  
> Messages go to the on-server **JAC Messagerie** (fake WhatsApp inbox), not to real WhatsApp yet.  
> **Later:** the same flow will send to the **real WhatsApp number of the client**.  
> WhatsApp Cloud API tokens are empty for now (`WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`).

---

## Base URL (live now)

**https://fossil-triumph-harris-silence.trycloudflare.com**

*(Cloudflare quick tunnel — if links die, ask to restart the tunnel.)*

---

## All public links

| What | Link |
|------|------|
| Site (home) | https://fossil-triumph-harris-silence.trycloudflare.com/ |
| Devis (quote) | https://fossil-triumph-harris-silence.trycloudflare.com/devis |
| Visite / Essai / Meet | https://fossil-triumph-harris-silence.trycloudflare.com/visite |
| Modèles 360 | https://fossil-triumph-harris-silence.trycloudflare.com/modeles |
| Après-vente / Check-up | https://fossil-triumph-harris-silence.trycloudflare.com/apres-vente#checkup |
| Showrooms | https://fossil-triumph-harris-silence.trycloudflare.com/showrooms |
| **Messagerie** (demo inbox) | https://fossil-triumph-harris-silence.trycloudflare.com/messagerie?phone=99757218 |
| **Admin** back-office | https://fossil-triumph-harris-silence.trycloudflare.com/admin |
| **CMS** (Directus) | https://fossil-triumph-harris-silence.trycloudflare.com/cms/admin/ |
| **n8n** automation | https://fossil-triumph-harris-silence.trycloudflare.com/n8n/ |
| API health | https://fossil-triumph-harris-silence.trycloudflare.com/api/health |
| Database UI (Adminer) | https://fossil-triumph-harris-silence.trycloudflare.com/db/ |
| Vercel mirror (frontend only) | https://jacmotors-two.vercel.app |

---

## Passwords (demo — change in production)

| Where | Email / User | Password |
|-------|----------------|----------|
| Admin site | `admin@jacmotors.tn` | `JacMotors2026!` |
| Admin (sub) | `subadmin@jacmotors.tn` | `JacMotors2026!` |
| Admin (under) | `underadmin@jacmotors.tn` | `JacMotors2026!` |
| CMS Directus | `admin@jacmotors.tn` | `JacMotors2026!` |
| n8n | `admin@jacmotors.tn` | `JacMotors2026!` |

---

## Database (Postgres)

| Field | Value |
|-------|-------|
| Host (from this machine) | `127.0.0.1:5433` |
| Host (Adminer / Docker) | `postgres_app` |
| User | `jac` |
| Password | `jac_dev_change_me` |
| Database | `jacmotors` |
| Connection URL | `postgresql://jac:jac_dev_change_me@127.0.0.1:5433/jacmotors` |

**Adminer login:** System = PostgreSQL · Server = `postgres_app` · User = `jac` · Password = `jac_dev_change_me` · Database = `jacmotors`

---

## Auth keys / env (demo)

| Key | Value / note |
|-----|----------------|
| Directus `SECRET` | `jac_directus_secret_change_me_2026` |
| `PUBLIC_BASE_URL` | `https://fossil-triumph-harris-silence.trycloudflare.com` |
| `N8N_WEBHOOK_BASE` | `https://fossil-triumph-harris-silence.trycloudflare.com/n8n/webhook` |
| Dealer WhatsApp (demo) | `21699757218` |
| `WHATSAPP_TOKEN` | *(empty — demo / messagerie mode)* |
| `WHATSAPP_PHONE_NUMBER_ID` | *(empty — demo / messagerie mode)* |
| `PDF_DELAY_MS` | `5000` on the running demo API (ACK first, then PDF) |

---

## n8n webhooks

| Flow | URL |
|------|-----|
| Devis | https://fossil-triumph-harris-silence.trycloudflare.com/n8n/webhook/jac-devis |
| Visite / Meet | https://fossil-triumph-harris-silence.trycloudflare.com/n8n/webhook/jac-visite |
| 360 interest | https://fossil-triumph-harris-silence.trycloudflare.com/n8n/webhook/jac-360 |

---

## Simple how-to (demo)

1. Open **Devis** → fill the form with a Tunisian phone (ex. `99757218`).
2. You get an immediate ACK in **Messagerie** (not real WhatsApp yet).
3. After a few seconds, the **PDF devis** appears in the same chat.
4. Staff open **Admin** with `admin@jacmotors.tn` / `JacMotors2026!` to see leads, PDFs, calendar, messagerie.
5. Edit site content in **CMS**. Automations live in **n8n**.

**Later (production):** put real Meta WhatsApp Cloud API tokens → messages go to the client’s real WhatsApp number.
