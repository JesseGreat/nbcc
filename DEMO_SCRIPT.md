# NBCC Member Portal — 10-minute demo script

**Setup (before the meeting)**
- Laptop: open the admin portal (`https://admin.<domain>`) and sign in with **Super admin**. Go to **Settings → Reset demo data**.
- Phone: open the member portal (`https://<domain>`). Optional: "Add to Home Screen" to show it installs like an app.
- Keep the Paystack test card handy: `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.
- Mirror the phone screen (AirPlay, Quick Share or a camera) so the room can see it.

---

### 1. The member experience starts on a phone (0:00–3:00)

1. On the phone, open the landing page. Point out the NBCC branding, the tiers and fees, and the two calls to action.
2. Tap **Apply for membership**. Walk through the five steps:
   company details → Managing Director → representative (this becomes the login) → tier (fees shown) → documents.
   - Upload a CAC certificate (any PDF or a photo from the camera roll). Mention that files are checked on the phone
     *and* on the server (type and 5 MB limit).
3. Tick the confirmation box and tap **Submit application** → "Check your email".
4. Normally the applicant clicks the link in their inbox. For the demo, tap **Verify now (demo)**.
   → The applicant sees **"Your application is under review"** with a progress checklist.

> Talking point: no paper forms, no emailed attachments, works on any phone.

### 2. Approve it on the laptop through the admin subdomain (3:00–5:00)

1. On the laptop, the **Dashboard** shows *Pending approval* has gone up by one. Click it.
2. Open the new application. Show company details, contacts, reason for joining, and **View** the uploaded CAC certificate
   (opens through a secure, short-lived link).
3. Click **Approve** → confirm. A membership number such as `NBCC-2026-0021` is issued and the applicant is emailed.

> Talking point: three seeded applications are also waiting, so you can show **Reject** (a reason is required and emailed).

### 3. Pay with Paystack on the phone (5:00–7:00)

1. Back on the phone, refresh. The dashboard now says **"Activate your membership"** with a **Pay now** button.
2. Tap **Pay now** → Paystack checkout → pay with the test card.
3. The portal confirms **Payment successful**: membership active for 12 months, receipt number shown.
4. Tap **Download receipt** → branded PDF receipt. The same receipt arrived by email.

> Talking point: payments are verified server-to-server and through Paystack's signed webhook,
> so a membership can't be activated by tampering with the browser.

### 4. The admin dashboard updates (7:00–8:30)

1. On the laptop, refresh the **Dashboard**: active members and revenue this year have gone up, and the revenue-by-month chart includes today's payment.
2. Open **Members** and search for the new company. Show the member page: status, payments, documents and the **audit trail**
   (submitted → email confirmed → approved by you → payment received).
3. Open **Payments** → **Export CSV** for the finance team.
4. Open **Renewals**: members expiring in the next 90 days, with **Send reminder** per member or in bulk.
   Mention that reminders also go out automatically every day (from 90 days before expiry, every 30 days).

### 5. Send an announcement (8:30–10:00)

1. **Announcements → New announcement**. Title: "Welcome to our newest members". Choose **Active members only**.
   The live preview shows exactly what the email looks like, and the recipient count updates.
2. **Review and send** → confirm.
3. On the phone, open **News**: the announcement is already there.

**Close**: the same codebase becomes Phase 1. Next come the real tier fees, live Paystack keys, staff accounts,
then the Learning Management System (Phase 2) and the AI assistant (Phase 3) as new modules.

---

**If something goes wrong**
- Payment page stuck on "processing": tap **Check again**. The webhook usually completes it within seconds.
- Need a clean slate: **Settings → Reset demo data** (about a minute; staff logins are kept).
- Member quick login: `member@demo.nbcc.test` has an active membership with history, for showing receipts and the directory.
