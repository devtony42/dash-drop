# dash-drop

> Schema-in. Dashboard-out. In under 60 seconds.

**dash-drop** is a zero-config admin dashboard generator. Define your data model in a single JSON config file, run `docker compose up`, and get a fully functional CRUD dashboard with search, filtering, pagination, and API integration — no boilerplate required.

---

## Why dash-drop?

Most dashboard projects involve weeks of: table components, API wiring, form validation, state management, and deployment headaches. dash-drop collapses all of that into one config file and one command.

**It's the thing you build for clients that takes you 2 days instead of 2 months.**

---

## Quick Start

```bash
git clone https://github.com/devtony42/dash-drop.git
cd dash-drop
docker compose up
```

Open `http://localhost:3000`. That's it.

---

## How It Works

1. Define entities in `schema.config.json`
2. Run `docker compose up`
3. The server reads the config, generates a Prisma schema, syncs the database, and seeds demo data
4. The React dashboard dynamically renders tables, forms, and filters for each entity

Change the config, restart, new entity appears. No code changes needed.

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

Restart the server and your new entity appears with full CRUD, search, and filtering. No code changes.

### Field Types

| Type | Renders As | Description |
|------|-----------|-------------|
| `string` | Text input | Short text, supports `searchable: true` |
| `number` | Number input | Numeric values (integers or decimals) |
| `boolean` | Checkbox | True/false toggle |
| `date` | Date picker | Date selection |
| `enum` | Dropdown | Select from `options` array |
| `text` | Textarea | Multi-line text |

### Field Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Field name (camelCase) |
| `type` | string | One of the types above |
| `required` | boolean | Validate on create |
| `searchable` | boolean | Include in full-text search |
| `default` | any | Default value for new records |
| `options` | string[] | Options for `enum` type |

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 via Prisma |
| Deployment | Docker Compose |

---

## Project Structure

```
dash-drop/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Sidebar, EntityView, RecordForm, DeleteModal
│   │   ├── api.js       # API client
│   │   └── App.jsx      # Main app shell
│   └── Dockerfile
├── server/              # Express API
│   ├── src/
│   │   ├── index.js         # API server with dynamic CRUD routes
│   │   ├── generate-prisma.js  # Schema config to Prisma schema generator
│   │   └── seed.js          # Demo data seeder
│   ├── entrypoint.sh    # Docker startup script
│   └── Dockerfile
├── prisma/              # Generated Prisma schema (gitignored)
├── docs/                # GitHub Pages site
├── docker-compose.yml
├── schema.config.json   # Your entity definitions
└── .env.example
```

---

## API

Each entity gets automatic REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/{entity}` | List with pagination, search, sort, filter |
| `GET` | `/api/{entity}/:id` | Get single record |
| `POST` | `/api/{entity}` | Create record |
| `PUT` | `/api/{entity}/:id` | Update record |
| `DELETE` | `/api/{entity}/:id` | Delete record |
| `GET` | `/api/schema` | Get schema config (used by frontend) |

### Query Parameters

- `page` — Page number (default: 1)
- `limit` — Records per page (default: 10, max: 100)
- `search` — Full-text search across searchable fields
- `sortBy` — Field to sort by (default: id)
- `sortOrder` — `asc` or `desc` (default: desc)
- `filter_{fieldName}` — Filter by specific field value

---

## Screenshots

<!-- Screenshots will be added after first deployment -->
*Coming soon*

---

## Use Cases

- Construction job tracking dashboards
- Financial analytics panels
- E-commerce admin backends
- Case management systems (nonprofits, childcare)
- Any client project that needs data to UI fast

---

## Roadmap

- [x] Schema-driven entity definitions
- [x] Core CRUD frontend (React + Vite)
- [x] Express REST API with Prisma
- [x] Docker Compose setup
- [x] Dark/light mode
- [ ] Role-based access control
- [ ] Industry templates (construction, finance, CRM)
- [ ] Stripe / external API integration hooks
- [ ] GitHub Pages live demo

---

## License

MIT — use it, sell it, build on it.

---

*Built by [Tony Goggin](https://tonygoggin.com) · Powered by Ada*
