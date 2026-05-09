# Startuplab Jobs

Self-hosted clone of jobs.startuplab.no — aggregates open positions from Startuplab portfolio companies' ATS systems.

Replaces Getro for the core use case (aggregated job board across portfolio).

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **PostgreSQL** + Drizzle ORM
- **ATS adapters**: Teamtailor, Workable, BambooHR, Jobylon, Greenhouse, Lever, manual
- **Deploy**: Railway (Next.js + managed Postgres + cron)

## How it works

1. `data/companies.json` is the source of truth — each entry specifies a company and which ATS to pull from.
2. `POST /api/sync` (auth: `Authorization: Bearer $SYNC_SECRET`) seeds companies and pulls jobs from every ATS adapter.
3. Public pages (`/`, `/jobs/[id]`, `/companies`, `/companies/[slug]`) read from Postgres.
4. Run sync on a schedule via Railway cron (every 1–6 hours).

Apply buttons link out to the original ATS — no application data is collected here. UTM parameters are stripped.

## Adding a company

Edit `data/companies.json`:

```json
{
  "slug": "acme",
  "name": "Acme",
  "website": "https://acme.com",
  "atsType": "teamtailor",
  "atsConfig": { "subdomain": "acme" }
}
```

Adapter config keys:
- `teamtailor`: `{ "subdomain": "acme" }` → `https://acme.teamtailor.com`
- `workable`: `{ "account": "acme" }`
- `bamboohr`: `{ "subdomain": "acme" }`
- `jobylon`: `{ "companyId": "acme" }`
- `greenhouse`: `{ "board": "acme" }`
- `lever`: `{ "site": "acme" }`
- `manual`: `{ "jobs": [{ "externalId": "...", "title": "...", "applyUrl": "...", "location": "..." }] }`

After editing, re-deploy or hit `/api/sync`.

## Local dev

```bash
cp .env.example .env  # edit DATABASE_URL + SYNC_SECRET
npm install
npm run db:push       # create tables
npm run sync          # seed companies + pull jobs
npm run dev
```

## Deploy to Railway

1. Push repo to GitHub
2. Create Railway project, add Postgres plugin → exposes `DATABASE_URL`
3. Add web service from this repo, set env vars: `DATABASE_URL`, `SYNC_SECRET`
4. After first deploy, run once: `npm run db:push && npm run sync` (Railway shell)
5. Add a Cron service (or Railway "scheduled command") that hits:
   ```
   curl -X POST -H "Authorization: Bearer $SYNC_SECRET" https://YOUR_DOMAIN/api/sync
   ```
   Recommended cadence: every 2 hours.

## Cost

- Railway: ~$5–10/mo (web + Postgres on hobby plan)
- ATS API calls: free
- Replaces Getro pricing entirely

## Roadmap

- Talent network (candidate sign-up, job alerts) — kept out of MVP
- Admin UI for editing companies in browser
- More ATS adapters (Personio, Recruitee, Homerun, Freshteam)
- RSS / JSON feed for embedding elsewhere
