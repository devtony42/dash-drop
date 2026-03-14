# dash-drop — Backlog & Roadmap

> Schema-in. Dashboard-out. In under 60 seconds.

---

## 🗺️ Roadmap

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Core CRUD frontend (React + Vite) | ✅ Done | Dynamic table, forms, search, filters, pagination |
| 2 | Express REST API with Prisma | ✅ Done | Auto-generated routes per entity, coercion, validation |
| 3 | Docker Compose full-stack wiring | ✅ Done | Postgres + API + client, one-command startup |
| 4 | CSV export | 🔄 In progress | Per-entity export respecting current filters/search |
| 5 | Role-based access control | ⬜ Backlog | See below |
| 6 | Industry templates | ⬜ Backlog | See below |
| 7 | Stripe / external API integration hooks | ⬜ Backlog | See below |
| 8 | Live demo on Render/Railway | ⬜ Backlog | See below |

---

## 📋 Backlog

### 🟢 Quick Wins (< 1 day each)

#### CSV Export ← **CURRENT**
- `GET /api/:entity/export?format=csv` endpoint — respects active search + filters
- "Export CSV" button in EntityView header
- Proper Content-Disposition header, RFC-4180 compliant output
- Handles all field types (dates formatted, booleans as True/False)

#### Column Visibility Toggle ✅ Done
- User can show/hide columns from the table
- State saved to localStorage per entity
- Useful for entities with many fields

#### Inline Validation Messages
- Surface server-side validation errors inline on form fields (red border + message)
- Client-side: mark required fields visually, validate before submit
- Currently errors only appear as a generic toast

#### Read-Only Entity Mode
- `"readOnly": true` flag in schema entity definition
- Hides Add/Edit/Delete buttons for that entity
- Useful for audit logs, imported data, reference tables

---

### 🟡 Medium Lift (1–3 days each)

#### Role-Based Access Control (RBAC)
- Config-defined users: `{ "username": "admin", "password": "...", "role": "admin" | "viewer" }`
- JWT-based session (or simple cookie)
- `viewer` role: read-only, no create/edit/delete
- `admin` role: full access
- Login page rendered by client
- Optional: per-entity role overrides (`"roles": ["admin"]`)

#### Entity Relationships (FK Support)
- Schema: `{ "name": "categoryId", "type": "relation", "entity": "Category" }`
- API: auto-join related entity on GET list/single
- UI: dropdown select populated from related entity on forms
- Display: show related record name (not just ID) in table

#### Bulk Actions
- Checkbox column in table
- "Delete selected" bulk action
- "Export selected" (subset of CSV export)
- Extensible action menu for future custom actions

#### Audit Log
- Optional per-entity: `"auditLog": true`
- Records who changed what and when (create/update/delete)
- Stored in a `_AuditLog` table, viewable as a read-only entity in the dashboard

---

### 🔵 Bigger Features (3–7 days each)

#### Industry Templates
Ship pre-built `schema.config.json` files that clients can drop in and go:
- `template-crm.json` — Contacts, Companies, Deals, Activities
- `template-construction.json` — Projects, Contractors, Materials, Milestones, Invoices
- `template-finance.json` — Accounts, Transactions, Budgets, Reports
- `template-inventory.json` — Products, Warehouses, Stock Movements, Suppliers
- `template-hr.json` — Employees, Departments, Leave Requests, Reviews
Each template ships with seed data. Stored in `templates/` directory.

#### Stripe / External API Integration Hooks
- Schema-level `"webhooks"` config block
- On record create/update/delete, fire configured webhook URLs
- Built-in Stripe integration: `"stripeSync": true` on entity auto-creates/updates Stripe Customer on Contact create
- Generic outbound webhooks (Zapier, Make, n8n compatible)

#### Live Demo on Render/Railway
- `render.yaml` / `railway.json` one-click deploy config
- Demo instance at `demo.dash-drop.dev` running CRM template
- "Deploy your own" button in README
- Free tier compatible (sleep on idle OK for demo)

#### Schema UI Builder
- Visual drag-and-drop schema editor in the dashboard
- Generate/edit `schema.config.json` without touching JSON
- Preview changes live before applying
- Export schema as downloadable file

---

## 💡 Ideas Parking Lot
- Dark/light mode toggle (CSS vars already wired, just needs a button)
- Markdown field type (rendered in table preview, full editor in form)
- File/image upload field type (S3-compatible storage backend)
- GraphQL API option alongside REST
- Plugin system for custom field types
- CLI: `npx dash-drop init` scaffolds a new project with template picker
- Multi-tenant: one instance, multiple schemas/databases

---

## 🏷️ Version Targets

| Version | Goal |
|---------|------|
| v0.1 | ✅ MVP — schema-driven CRUD, Docker, demo data |
| v0.2 | CSV export + inline validation + column toggle |
| v0.3 | RBAC + relationships |
| v0.4 | Industry templates + live demo |
| v1.0 | Stripe hooks + audit log + schema UI builder |
