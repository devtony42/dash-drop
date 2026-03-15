require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
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

// Schema config endpoint (for client)
app.get('/api/schema', authenticate, (req, res) => {
  res.json(schemaConfig);
});

// Dynamic CRUD routes for each entity
for (const entity of schemaConfig.entities) {
  const entityName = entity.name;
  const modelName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const router = buildCrudRouter(prisma, entityName, modelName, entity);
  app.use(`/api/${modelName}s`, authenticate, router);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Entities loaded: ${schemaConfig.entities.map(e => e.name).join(', ')}`);
});
