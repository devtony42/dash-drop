const fs = require('fs');
const path = require('path');

const configPath = process.env.SCHEMA_PATH || path.resolve(__dirname, '../../schema.config.json');
const prismaPath = process.env.PRISMA_SCHEMA_PATH || path.resolve(__dirname, '../../prisma/schema.prisma');

function fieldTypeToPrisma(field) {
  const mapping = {
    string: 'String',
    text: 'String',
    number: 'Float',
    integer: 'Int',
    boolean: 'Boolean',
    date: 'DateTime',
    enum: 'String',
  };
  return mapping[field.type] || 'String';
}

function generatePrismaSchema(config) {
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      String   @default("Viewer")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  // First pass: collect reverse relations (for Prisma's required back-references)
  const reverseRelations = {}; // { targetEntity: [{ fromEntity, fieldName }] }
  for (const entity of config.entities) {
    for (const field of entity.fields) {
      if (field.type === 'relation') {
        const target = field.entity;
        if (!reverseRelations[target]) reverseRelations[target] = [];
        reverseRelations[target].push({ fromEntity: entity.name, fieldName: field.name });
      }
    }
  }

  for (const entity of config.entities) {
    const tableName = entity.name;
    schema += `\nmodel ${tableName} {\n`;
    schema += `  id        Int      @id @default(autoincrement())\n`;

    for (const field of entity.fields) {
      if (field.type === 'relation') {
        // Derive the relation name from the FK field (e.g. contactId → contact)
        const relationName = field.name.replace(/Id$/, '');
        const optional = field.required ? '' : '?';
        schema += `  ${relationName} ${field.entity}${optional} @relation(fields: [${field.name}], references: [id])\n`;
        schema += `  ${field.name} Int${optional}\n`;
        continue;
      }
      const prismaType = fieldTypeToPrisma(field);
      const optional = field.required ? '' : '?';
      let defaultVal = '';
      if (field.default !== undefined) {
        if (typeof field.default === 'boolean') {
          defaultVal = ` @default(${field.default})`;
        } else if (typeof field.default === 'number') {
          defaultVal = ` @default(${field.default})`;
        } else {
          defaultVal = ` @default("${field.default}")`;
        }
      }
      schema += `  ${field.name} ${prismaType}${optional}${defaultVal}\n`;
    }

    // Add reverse relation fields (Prisma requires both sides)
    if (reverseRelations[tableName]) {
      for (const rel of reverseRelations[tableName]) {
        const lower = rel.fromEntity.charAt(0).toLowerCase() + rel.fromEntity.slice(1);
        // Simple pluralization: y→ies, otherwise just add s
        const backName = lower.endsWith('y')
          ? lower.slice(0, -1) + 'ies'
          : lower + 's';
        schema += `  ${backName} ${rel.fromEntity}[]\n`;
      }
    }

    schema += `  createdAt DateTime @default(now())\n`;
    schema += `  updatedAt DateTime @updatedAt\n`;
    schema += `}\n`;
  }

  // Static _AuditLog model (used when any entity has auditLog: true)
  const hasAuditLog = config.entities.some(e => e.auditLog);
  if (hasAuditLog) {
    schema += `\nmodel AuditLog {\n`;
    schema += `  id        Int      @id @default(autoincrement())\n`;
    schema += `  entity    String\n`;
    schema += `  recordId  Int\n`;
    schema += `  action    String\n`;
    schema += `  userId    Int?\n`;
    schema += `  userName  String?\n`;
    schema += `  diff      Json?\n`;
    schema += `  createdAt DateTime @default(now())\n`;
    schema += `\n`;
    schema += `  @@map("_AuditLog")\n`;
    schema += `}\n`;
  }

  return schema;
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const schema = generatePrismaSchema(config);
fs.mkdirSync(path.dirname(prismaPath), { recursive: true });
fs.writeFileSync(prismaPath, schema);
console.log('Prisma schema generated at', prismaPath);
