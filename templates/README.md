# Industry Templates

Pre-built schema files for common business use cases. Each template is a drop-in replacement for `schema.config.json`.

## Available Templates

| Template | File | Entities | Best For |
|----------|------|----------|----------|
| **CRM** | `template-crm.json` | Contacts, Companies, Deals, Activities | Sales teams, client management, pipeline tracking |
| **Construction** | `template-construction.json` | Projects, Contractors, Materials, Milestones, Invoices | General contractors, project managers, builders |
| **Inventory** | `template-inventory.json` | Products, Warehouses, Stock Movements, Suppliers | Warehousing, e-commerce ops, supply chain |
| **Finance** | `template-finance.json` | Accounts, Transactions, Budgets, Reports | Bookkeeping, budgeting, financial reporting |
| **HR** | `template-hr.json` | Employees, Departments, Leave Requests, Reviews | People ops, small-to-mid HR departments |

## How to Use

1. Pick a template and copy it to the project root as `schema.config.json`:

```bash
cp templates/template-construction.json schema.config.json
```

2. Restart the stack so Prisma regenerates the database schema:

```bash
docker compose down && docker compose up
```

3. Log in at http://localhost:5173 with `admin` / `admin123` and you're ready to go.

## Seed Data

Each template has a companion seed file in `seed/` with 5-8 realistic records per entity. These are reference data you can use to populate your dashboard for demos or testing.

| Template | Seed File |
|----------|-----------|
| CRM | `seed/seed-crm.json` |
| Construction | `seed/seed-construction.json` |
| Inventory | `seed/seed-inventory.json` |
| Finance | `seed/seed-finance.json` |
| HR | `seed/seed-hr.json` |

## Customizing

Templates are standard `schema.config.json` files. You can:

- Add, remove, or rename entities
- Change field types (`string`, `text`, `number`, `boolean`, `date`, `enum`)
- Modify enum options to match your terminology
- Set `"readOnly": true` on entities that should be view-only
- Set `"searchable": true` on fields to enable full-text search

See the [main README](../README.md) for full schema documentation.
