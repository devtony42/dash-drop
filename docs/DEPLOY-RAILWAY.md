# Deploying dash-drop to Railway

> Get a live demo URL for Upwork/Freelancer profiles and chooseyourownapp.com catalog.

## Architecture on Railway

Two services in one project:
| Service | Source | Port |
|---------|--------|------|
| `dash-drop-server` | `server/` Dockerfile | 3001 |
| `dash-drop-client` | `client/` Dockerfile | 3000 |
| PostgreSQL | Railway plugin | 5432 |

## Pre-Flight Checklist

- [ ] PRs #2, #3, #4 merged to `main`
- [ ] Railway account created (free tier — $5/mo credit)
- [ ] `schema.config.json` has demo-quality data (construction or e-commerce schema)

## Step 1 — Fix schema.config.json copy for Railway

The server Dockerfile needs `schema.config.json` baked in (not mounted). Add to `server/Dockerfile`:

```dockerfile
# Add after the COPY . . line:
COPY ../schema.config.json /app/schema.config.json
```

Or simpler: copy `schema.config.json` into `server/` at build time via a CI step.

**Recommended:** Add a `SCHEMA_PATH` env var override so Railway can point to a different schema than local dev.

## Step 2 — Create Railway project

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select `devtony42/dash-drop`
3. Add a **PostgreSQL** plugin to the project
4. Railway auto-sets `DATABASE_URL` — entrypoint.sh will pick it up

## Step 3 — Deploy Server service

Settings → Source: `server/` directory → Dockerfile  
Environment variables:
```
DATABASE_URL    = (auto-set by Railway PostgreSQL plugin)
PORT            = 3001
SCHEMA_PATH     = /app/schema.config.json
NODE_ENV        = production
```

Railway will expose a public URL like `https://dash-drop-server-production.up.railway.app`

## Step 4 — Deploy Client service

Settings → Source: `client/` directory → Dockerfile  
Environment variables:
```
VITE_API_URL = https://dash-drop-server-production.up.railway.app
```

⚠️ `VITE_API_URL` is baked in at build time — must be set before the first deploy.  
The client Dockerfile currently uses `vite dev` (not `vite build`) — update for production:

```dockerfile
# Replace CMD in client/Dockerfile with:
RUN npm run build
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
```
Also add `serve` to `client/package.json` devDependencies: `"serve": "^14.2.0"`

## Step 5 — Custom domain (optional)

Point `demo.chooseyourownapp.com` → Railway client service via CNAME.  
Or use Railway's generated URL directly in profiles.

## Demo Schema Recommendation

Use a construction-themed schema for maximum Upwork appeal:

```json
{
  "entities": [
    { "name": "Project", "fields": [...] },
    { "name": "Client", "fields": [...] },
    { "name": "WorkOrder", "fields": [...] },
    { "name": "Invoice", "fields": [...] },
    { "name": "AuditLog", "readOnly": true, "fields": [...] }
  ]
}
```

This shows: CRUD, enums, dates, booleans, read-only entity — all key features in one demo.

## Cost

Railway free tier: ~$5 credit/month  
Estimated usage for this app: ~$1-2/month (minimal traffic)  
Effectively **free** for a demo/portfolio app.

## TODO Before Deploying

- [ ] Update `client/Dockerfile` for production build (see Step 4)
- [ ] Pick demo schema (construction recommended)
- [ ] Update `server/Dockerfile` COPY for schema.config.json
- [ ] Tony approves go-live

---
*Prepared by Ada — 2026-03-15*
