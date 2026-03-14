# CRUD Dashboard Template — Product Spec

## Overview
Universal admin dashboard template that can be customized for any data domain.
Target market: Upwork clients needing inventory, CRM, order tracking, or any data management UI.
Price range: $300-1500 per customization.

## Tech Stack
- **Frontend:** React 18 + Vite + TailwindCSS + shadcn/ui
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL (swappable via Prisma)
- **Auth:** JWT + bcrypt (simple, no OAuth dependency)
- **Deploy:** Docker Compose (one-click)

## Core Features (MVP)
1. **Dynamic schema definition** — JSON config defines entities, fields, relationships
2. **Auto-generated CRUD UI** — List/Create/Edit/Delete views from schema
3. **Search & filter** — Text search + column filters on any field
4. **Pagination** — Server-side, configurable page size
5. **Auth & roles** — Admin / Editor / Viewer roles
6. **CSV export** — Download filtered data as CSV
7. **Responsive** — Mobile-friendly sidebar layout
8. **Dark mode** — Toggle, persisted in localStorage

## Schema Config Example
```json
{
  "entities": [
    {
      "name": "Product",
      "fields": [
        { "name": "name", "type": "string", "required": true, "searchable": true },
        { "name": "price", "type": "number", "required": true },
        { "name": "category", "type": "enum", "options": ["Electronics", "Clothing", "Food"] },
        { "name": "inStock", "type": "boolean", "default": true },
        { "name": "description", "type": "text" }
      ]
    }
  ]
}
```

## Directory Structure
```
crud-dashboard/
├── client/          # React frontend
├── server/          # Express API
├── prisma/          # Schema + migrations
├── docker-compose.yml
├── schema.config.json  # Entity definitions
├── README.md
└── .env.example
```

## Success Criteria
- `docker compose up` → working dashboard in <60s
- Change schema.config.json → restart → new entity appears
- Clean, professional UI suitable for client demos
- README with screenshots and customization guide

## IP Note
This is our core template IP. Client deliveries get customized forks.
Clean-room rule: no client-specific code in the template repo.
