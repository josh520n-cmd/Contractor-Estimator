# Contractor Estimator

Minimal Next.js contractor estimator. Features:

- Itemized materials list
- Labor hours and rate
- Waste buffer, overhead, profit calculations
- Printable quote / save as PDF via browser print

Quick start

Requirements: Node 18 (recommended). Use nvm or your preferred Node version manager.

```bash
# use Node 18 (if you have nvm)
nvm install 18
nvm use 18

npm install
npm run dev
```

Open http://localhost:3000

Notes:
- The project prefers `better-sqlite3` for persistence. If `better-sqlite3` cannot be built on your machine (native compile), the app will fall back to a simple JSON-backed store (`data/db.json`) for local development and tests.
- CI uses Node 18, see `.github/workflows/ci.yml`.

**Database Fallback (Vercel/No Database):**
- When no database is connected, all data (estimates, templates, presets) automatically saves to your device using localStorage
- Data persists across sessions and is safely stored
- Migration to Supabase will happen automatically when available
- See [LOCALSTORAGE_FALLBACK.md](LOCALSTORAGE_FALLBACK.md) for details

# Contractor-Estimator
A contract estimator
