# Startuplab Jobs

Self-hosted clone of jobs.startuplab.no — aggregates open positions from Startuplab portfolio companies' ATS systems.

Replaces Getro for the core use case (aggregated job board across portfolio).

Live: https://startuplab-jobs.startuplab.workers.dev

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Cloudflare Workers** via [@opennextjs/cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)
- **D1** (SQLite at edge) for jobs + companies, via Drizzle ORM
- **Northbase (Neon Postgres)** for canonical Startuplab portfolio data, read via `@neondatabase/serverless` HTTP driver
- **ATS adapters**: Teamtailor, Workable, BambooHR, Jobylon, Greenhouse, Lever, manual

## How it works

1. **Northbase (`sl_startups`)** is the canonical source of every company ever connected to Startuplab (~590, alumni included). The sync mirrors them into D1.
2. **`src/lib/ats-configs.ts`** maps slugs to ATS configuration — only the subset of companies whose jobs we actually fetch.
3. **`POST /api/sync`** (auth: `Authorization: Bearer $SYNC_SECRET`) pulls from Northbase, runs adapters, upserts into D1.
4. Public pages read from D1.

Apply buttons link out to the original ATS — no application data is collected here. UTM parameters are stripped.

## Adding/updating a company

Edit `src/lib/ats-configs.ts`:

```ts
acme: { atsType: "teamtailor", atsConfig: { subdomain: "acme" } }
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
npm install
npx wrangler d1 migrations apply startuplab-jobs --local  # apply migrations to local D1
npm run dev                                                # next dev (D1 binding NOT available; Northbase requires NORTHBASE_DATABASE_URL env)
# or:
npm run preview                                            # full Workers runtime via wrangler dev
```

## Deploy

```bash
npm run deploy   # opennextjs-cloudflare build + deploy
```

Secrets are set via `wrangler secret put SYNC_SECRET` and `wrangler secret put NORTHBASE_DATABASE_URL`.

After schema changes:
```bash
npm run db:generate            # writes drizzle/*.sql
npm run db:migrate-remote      # applies to remote D1
```

## Cron

Cloudflare Workers cron isn't wired in yet — to schedule sync, either:
- add a `triggers.crons` block + `scheduled` handler in a custom worker entry, or
- run a curl from any external scheduler.

## Cost

- Cloudflare Workers free tier (100k req/day) handles this comfortably.
- D1 free tier: 5GB storage, 5M reads/day, 100k writes/day.
- ATS API calls: free.

## Roadmap

- Talent network (candidate sign-up, job alerts) — kept out of MVP
- Admin UI for editing companies in browser
- More ATS adapters (Personio, Recruitee, Homerun, Freshteam)
- RSS / JSON feed for embedding elsewhere
