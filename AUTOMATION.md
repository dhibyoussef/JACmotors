# JAC Motors Tunisie — automation WhatsApp + PDF

## What changed

The old “second message” (dealer reply copy/paste) is **removed** for devis.

New devis workflow:

1. Client submits `/devis` (model, color, options, WhatsApp number).
2. Server sends an **acknowledgment** to the **client** WhatsApp:
   “Merci, votre demande est bien reçue — vous recevrez sous peu le document PDF…”
3. Server notifies the **dealer** inbox.
4. After `PDF_DELAY_MS` (default 90s), server sends the **stamped professional PDF** to the **client** number.

Visit / essai / Meet / 360 interest use the same always-on server: auto WhatsApp to the client number + dealer alert. No manual second send.

## Always-on server

```bash
cp .env.example .env
npm install
npm run build
npm start
# → http://127.0.0.1:8787  (API + built site)
```

Local full stack (Vite + API):

```bash
npm run dev
```

Docker (restart always):

```bash
docker compose up -d --build
```

PM2:

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

## WhatsApp Cloud API (real send)

1. Create a Meta WhatsApp Business app / Cloud API phone number.
2. Put credentials in `.env`:

```env
WHATSAPP_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_DEALER_E164=21699757218
PDF_DELAY_MS=90000
PUBLIC_BASE_URL=https://your-server.example.com
```

3. Restart the server. `GET /api/health` should show `"mode": "cloud-api"`.

Without credentials the server runs in **dry-run**: messages are written to `server/data/outbox/` and PDFs to `server/data/pdfs/`. Perfect for testing the workflow before Meta approval.

> First business-initiated WhatsApp messages to a new client may require an **approved template**. Utility/auth templates are configured in Meta Business Manager. Once the client replies, session messages (ack + PDF caption) are freer within the 24h window. If you only have a personal WhatsApp today, keep dry-run until Cloud API is ready — or connect a compliant BSP.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Status + WhatsApp mode |
| POST | `/api/leads/devis` | Ack + schedule PDF |
| POST | `/api/leads/visite` | Visit / essai / Meet ack |
| POST | `/api/leads/interest` | 360 / showroom interest |
| GET | `/api/pdfs/:name` | Download generated PDF |
| GET | `/api/appointments/slots` | Public checkup slots |
| POST | `/api/appointments/public` | Public checkup booking |
| POST | `/api/admin/login` | Staff login (token) |
| GET | `/api/admin/dashboard` | Ops stats |
| GET/POST | `/api/admin/clients` | Manage clients |
| GET/POST | `/api/admin/users` | Manage staff users |
| GET/POST/PATCH | `/api/admin/appointments` | Calendar / checkups |
| GET | `/api/admin/documents` | Devis PDFs ready for client |
| GET | `/api/admin/leads` | Recent leads |
| GET | `/api/admin/jobs` | Delayed jobs |

## Branded admin UI

- Route: `/admin` (same JAC red/black theme as the public site)
- Default staff: `admin@jacmotors.tn` / `JacMotors2026!`
- Modules: dashboard, leads, clients, calendar RDV, documents, users, WhatsApp queue
- Public checkup calendar: `/apres-vente#checkup`

## Frontend hosting

- **Recommended production:** Docker/PM2 server serves `dist` + `/api` on one origin (always running for delayed PDF jobs).
- Vercel can still host the static SPA; set `VITE_API_BASE=https://your-always-on-server` so forms call the automation host. Delayed PDF jobs **must** run on the always-on server, not on Vercel serverless alone.

## Photos / financing

- Keep official JAC (China) photos for Tunisian-market models we actually sell — no fake local shoot required.
- Interactive financing sliders: postponed on purpose.

## Tests

```bash
npm run test:messages
npm run test:api
```
