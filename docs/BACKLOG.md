# dash-drop — Backlog & Roadmap

> Schema-in. Dashboard-out. In under 60 seconds.

---

## Version Targets

| Version | Goal |
|---------|------|
| v0.1 | MVP — schema-driven CRUD, Docker, demo data |
| v0.2 | CSV export + inline validation + column toggle + read-only mode |
| v0.3 | RBAC + relationships (v2 architecture) |
| v0.4 | Industry templates + audit log + CI |
| v0.5 | Live demo + entity relationships + bulk actions |
| v1.0 | Stripe hooks + schema UI builder + password reset |

---

## Roadmap

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Core CRUD frontend (React + Vite) | ✅ Done | Dynamic table, forms, search, filters, pagination |
| 2 | Express REST API with Prisma | ✅ Done | Auto-generated routes per entity, coercion, validation |
| 3 | Docker Compose full-stack wiring | ✅ Done | Postgres + API + client, one-command startup |
| 4 | CSV export | ✅ Done | Per-entity export respecting current filters/search |
| 5 | Column visibility toggle | ✅ Done | Per-entity localStorage persistence |
| 6 | Inline validation messages | ✅ Done | Client-side required + server error mapping |
| 7 | Read-only entity mode | ✅ Done | `readOnly: true` schema flag hides CRUD buttons |
| 8 | JWT auth + RBAC | ✅ Done | Login, Admin/Editor/Viewer roles, protected routes, role-aware UI |
| 9 | Industry templates | ✅ Done | 5 templates + seed data in `templates/` |
| 10 | Audit log | ✅ Done | `auditLog: true` schema flag, read-only _AuditLog entity in dashboard |
| 11 | CI workflow + Vitest test suites | ✅ Done | Server + client test suites, GitHub Actions |
| 12 | Render.com one-click deploy | ✅ Done | `render.yaml` wires DB + API + static client |
| 13 | Entity relationships (FK support) | 🔲 Next | See below — highest value unlock |
| 14 | Live demo on Render | 🔲 Quick win | render.yaml is done, just needs deploying |
| 15 | Bulk actions | 🔲 Backlog | Checkbox select + delete/export selected |
| 16 | Stripe / external webhook hooks | 🔲 Backlog | Schema-level webhook config |
| 17 | Schema UI builder | 🔲 v1.0 | Visual drag-and-drop schema editor |
| 18 | Password reset / user management UI | 🔲 Backlog | Admin panel for managing users |
| 19 | Per-entity role overrides | 🔲 Backlog | RBAC remaining: entity-level access control |
| 20 | `integer` field type fix | 🔲 Bug | generate-prisma maps `integer` → `Int` but crud.js coerces with `parseFloat` — should be `parseInt` |
| 21 | Dark mode toggle (client) | ✅ Done | Fully shipped — ThemeProvider, toggle button, CSS vars, Tailwind `darkMode: 'class'` all in place |
| 22 | `displayName` support in UI | ✅ Done | `label`/`labelLower`/`labelPlural` derived from `displayName` — used in all UI strings |
| 23 | `npx dash-drop init` CLI scaffolder | 🔲 Ideas | Template picker + project scaffold via npx |
| 24 | Markdown field type | 🔲 Ideas | Rendered preview in table, full editor in form |
| 25 | File/image upload field type | 🔲 Ideas | S3-compatible storage backend |
| 26 | GraphQL API option | 🔲 Ideas | Alongside REST |
| 27 | Multi-tenant support | 🔲 Ideas | One instance, multiple schemas/databases |

---

## Priority Queue (what to do next)

### 🔴 P0 — Do First
**Entity Relationships (FK Support)**
Real-world schemas hit a wall without this. Every industry template has implicit FKs (Deal → Contact, Invoice → Project, etc.) that are currently unlinked.
- Schema: `{ "name": "contactId", "type": "relation", "entity": "Contact" }`
- API: auto-join on GET list/single, include related record in response
- UI: dropdown select from related entity on forms; show related name (not raw ID) in table
- Prisma: generate proper `@relation` fields in schema

### 🟡 P1 — High Value, Low Effort

**Deploy the Live Demo**
`render.yaml` is already merged. This is just: push to Render, get a URL, add screenshot to README.
- Target URL: `demo.dash-drop.dev` (or whatever Render gives)
- Swap README "Deploy to Render" button to point to the real demo
- Add screenshots (the single highest-impact README improvement)

**Bug Fix: `integer` type coercion**
`generate-prisma.js` maps `integer` → Prisma `Int`, but `crud.js:buildWhereClause` uses `parseFloat`. Small fix, correctness matters.

**Per-entity role overrides**
RBAC is in place at the global level. Per-entity `"roles": { "create": ["admin"], "read": ["viewer", "editor", "admin"] }` is a natural extension that clients will ask for.

### 🟠 P2 — Medium Lift

**Bulk Actions**
- Checkbox column in table
- "Delete selected" + "Export selected" bulk actions
- Extensible action menu for future custom actions

**User Management UI**
Currently users are seeded. Need an admin panel to create/reset/delete users. The register endpoint exists (`POST /api/auth/register`) — just needs a frontend.

**Password Reset**
Mentioned in RBAC "remaining" notes. Needs: forgot password flow, email delivery (or at least admin reset).

**`displayName` + `icon` usage audit**
Schema supports `displayName` and `icon` on entities. Audit whether the client actually uses `displayName` in the sidebar/page titles vs just `name`.

### 🟢 P3 — Future / Ideas Parking

**Stripe / External Webhook Hooks**
Schema-level `"webhooks"` config block. On create/update/delete, fire configured URLs. Built-in Stripe Customer sync option.

**Schema UI Builder**
Visual drag-and-drop schema editor. Generate/edit `schema.config.json` without touching JSON. Preview changes live. This is a product differentiator.

**`npx dash-drop init` CLI**
Scaffolds a new project with template picker. Lowers the barrier from "clone and edit" to "npx and go."

**Markdown field type**
Rendered in table preview, full editor in form.

**File/image upload field type**
S3-compatible storage backend (Cloudflare R2 / AWS S3).

**GraphQL API option**
Alongside REST for power users.

**Multi-tenant**
One instance, multiple schemas/databases.

---

## Bugs & Technical Debt

| # | Issue | Priority |
|---|-------|----------|
| 1 | `integer` field type uses `parseFloat` in filter coercion — should be `parseInt` | ✅ Fixed (PR #11) |
| 2 | `JWT_SECRET` defaults to `'dev-secret-change-me'` — warning in logs would help | ✅ Fixed (PR #12) |
| 3 | `POST /api/auth/register` is open in dev — should require admin auth in prod | ✅ Fixed (PR #13) |
| 4 | Vitest tests use CJS bridge (`createRequire`) — migrate server to ESM or add proper vitest CJS config | P3 |
| 5 | No `.env.example` — server silently starts with missing vars | ✅ Fixed (PR #16) — `.env.example` added with all vars documented; README Quick Start updated |

---

## Dev Workflow Notes
- **PR merge strategy: `--squash` ✅** All PRs merged to `main` via squash. One commit per PR, clean linear history. Decided 2026-03-17.
- **Test command:** `cd server && npm test` (Vitest)
- **Local start:** `docker compose up` from repo root

---

## Ideas Parking Lot
*(Unscored — potential future backlog items)*
- Per-field sort direction icons in table header
- Saved filter presets (bookmark a filter combination)
- Dashboard summary cards (counts per entity, recent activity)
- Activity feed widget using audit log data
- Embeddable widget mode (iframe-safe, for client portals)
- Export to Excel (`.xlsx`) in addition to CSV
- Import from CSV (bulk create)
- Schema versioning (migration awareness when schema changes)
- Public read-only share links for specific entity views
