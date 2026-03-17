/**
 * Integration tests for auto-generated CRUD routes
 * Prisma client is fully mocked — no real DB required.
 *
 * The server source is CommonJS; we bridge via createRequire so this
 * ESM-context test file can import it without converting the whole server.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);

// Pull in CJS source modules via require
const express        = require('express');
const jwt            = require('jsonwebtoken');
const supertest      = require('supertest');
const { buildCrudRouter } = require('../routes/crud.js');
const { authenticate }    = require('../middleware/auth.js');

// ── Prisma model mock ────────────────────────────────────────────────────────
const mockModel = {
  findMany:   vi.fn(),
  findUnique: vi.fn(),
  create:     vi.fn(),
  update:     vi.fn(),
  delete:     vi.fn(),
  count:      vi.fn(),
};

const mockAuditLog = { create: vi.fn() };

const mockPrisma = { contact: mockModel };
const mockPrismaWithAudit = { contact: mockModel, auditLog: mockAuditLog };

// ── Test entity schema ───────────────────────────────────────────────────────
const testEntity = {
  name: 'Contact',
  fields: [
    { name: 'name',   type: 'string', required: true,  searchable: true },
    { name: 'email',  type: 'string', required: true,  searchable: true },
    { name: 'status', type: 'enum',   options: ['Lead', 'Customer'], required: true, default: 'Lead' },
    { name: 'value',  type: 'number' },
  ],
};

const auditedEntity = { ...testEntity, auditLog: true };

// ── JWT helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = 'dev-secret-change-me';
const makeToken = (role = 'Admin') =>
  jwt.sign({ id: 1, email: 'test@test.com', role }, JWT_SECRET, { expiresIn: '1h' });

// ── App factory ──────────────────────────────────────────────────────────────
function buildApp(role = 'Admin', { audited = false } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.headers.authorization = `Bearer ${makeToken(role)}`;
    next();
  });
  const prisma = audited ? mockPrismaWithAudit : mockPrisma;
  const entity = audited ? auditedEntity : testEntity;
  app.use('/api/contacts', authenticate, buildCrudRouter(prisma, 'Contact', 'contact', entity));
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const sampleRecord = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  status: 'Lead',
  value: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('CRUD routes — /api/contacts', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ── GET / (list) ─────────────────────────────────────────────────────────
  describe('GET /api/contacts', () => {
    it('returns paginated data with default pagination', async () => {
      mockModel.findMany.mockResolvedValue([sampleRecord]);
      mockModel.count.mockResolvedValue(1);

      const res = await supertest(buildApp()).get('/api/contacts');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.arrayContaining([expect.objectContaining({ id: 1, name: 'Alice' })]),
        pagination: expect.objectContaining({ page: 1, limit: 10, total: 1, totalPages: 1 }),
      });
      expect(mockModel.findMany).toHaveBeenCalledOnce();
      expect(mockModel.count).toHaveBeenCalledOnce();
    });

    it('passes search param to OR where clause for searchable fields', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      await supertest(buildApp()).get('/api/contacts?search=alice');

      const findCall = mockModel.findMany.mock.calls[0][0];
      expect(findCall.where).toHaveProperty('OR');
      expect(JSON.stringify(findCall.where.OR)).toContain('alice');
    });

    it('applies enum column filter from query params', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      await supertest(buildApp()).get('/api/contacts?status=Lead');

      const findCall = mockModel.findMany.mock.calls[0][0];
      expect(findCall.where).toMatchObject({ status: 'Lead' });
    });

    it('respects custom page and limit', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(50);

      const res = await supertest(buildApp()).get('/api/contacts?page=2&limit=5');

      expect(res.body.pagination).toMatchObject({ page: 2, limit: 5, total: 50, totalPages: 10 });
      expect(mockModel.findMany.mock.calls[0][0]).toMatchObject({ skip: 5, take: 5 });
    });

    it('clamps limit to maximum 100', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      await supertest(buildApp()).get('/api/contacts?limit=9999');

      expect(mockModel.findMany.mock.calls[0][0].take).toBe(100);
    });

    it('returns 500 when Prisma throws', async () => {
      mockModel.findMany.mockRejectedValue(new Error('DB down'));
      mockModel.count.mockRejectedValue(new Error('DB down'));

      const res = await supertest(buildApp()).get('/api/contacts');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── POST / (create) ──────────────────────────────────────────────────────
  describe('POST /api/contacts', () => {
    it('creates a record and returns 201', async () => {
      mockModel.create.mockResolvedValue({ ...sampleRecord, id: 2 });

      const res = await supertest(buildApp())
        .post('/api/contacts')
        .send({ name: 'Bob', email: 'bob@example.com', status: 'Customer' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: 2 });
      expect(mockModel.create).toHaveBeenCalledOnce();
    });

    it('coerces number fields from string input', async () => {
      mockModel.create.mockResolvedValue(sampleRecord);

      await supertest(buildApp())
        .post('/api/contacts')
        .send({ name: 'Bob', email: 'bob@example.com', status: 'Lead', value: '42.5' });

      const createData = mockModel.create.mock.calls[0][0].data;
      expect(createData.value).toBe(42.5);
    });

    it('returns 403 when role is Viewer', async () => {
      const res = await supertest(buildApp('Viewer'))
        .post('/api/contacts')
        .send({ name: 'Bob', email: 'bob@example.com', status: 'Lead' });

      expect(res.status).toBe(403);
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('returns 500 when Prisma throws on create', async () => {
      mockModel.create.mockRejectedValue(new Error('Unique constraint'));

      const res = await supertest(buildApp())
        .post('/api/contacts')
        .send({ name: 'Bob', email: 'bob@example.com', status: 'Lead' });

      expect(res.status).toBe(500);
    });
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  describe('GET /api/contacts/:id', () => {
    it('returns a single record by id', async () => {
      mockModel.findUnique.mockResolvedValue(sampleRecord);

      const res = await supertest(buildApp()).get('/api/contacts/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1, name: 'Alice' });
      expect(mockModel.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('returns 404 when record does not exist', async () => {
      mockModel.findUnique.mockResolvedValue(null);

      const res = await supertest(buildApp()).get('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 500 when Prisma throws', async () => {
      mockModel.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await supertest(buildApp()).get('/api/contacts/1');
      expect(res.status).toBe(500);
    });
  });

  // ── PUT /:id ──────────────────────────────────────────────────────────────
  describe('PUT /api/contacts/:id', () => {
    it('updates a record and returns it', async () => {
      const updated = { ...sampleRecord, name: 'Alice Updated' };
      mockModel.update.mockResolvedValue(updated);

      const res = await supertest(buildApp())
        .put('/api/contacts/1')
        .send({ name: 'Alice Updated' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'Alice Updated' });
      expect(mockModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ name: 'Alice Updated' }),
        })
      );
    });

    it('returns 403 for Viewer role', async () => {
      const res = await supertest(buildApp('Viewer'))
        .put('/api/contacts/1')
        .send({ name: 'Nope' });

      expect(res.status).toBe(403);
    });

    it('returns 500 when Prisma throws on update', async () => {
      mockModel.update.mockRejectedValue(new Error('Not found'));

      const res = await supertest(buildApp())
        .put('/api/contacts/1')
        .send({ name: 'Bad' });

      expect(res.status).toBe(500);
    });
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  describe('DELETE /api/contacts/:id', () => {
    it('deletes a record and returns success message', async () => {
      mockModel.delete.mockResolvedValue(sampleRecord);

      const res = await supertest(buildApp()).delete('/api/contacts/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(mockModel.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('returns 403 for Editor role (delete is Admin-only)', async () => {
      const res = await supertest(buildApp('Editor')).delete('/api/contacts/1');
      expect(res.status).toBe(403);
    });

    it('returns 403 for Viewer role', async () => {
      const res = await supertest(buildApp('Viewer')).delete('/api/contacts/1');
      expect(res.status).toBe(403);
    });

    it('returns 500 when Prisma throws on delete', async () => {
      mockModel.delete.mockRejectedValue(new Error('FK constraint'));

      const res = await supertest(buildApp()).delete('/api/contacts/1');
      expect(res.status).toBe(500);
    });
  });
});

// ── Audit Log tests ───────────────────────────────────────────────────────────
describe('Audit Log — entities with auditLog: true', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLog.create.mockResolvedValue({});
  });

  it('CREATE writes an audit log entry with action=CREATE', async () => {
    mockModel.create.mockResolvedValue({ ...sampleRecord, id: 2 });

    const res = await supertest(buildApp('Admin', { audited: true }))
      .post('/api/contacts')
      .send({ name: 'Bob', email: 'bob@example.com', status: 'Lead' });

    expect(res.status).toBe(201);
    expect(mockAuditLog.create).toHaveBeenCalledOnce();
    expect(mockAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entity: 'Contact',
        recordId: 2,
        action: 'CREATE',
        diff: null,
      }),
    });
  });

  it('UPDATE writes an audit log entry with action=UPDATE and before/after diff', async () => {
    const updated = { ...sampleRecord, name: 'Alice Updated' };
    mockModel.findUnique.mockResolvedValue(sampleRecord);
    mockModel.update.mockResolvedValue(updated);

    const res = await supertest(buildApp('Admin', { audited: true }))
      .put('/api/contacts/1')
      .send({ name: 'Alice Updated' });

    expect(res.status).toBe(200);
    expect(mockAuditLog.create).toHaveBeenCalledOnce();
    const auditData = mockAuditLog.create.mock.calls[0][0].data;
    expect(auditData.action).toBe('UPDATE');
    expect(auditData.diff).toMatchObject({
      before: expect.objectContaining({ name: 'Alice' }),
      after:  expect.objectContaining({ name: 'Alice Updated' }),
    });
  });

  it('DELETE writes an audit log entry with action=DELETE', async () => {
    mockModel.delete.mockResolvedValue(sampleRecord);

    const res = await supertest(buildApp('Admin', { audited: true }))
      .delete('/api/contacts/1');

    expect(res.status).toBe(200);
    expect(mockAuditLog.create).toHaveBeenCalledOnce();
    expect(mockAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entity: 'Contact',
        recordId: 1,
        action: 'DELETE',
      }),
    });
  });

  it('audit log failure is non-blocking — request still succeeds', async () => {
    mockModel.create.mockResolvedValue({ ...sampleRecord, id: 3 });
    mockAuditLog.create.mockRejectedValue(new Error('Audit DB down'));

    const res = await supertest(buildApp('Admin', { audited: true }))
      .post('/api/contacts')
      .send({ name: 'Bob', email: 'bob@example.com', status: 'Lead' });

    // Main request still 201 even though audit write threw
    expect(res.status).toBe(201);
  });

  it('non-audited entity does NOT write audit log on CREATE', async () => {
    mockModel.create.mockResolvedValue({ ...sampleRecord, id: 4 });

    const res = await supertest(buildApp('Admin', { audited: false }))
      .post('/api/contacts')
      .send({ name: 'Bob', email: 'bob@example.com', status: 'Lead' });

    expect(res.status).toBe(201);
    expect(mockAuditLog.create).not.toHaveBeenCalled();
  });
});
