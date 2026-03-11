# Sample schema.config.json

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
    },
    {
      "name": "Order",
      "fields": [
        { "name": "customerName", "type": "string", "required": true },
        { "name": "orderDate", "type": "date", "required": true },
        { "name": "products", "type": "list", "items": { "type": "Product" } }
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