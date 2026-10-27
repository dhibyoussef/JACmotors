# JAC Motors Tunisie — Testing guide (DEMO)

> **This is a DEMO.**  
> Messages appear in on-server **JAC Messagerie**, not on real WhatsApp.  
> **Later:** same flows send to the **client’s real WhatsApp number**.

**Start here (interactive page):**  
https://fossil-triumph-harris-silence.trycloudflare.com/test  

**Auto API test:**  
https://fossil-triumph-harris-silence.trycloudflare.com/api/demo/test-all?run=1  

**Passwords:** `admin@jacmotors.tn` / `JacMotors2026!`  
**Demo phone:** `99 757 218` · dealer `21699757218`

---

## Go in this order

### 1) Open the test guide first
1. Go to **/test**
2. Click **Run auto test**
3. Confirm green checks (API, DB, pages, sample devis/visite/360, admin login)
4. Tick step 1 when done

**See:** checklist progress bar + report with ✓ / ✗

---

### 2) Home
1. Open **/**  
2. Scroll hero, models, FAQ, footer  

**See:** T8 / T8 PRO content, CTAs to Devis / Visite  

---

### 3) Devis (main flow)
1. Open **/devis**
2. Fill: name + WhatsApp `99 757 218`
3. Choose model, color, options, showroom → submit  

**See:** success message → auto redirect to **Messagerie**  
**See:** ACK message, then PDF after a few seconds  

---

### 4) Messagerie (demo WhatsApp)
1. Open **/messagerie?phone=99757218**
2. Read the last bubbles  

**See:** bold text (not raw `*stars*`), PDF document bubble opens  

---

### 5) Visite / Essai / Meet
1. Open **/visite**
2. Mode **Meet** → date + time + phone → submit  
3. Optional: try Essai or Visite showroom  

**See:** ACK in Messagerie (+ Meet link for Meet mode)  

---

### 6) Modèles 360
1. Open **/modeles**
2. Leave interest with WhatsApp  

**See:** interest ACK in Messagerie · lead in Admin  

---

### 7) Après-vente check-up
1. Open **/apres-vente#checkup**
2. Pick date + slot + plate → submit  

**See:** RDV ACK · appointment in Admin calendar  

---

### 8) Showrooms
1. Open **/showrooms**  

**See:** Tunisie locations + contact  

---

### 9) Admin
1. Open **/admin**
2. Login `admin@jacmotors.tn` / `JacMotors2026!`
3. Check: Dashboard · Leads · Documents · Calendrier · Messagerie · File WhatsApp  

**See:** your test leads and PDFs  

Also try: Sub-admin `subadmin@jacmotors.tn` · Under-admin `underadmin@jacmotors.tn` (same password)

---

### 10) CMS (Directus)
1. Open **/cms/admin/**
2. Same login  
3. Edit `site_settings` or `vehicles` → save → refresh public site  

**See:** live content change on the website  

---

### 11) n8n
1. Open **/n8n/**
2. Confirm workflows **active**: devis / visite / 360  

Webhooks:
- `/n8n/webhook/jac-devis`
- `/n8n/webhook/jac-visite`
- `/n8n/webhook/jac-360`

---

### 12) Database + health
1. Open **/api/health** → `ok: true`, DB counts  
2. Open **/db/** (Adminer)  
   - System: PostgreSQL  
   - Server: `postgres_app`  
   - User: `jac`  
   - Password: `jac_dev_change_me`  
   - Database: `jacmotors`  

**See:** tables `leads`, `clients`, `appointments`, `documents`  

---

## Quick links (copy)

| Step | URL |
|------|-----|
| **START /test** | https://fossil-triumph-harris-silence.trycloudflare.com/test |
| Home | https://fossil-triumph-harris-silence.trycloudflare.com/ |
| Devis | https://fossil-triumph-harris-silence.trycloudflare.com/devis |
| Messagerie | https://fossil-triumph-harris-silence.trycloudflare.com/messagerie?phone=99757218 |
| Visite | https://fossil-triumph-harris-silence.trycloudflare.com/visite |
| Modèles | https://fossil-triumph-harris-silence.trycloudflare.com/modeles |
| Check-up | https://fossil-triumph-harris-silence.trycloudflare.com/apres-vente#checkup |
| Showrooms | https://fossil-triumph-harris-silence.trycloudflare.com/showrooms |
| Admin | https://fossil-triumph-harris-silence.trycloudflare.com/admin |
| CMS | https://fossil-triumph-harris-silence.trycloudflare.com/cms/admin/ |
| n8n | https://fossil-triumph-harris-silence.trycloudflare.com/n8n/ |
| Health | https://fossil-triumph-harris-silence.trycloudflare.com/api/health |
| Auto test | https://fossil-triumph-harris-silence.trycloudflare.com/api/demo/test-all?run=1 |
| DB | https://fossil-triumph-harris-silence.trycloudflare.com/db/ |

---

## CLI tests (optional, on the server)

```bash
npm run test:quick          # API + messages + build
npm run test:e2e:messagerie # browser devis → messagerie
npm run test:all            # full suite + audit
```

---

## What “done” looks like

- [ ] `/test` auto test all green  
- [ ] Devis → Messagerie ACK + PDF  
- [ ] Meet / 360 / check-up messages visible  
- [ ] Admin shows leads + documents  
- [ ] CMS edit reflects on site  
- [ ] n8n workflows active  
- [ ] Health + Adminer OK  

**Remember:** demo only. Real WhatsApp to the client number comes after Cloud API tokens.
