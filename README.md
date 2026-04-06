# NOC Key Tracker

A full-stack key management system for Network Operations Centres.  
Built with **Next.js 14**, **Supabase**, and deployable to **Vercel** in minutes.

---

## Features

- ✅ Dashboard with live stats, overdue alerts, recent activity timeline
- ✅ Active Keys — real-time duration tracking, overdue highlighting, one-click return
- ✅ Log History — full searchable/filterable audit trail
- ✅ Sites — per-basestation key status and visit history
- ✅ Engineers — per-engineer usage stats and average durations
- ✅ Check Out & Return modals with form validation
- ✅ All data persisted in Supabase (PostgreSQL)

---

## Step 1 — Set up the Supabase Database

1. Go to **https://supabase.com/dashboard** → open your project
2. Click **SQL Editor** in the left sidebar
3. Paste the entire contents of `supabase-schema.sql` and click **Run**
4. This creates the `key_records` table and seeds it with the logbook data

---

## Step 2 — Deploy to Vercel

### Option A: Via GitHub (recommended)

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/noc-key-tracker.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** → **New Project** → import your GitHub repo

3. During setup, add these **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://wwygnfeompwewxmullsl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Click **Deploy** — done! Vercel gives you a live URL.

### Option B: Via Vercel CLI

```bash
npm install -g vercel
cd noc-key-tracker
npm install
vercel
# Follow the prompts, add env vars when asked
```

---

## Step 3 — Run Locally (optional)

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
noc-key-tracker/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles + CSS variables
│   ├── page.tsx            # Redirect to /dashboard
│   ├── dashboard/          # Dashboard page
│   ├── active/             # Active keys page
│   ├── history/            # Log history page
│   ├── sites/              # Sites page
│   └── engineers/          # Engineers page
├── components/
│   ├── AppShell.tsx        # Sidebar wrapper
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── Topbar.tsx          # Top header + checkout button
│   ├── CheckoutModal.tsx   # Check-out form
│   ├── CheckinModal.tsx    # Return form
│   ├── StatCard.tsx        # Metric card
│   ├── Badge.tsx           # Status badges
│   └── Avatar.tsx          # Engineer initials avatar
├── lib/
│   ├── supabase.ts         # Supabase client + types
│   └── utils.ts            # Duration, formatting helpers
├── supabase-schema.sql     # Run this in Supabase SQL Editor
├── .env.local              # Local env vars (not committed)
└── .env.example            # Template for Vercel env vars
```

---

## Database Schema

```sql
key_records (
  id            BIGSERIAL PRIMARY KEY,
  site_id       TEXT NOT NULL,        -- e.g. "P0132"
  engineer_name TEXT NOT NULL,        -- e.g. "Eddie H"
  date_out      DATE NOT NULL,        -- e.g. "2026-04-06"
  time_out      TIME NOT NULL,        -- e.g. "07:21"
  date_in       DATE,                 -- null = still out
  time_in       TIME,                 -- null = still out
  notes         TEXT,                 -- optional remarks
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Future Enhancements

- 🔐 Supabase Auth — login for NOC Analysts vs Engineers
- 📱 PWA / mobile-optimised engineer self-checkout
- 🔔 Email/SMS alerts for overdue keys (Supabase Edge Functions)
- 📊 Export to CSV/PDF reports
- 🔍 QR code scanning on key tags
