# dash-drop — Backlog & Roadmap

> Schema-in. Dashboard-out. In under 60 seconds.

---

## Roadmap

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Core CRUD frontend (React + Vite) | Done | Dynamic table, forms, search, filters, pagination |
| 2 | Express REST API with Prisma | Done | Auto-generated routes per entity, coercion, validation |
| 3 | Docker Compose full-stack wiring | Done | Postgres + API + client, one-command startup |
| 4 | CSV export | Done | Per-entity export respecting current filters/search |
| 5 | Column visibility toggle | Done | Per-entity localStorage persistence |
| 6 | Inline validation messages | Done | Client-side required + server error mapping |
| 7 | Read-only entity mode | Done | `readOnly: true` schema flag hides CRUD buttons |
| 8 | JWT auth + RBAC | Done | Login, Admin/Editor/Viewer roles, protected routes, role-aware UI |
| 9 | Industry templates | Done | 5 templates + seed data in `templates/` |
| 10 | Stripe / external API integration hooks | Backlog | See below |
| 11 | Live demo on Render/Railway | Backlog | See below |

---

## Backlog

### Quick Wins (< 1 day each)

#### CSV Export — DONE
- `GET /api/:entity/export` endpoint — respects active search + filters
- "Export CSV" button in EntityList header
- Proper Content-Disposition header, RFC-4180 compliant output
- Handles all field types (dates formatted, booleans as True/False)

#### Column Visibility Toggle — DONE
- User can show/hide columns from the table
- State saved to localStorage per entity (`dash-drop-cols-${entity.name}`)
- Useful for entities with many fields

#### Inline Validation Messages — DONE
- Client-side required field validation with red border + error message
- Server-side errors mapped back to individual fields
- Errors clear on field change

#### Read-Only Entity Mode — DONE
- `"readOnly": true` flag in schema entity definition
- Hides Add/Edit/Delete buttons for that entity
- Useful for audit logs, imported data, reference tables

---

### Medium Lift (1–3 days each)

#### Role-Based Access Control (RBAC) — DONE
- JWT-based authentication with bcrypt passwords
- Three roles: Admin (full access), Editor (read + write), Viewer (read-only)
- Login page with demo credentials
- Protected API routes with role-based authorization
- Remaining: per-entity role overrides, password reset

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

### Bigger Features (3–7 days each)

#### Industry Templates — DONE
Ship pre-built `schema.config.json` files that clients can drop in and go:
- `template-crm.json` — Contacts, Companies, Deals, Activities
- `template-construction.json` — Projects, Contractors, Materials, Milestones, Invoices
- `template-inventory.json` — Products, Warehouses, Stock Movements, Suppliers
- `template-finance.json` — Accounts, Transactions, Budgets, Reports
- `template-hr.json` — Employees, Departments, Leave Requests, Reviews
Each template ships with seed data (5-8 records per entity). Stored in `templates/` directory with companion `seed/` files.

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

## Dev Workflow Notes
- **PR merge strategy:** Consider switching from `--merge` to `--squash` for cleaner linear history (discussed 2026-03-16). Current `--merge` creates slightly noisy duplicate commits in history. One commit per PR is easier to bisect. Decision pending.

---

## Ideas Parking Lot
- Markdown field type (rendered in table preview, full editor in form)
- File/image upload field type (S3-compatible storage backend)
- GraphQL API option alongside REST
- Plugin system for custom field types
- CLI: `npx dash-drop init` scaffolds a new project with template picker
- Multi-tenant: one instance, multiple schemas/databases

---

## Version Targets

| Version | Goal |
|---------|------|
| v0.1 | MVP — schema-driven CRUD, Docker, demo data |
| v0.2 | CSV export + inline validation + column toggle + read-only mode |
| v0.3 | RBAC + relationships (v2 architecture) |
| v0.4 | Industry templates + live demo |
| v1.0 | Stripe hooks + audit log + schema UI builder |
