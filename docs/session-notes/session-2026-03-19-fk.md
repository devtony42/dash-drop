# Session: Entity Relationships (FK Support) — 2026-03-19

## Goal
Implement P0 feature for v0.5: entity relationships via a new `relation` field type.

## What was built

### 1. Schema syntax (`schema.config.json`)
New field type `"relation"` with `entity` and `displayField` properties:
```json
{ "name": "contactId", "type": "relation", "entity": "Contact", "displayField": "name" }
```
Applied to CRM template: Deal → Contact, Activity → Contact.

### 2. Prisma schema generator (`server/src/generate-prisma.js`)
- Maps `type: "relation"` → Prisma `@relation(fields: [fk], references: [id])` + `Int` FK column
- Two-pass approach: first collects reverse relations, then emits models with back-reference arrays
- Simple pluralization for back-ref names (y→ies, otherwise +s)

### 3. API (`server/src/routes/crud.js`)
- `buildInclude()` generates Prisma `include` map from relation fields
- GET list and GET single auto-join related entities via include
- CREATE/UPDATE return included relation data
- New `/options` endpoint: lightweight record list for dropdown population (select: id + scalar fields)
- Relation FK coerced to `parseInt` in where clause and body parsing

### 4. Client UI
- **EntityForm**: fetches options from `/options` endpoint per relation field, renders `<Select>` dropdown with displayField as label
- **EntityList**: `formatValue()` reads included relation object to show displayField instead of raw FK integer; column headers strip "Id" suffix

### 5. Construction template
Updated with 4 relation fields:
- Milestone.projectId → Project
- Invoice.projectId → Project
- Invoice.contractorId → Contractor
- Material.projectId → Project

### 6. Tests
7 new server-side tests covering:
- `buildInclude()` for entities with/without relations
- Auto-join on GET list and GET single
- Integer coercion on POST/PUT for relation FK
- FK filter on GET list
- `/options` endpoint select behavior

All 33 tests pass.

## Key decisions
- FK field naming convention: `{relationName}Id` (e.g., `contactId`)
- Options endpoint is unpaginated (suitable for reasonable entity counts)
- Back-references emitted in Prisma schema for bidirectional queries
- CSV export uses raw FK values (no join) to keep exports simple

## Files changed
- `schema.config.json` — relation fields in CRM schema
- `server/src/generate-prisma.js` — relation → Prisma mapping
- `server/src/routes/crud.js` — auto-join, /options, FK coercion
- `client/src/lib/api.js` — `listOptions()` helper
- `client/src/components/EntityForm.jsx` — relation dropdown
- `client/src/pages/EntityList.jsx` — relation display in table
- `templates/template-construction.json` — FK examples
- `server/src/__tests__/crud.test.js` — relation tests
- `prisma/schema.prisma` — regenerated with relations
