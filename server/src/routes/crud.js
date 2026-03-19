const express = require('express');
const { authorize } = require('../middleware/auth');

function buildWhereClause(entity, query) {
  const where = {};
  const { search, ...filters } = query;

  // Text search across searchable fields
  if (search) {
    const searchableFields = entity.fields.filter(f => f.searchable);
    if (searchableFields.length > 0) {
      where.OR = searchableFields.map(f => ({
        [f.name]: { contains: search, mode: 'insensitive' },
      }));
    }
  }

  // Column filters
  for (const field of entity.fields) {
    const val = filters[field.name];
    if (val === undefined || val === '') continue;

    if (field.type === 'boolean') {
      where[field.name] = val === 'true';
    } else if (field.type === 'number' || field.type === 'integer') {
      where[field.name] = parseFloat(val);
    } else if (field.type === 'relation') {
      where[field.name] = parseInt(val, 10);
    } else if (field.type === 'enum') {
      where[field.name] = val;
    } else {
      where[field.name] = { contains: val, mode: 'insensitive' };
    }
  }

  return where;
}

function buildInclude(entity) {
  const include = {};
  for (const field of entity.fields) {
    if (field.type === 'relation') {
      const relationName = field.name.replace(/Id$/, '');
      include[relationName] = true;
    }
  }
  return Object.keys(include).length > 0 ? include : undefined;
}

function buildCrudRouter(prisma, entityName, modelName, entity) {
  const router = express.Router();
  const model = prisma[modelName];
  const include = buildInclude(entity);

  // OPTIONS — lightweight list for relation dropdowns (id + all scalar fields)
  router.get('/options', async (req, res) => {
    try {
      const select = { id: true };
      for (const field of entity.fields) {
        if (field.type !== 'relation' && field.type !== 'text') {
          select[field.name] = true;
        }
      }
      const items = await model.findMany({ orderBy: { id: 'asc' }, select });
      res.json(items);
    } catch (err) {
      console.error(`GET /${modelName}s/options error:`, err);
      res.status(500).json({ error: `Failed to list ${entityName} options` });
    }
  });

  // LIST with pagination, search, filters, sort
  router.get('/', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      // Extract filter params (exclude pagination/sort params)
      const filterKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'format'];
      const filterQuery = {};
      for (const [key, val] of Object.entries(req.query)) {
        if (!filterKeys.includes(key)) {
          filterQuery[key] = val;
        }
      }

      const where = buildWhereClause(entity, filterQuery);
      const orderBy = { [sortBy]: sortOrder };

      const [data, total] = await Promise.all([
        model.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          ...(include && { include }),
        }),
        model.count({ where }),
      ]);

      // CSV export
      if (req.query.format === 'csv') {
        const { Parser } = require('json2csv');
        const fields = ['id', ...entity.fields.map(f => f.name), 'createdAt', 'updatedAt'];
        // For CSV, fetch all matching records (not paginated)
        const allData = await model.findMany({ where, orderBy });
        const parser = new Parser({ fields });
        const csv = parser.parse(allData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${modelName}s.csv"`);
        return res.send(csv);
      }

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
      console.error(`GET /${modelName}s error:`, err);
      res.status(500).json({ error: `Failed to list ${entityName}s` });
    }
  });

  // EXPORT — dedicated CSV download with same filters (no pagination)
  router.get('/export', async (req, res) => {
    try {
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const filterKeys = ['sortBy', 'sortOrder'];
      const filterQuery = {};
      for (const [key, val] of Object.entries(req.query)) {
        if (!filterKeys.includes(key)) {
          filterQuery[key] = val;
        }
      }

      const where = buildWhereClause(entity, filterQuery);
      const allData = await model.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
      });

      // Build CSV with RFC-4180 escaping
      const fieldNames = entity.fields.map(f => f.name);
      const columns = ['id', ...fieldNames, 'createdAt', 'updatedAt'];

      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'number') return String(val);
        const str = String(val);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const header = columns.join(',');
      const rows = allData.map(record =>
        columns.map(col => escapeCsv(record[col])).join(',')
      );
      const csv = [header, ...rows].join('\n');

      const today = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityName}-export-${today}.csv"`);
      res.send(csv);
    } catch (err) {
      console.error(`GET /${modelName}s/export error:`, err);
      res.status(500).json({ error: 'Failed to export records' });
    }
  });

  // GET single
  router.get('/:id', async (req, res) => {
    try {
      const item = await model.findUnique({
        where: { id: parseInt(req.params.id) },
        ...(include && { include }),
      });
      if (!item) return res.status(404).json({ error: `${entityName} not found` });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: `Failed to get ${entityName}` });
    }
  });

  // CREATE (Admin, Editor)
  router.post('/', authorize('Admin', 'Editor'), async (req, res) => {
    try {
      const data = {};
      for (const field of entity.fields) {
        if (req.body[field.name] !== undefined) {
          let val = req.body[field.name];
          if (field.type === 'number') val = parseFloat(val);
          if (field.type === 'integer' || field.type === 'relation') val = parseInt(val);
          if (field.type === 'boolean') val = Boolean(val);
          data[field.name] = val;
        } else if (field.default !== undefined) {
          data[field.name] = field.default;
        }
      }

      const item = await model.create({ data, ...(include && { include }) });

      // Audit log
      if (entity.auditLog && prisma.auditLog) {
        try {
          await prisma.auditLog.create({
            data: {
              entity: entityName,
              recordId: item.id,
              action: 'CREATE',
              userId: req.user?.id || null,
              userName: req.user?.name || null,
              diff: null,
            },
          });
        } catch (auditErr) {
          console.error('Audit log write failed:', auditErr);
        }
      }

      res.status(201).json(item);
    } catch (err) {
      console.error(`POST /${modelName}s error:`, err);
      res.status(500).json({ error: `Failed to create ${entityName}` });
    }
  });

  // UPDATE (Admin, Editor)
  router.put('/:id', authorize('Admin', 'Editor'), async (req, res) => {
    try {
      const data = {};
      for (const field of entity.fields) {
        if (req.body[field.name] !== undefined) {
          let val = req.body[field.name];
          if (field.type === 'number') val = parseFloat(val);
          if (field.type === 'integer' || field.type === 'relation') val = parseInt(val);
          if (field.type === 'boolean') val = Boolean(val);
          data[field.name] = val;
        }
      }

      // Fetch old record for audit diff
      const before = entity.auditLog && prisma.auditLog
        ? await model.findUnique({ where: { id: parseInt(req.params.id) } })
        : null;

      const item = await model.update({
        where: { id: parseInt(req.params.id) },
        data,
        ...(include && { include }),
      });

      // Audit log
      if (entity.auditLog && prisma.auditLog && before) {
        try {
          await prisma.auditLog.create({
            data: {
              entity: entityName,
              recordId: item.id,
              action: 'UPDATE',
              userId: req.user?.id || null,
              userName: req.user?.name || null,
              diff: { before, after: item },
            },
          });
        } catch (auditErr) {
          console.error('Audit log write failed:', auditErr);
        }
      }

      res.json(item);
    } catch (err) {
      console.error(`PUT /${modelName}s/${req.params.id} error:`, err);
      res.status(500).json({ error: `Failed to update ${entityName}` });
    }
  });

  // DELETE (Admin only)
  router.delete('/:id', authorize('Admin'), async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      await model.delete({
        where: { id: recordId },
      });

      // Audit log
      if (entity.auditLog && prisma.auditLog) {
        try {
          await prisma.auditLog.create({
            data: {
              entity: entityName,
              recordId,
              action: 'DELETE',
              userId: req.user?.id || null,
              userName: req.user?.name || null,
              diff: null,
            },
          });
        } catch (auditErr) {
          console.error('Audit log write failed:', auditErr);
        }
      }

      res.json({ message: `${entityName} deleted` });
    } catch (err) {
      res.status(500).json({ error: `Failed to delete ${entityName}` });
    }
  });

  return router;
}

module.exports = { buildCrudRouter, buildInclude };
