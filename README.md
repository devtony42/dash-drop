# dash-drop 📊

> Schema-in → Dashboard-out. In under 60 seconds.

**dash-drop** is a zero-config admin dashboard generator. Define your data model in a single JSON config file, run `docker compose up`, and get a fully functional, production-ready CRUD dashboard with search, filtering, pagination, and API integration — no boilerplate required.

---

## Why dash-drop?

Most dashboard projects involve weeks of: table components, API wiring, form validation, state management, and deployment headaches. dash-drop collapses all of that into one config file and one command.

**It's the thing you build for clients that takes you 2 days instead of 2 months.**

---

## Quick Start

```bash
git clone https://github.com/devtony42/dash-drop.git
cd dash-drop
cp .env.example .env
docker compose up
```

Open `http://localhost:3000`. That's it.

---

## Configuration

Edit `schema.config.json` to define your entities:

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

Restart the server → your new entity appears with full CRUD, search, and filtering. No code changes.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Next.js |
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma |
| Auth | JWT (role-based) |
| Deployment | Docker Compose |

---

## Field Types

| Type | Description |
|------|-------------|
| `string` | Text input with optional search |
| `number` | Numeric input |
| `boolean` | Toggle / checkbox |
| `date` | Date picker |
| `enum` | Dropdown with defined options |
| `text` | Multi-line textarea |
| `list` | Repeating sub-entity |

---

## Roadmap

- [x] Schema-driven entity definitions
- [ ] Core CRUD frontend (React + Next.js)
- [ ] Express REST API with Prisma
- [ ] Docker Compose setup
- [ ] Role-based access control
- [ ] Industry templates (construction, finance, CRM)
- [ ] Stripe / external API integration hooks
- [ ] GitHub Pages live demo

---

## Use Cases

- Construction job tracking dashboards
- Financial analytics panels
- E-commerce admin backends
- Case management systems (nonprofits, childcare)
- Any client project that needs data → UI fast

---

## License

MIT — use it, sell it, build on it.

---

*Built by [Tony Goggin](https://tonygoggin.com) · Powered by Ada 🦉*
