/**
 * Integration tests for user management routes
 * Prisma client is fully mocked — no real DB required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const express      = require('express');
const jwt          = require('jsonwebtoken');
const supertest    = require('supertest');
const userRoutes   = require('../routes/users.js');
const { authenticate } = require('../middleware/auth.js');

// ── Prisma model mock ────────────────────────────────────────────────────────
const mockUser = {
  findMany:   vi.fn(),
  findUnique: vi.fn(),
  create:     vi.fn(),
  update:     vi.fn(),
  delete:     vi.fn(),
};

const mockPrisma = { user: mockUser };

// ── JWT helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = 'dev-secret-change-me';
const makeToken = (overrides = {}) =>
  jwt.sign({ id: 1, email: 'admin@test.com', name: 'Admin', role: 'Admin', ...overrides }, JWT_SECRET, { expiresIn: '1h' });

// ── App factory ──────────────────────────────────────────────────────────────
function buildApp(tokenOverrides = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.headers.authorization = `Bearer ${makeToken(tokenOverrides)}`;
    next();
  });
  app.use('/api/users', authenticate, userRoutes(mockPrisma));
  return app;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────
const sampleUsers = [
  { id: 1, email: 'admin@test.com', name: 'Admin', role: 'Admin', createdAt: new Date('2024-01-01') },
  { id: 2, email: 'editor@test.com', name: 'Editor', role: 'Editor', createdAt: new Date('2024-02-01') },
  { id: 3, email: 'viewer@test.com', name: 'Viewer', role: 'Viewer', createdAt: new Date('2024-03-01') },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('User management routes — /api/users', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ── GET /api/users ─────────────────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('returns all users without password field', async () => {
      mockUser.findMany.mockResolvedValue(sampleUsers);

      const res = await supertest(buildApp()).get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toMatchObject({ id: 1, email: 'admin@test.com', role: 'Admin' });
      // Ensure password is never returned
      res.body.forEach(u => expect(u).not.toHaveProperty('password'));
      expect(mockUser.findMany).toHaveBeenCalledWith({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns 403 for Editor role', async () => {
      const res = await supertest(buildApp({ role: 'Editor' })).get('/api/users');
      expect(res.status).toBe(403);
      expect(mockUser.findMany).not.toHaveBeenCalled();
    });

    it('returns 403 for Viewer role', async () => {
      const res = await supertest(buildApp({ role: 'Viewer' })).get('/api/users');
      expect(res.status).toBe(403);
      expect(mockUser.findMany).not.toHaveBeenCalled();
    });

    it('returns 500 when Prisma throws', async () => {
      mockUser.findMany.mockRejectedValue(new Error('DB down'));

      const res = await supertest(buildApp()).get('/api/users');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── DELETE /api/users/:id ──────────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    it('deletes a user and returns success message', async () => {
      mockUser.delete.mockResolvedValue(sampleUsers[1]);

      const res = await supertest(buildApp()).delete('/api/users/2');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deleted');
      expect(mockUser.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('prevents self-deletion (returns 400)', async () => {
      const res = await supertest(buildApp({ id: 1 })).delete('/api/users/1');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cannot delete your own account');
      expect(mockUser.delete).not.toHaveBeenCalled();
    });

    it('returns 403 for Editor role', async () => {
      const res = await supertest(buildApp({ role: 'Editor' })).delete('/api/users/2');
      expect(res.status).toBe(403);
      expect(mockUser.delete).not.toHaveBeenCalled();
    });

    it('returns 403 for Viewer role', async () => {
      const res = await supertest(buildApp({ role: 'Viewer' })).delete('/api/users/2');
      expect(res.status).toBe(403);
      expect(mockUser.delete).not.toHaveBeenCalled();
    });

    it('returns 500 when Prisma throws on delete', async () => {
      mockUser.delete.mockRejectedValue(new Error('FK constraint'));

      const res = await supertest(buildApp()).delete('/api/users/2');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── PATCH /api/users/:id/role ──────────────────────────────────────────────
  describe('PATCH /api/users/:id/role', () => {
    it('updates role and returns updated user', async () => {
      const updated = { ...sampleUsers[2], role: 'Editor' };
      mockUser.update.mockResolvedValue(updated);

      const res = await supertest(buildApp())
        .patch('/api/users/3/role')
        .send({ role: 'Editor' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 3, role: 'Editor' });
      expect(res.body).not.toHaveProperty('password');
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { role: 'Editor' },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
    });

    it('returns 400 for invalid role', async () => {
      const res = await supertest(buildApp())
        .patch('/api/users/3/role')
        .send({ role: 'SuperAdmin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be one of/);
      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('returns 400 when role is missing', async () => {
      const res = await supertest(buildApp())
        .patch('/api/users/3/role')
        .send({});

      expect(res.status).toBe(400);
      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('returns 403 for Editor role', async () => {
      const res = await supertest(buildApp({ role: 'Editor' }))
        .patch('/api/users/3/role')
        .send({ role: 'Viewer' });

      expect(res.status).toBe(403);
      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('returns 403 for Viewer role', async () => {
      const res = await supertest(buildApp({ role: 'Viewer' }))
        .patch('/api/users/3/role')
        .send({ role: 'Editor' });

      expect(res.status).toBe(403);
      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('returns 500 when Prisma throws on update', async () => {
      mockUser.update.mockRejectedValue(new Error('Not found'));

      const res = await supertest(buildApp())
        .patch('/api/users/3/role')
        .send({ role: 'Admin' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});
