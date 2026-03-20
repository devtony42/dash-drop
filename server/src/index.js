require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { authenticate, authorize } = require('./middleware/auth');
const { buildCrudRouter } = require('./routes/crud');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load schema config
const configPath = process.env.SCHEMA_PATH || path.resolve(__dirname, '../../schema.config.json');
const schemaConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes(prisma));

// User management routes (Admin only, behind authenticate)
app.use('/api/users', authenticate, userRoutes(prisma));

// Build effective schema (append synthetic Audit Log entity if any entity opts in)
const hasAuditLog = schemaConfig.entities.some(e => e.auditLog);
const auditLogEntity = {
  name: 'AuditLog',
  displayName: 'Audit Log',
  icon: 'FileText',
  readOnly: true,
  fields: [
    { name: 'entity', type: 'string', searchable: true },
    { name: 'recordId', type: 'integer' },
    { name: 'action', type: 'enum', options: ['CREATE', 'UPDATE', 'DELETE'] },
    { name: 'userName', type: 'string', searchable: true },
  ],
};
const effectiveSchema = hasAuditLog
  ? { ...schemaConfig, entities: [...schemaConfig.entities, auditLogEntity] }
  : schemaConfig;

// Schema config endpoint (for client)
app.get('/api/schema', authenticate, (req, res) => {
  res.json(effectiveSchema);
});

// Dynamic CRUD routes for each entity
for (const entity of effectiveSchema.entities) {
  const entityName = entity.name;
  const modelName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const router = buildCrudRouter(prisma, entityName, modelName, entity);
  app.use(`/api/${modelName}s`, authenticate, router);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Entities loaded: ${effectiveSchema.entities.map(e => e.name).join(', ')}`);
});
