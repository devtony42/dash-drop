const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const SCHEMA_PATH =
  process.env.SCHEMA_PATH ||
  path.resolve(__dirname, "../../schema.config.json");

app.use(cors());
app.use(express.json());

// Load schema config
const schemaConfig = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));

// Serve schema config to the frontend
app.get("/api/schema", (_req, res) => {
  res.json(schemaConfig);
});

// Coerce request body values to match Prisma types
function coerceValues(body, entity) {
  const coerced = {};
  for (const field of entity.fields) {
    if (field.type === "list") continue;
    if (body[field.name] === undefined || body[field.name] === null) continue;

    let val = body[field.name];

    if (field.type === "number") {
      val = parseFloat(val);
      if (isNaN(val)) continue;
    } else if (field.type === "boolean") {
      val = val === true || val === "true" || val === 1;
    } else if (field.type === "date") {
      val = new Date(val);
      if (isNaN(val.getTime())) continue;
    } else {
      val = String(val);
    }

    coerced[field.name] = val;
  }
  return coerced;
}

// Validate required fields
function validate(body, entity, isUpdate = false) {
  const errors = [];
  for (const field of entity.fields) {
    if (field.type === "list") continue;
    if (field.required && !isUpdate) {
      if (body[field.name] === undefined || body[field.name] === null || body[field.name] === "") {
        errors.push(`${field.name} is required`);
      }
    }
  }
  return errors;
}

// Dynamically register CRUD routes for each entity
for (const entity of schemaConfig.entities) {
  const modelName = entity.name;
  // Prisma uses camelCase model accessor: Product -> prisma.product
  const accessor = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const basePath = `/api/${modelName.toLowerCase()}`;

  // GET list — pagination, search, sorting, filtering
  app.get(basePath, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
      const sortBy = req.query.sortBy || "id";
      const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

      const where = {};

      // Full-text search across searchable string fields
      if (search) {
        const searchFields = entity.fields
          .filter((f) => f.searchable && (f.type === "string" || f.type === "text"))
          .map((f) => ({ [f.name]: { contains: search, mode: "insensitive" } }));
        if (searchFields.length > 0) {
          where.OR = searchFields;
        }
      }

      // Field-specific filters from query params
      for (const field of entity.fields) {
        if (field.type === "list") continue;
        const filterVal = req.query[`filter_${field.name}`];
        if (filterVal === undefined || filterVal === "") continue;

        if (field.type === "boolean") {
          where[field.name] = filterVal === "true";
        } else if (field.type === "enum") {
          where[field.name] = filterVal;
        } else if (field.type === "number") {
          where[field.name] = parseFloat(filterVal);
        }
      }

      const [data, total] = await Promise.all([
        prisma[accessor].findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma[accessor].count({ where }),
      ]);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error(`GET ${basePath} error:`, err);
      res.status(500).json({ error: "Failed to fetch records" });
    }
  });

  // GET single record by id
  app.get(`${basePath}/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const record = await prisma[accessor].findUnique({ where: { id } });
      if (!record) return res.status(404).json({ error: "Not found" });
      res.json(record);
    } catch (err) {
      console.error(`GET ${basePath}/:id error:`, err);
      res.status(500).json({ error: "Failed to fetch record" });
    }
  });

  // POST create
  app.post(basePath, async (req, res) => {
    try {
      const errors = validate(req.body, entity);
      if (errors.length > 0) return res.status(400).json({ errors });

      const data = coerceValues(req.body, entity);
      const record = await prisma[accessor].create({ data });
      res.status(201).json(record);
    } catch (err) {
      console.error(`POST ${basePath} error:`, err);
      res.status(500).json({ error: "Failed to create record" });
    }
  });

  // PUT update
  app.put(`${basePath}/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const errors = validate(req.body, entity, true);
      if (errors.length > 0) return res.status(400).json({ errors });

      const data = coerceValues(req.body, entity);
      const record = await prisma[accessor].update({ where: { id }, data });
      res.json(record);
    } catch (err) {
      console.error(`PUT ${basePath}/:id error:`, err);
      if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
      res.status(500).json({ error: "Failed to update record" });
    }
  });

  // DELETE
  app.delete(`${basePath}/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      await prisma[accessor].delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(`DELETE ${basePath}/:id error:`, err);
      if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  console.log(`Registered CRUD routes: ${basePath}`);
}

app.listen(PORT, () => {
  console.log(`dash-drop API running on port ${PORT}`);
});
