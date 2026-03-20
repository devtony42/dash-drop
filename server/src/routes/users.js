const express = require('express');
const { authorize } = require('../middleware/auth');

module.exports = function userRoutes(prisma) {
  const router = express.Router();

  // List all users (Admin only) — never return password
  router.get('/', authorize('Admin'), async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to list users' });
    }
  });

  // Delete user (Admin only, prevent self-deletion)
  router.delete('/:id', authorize('Admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await prisma.user.delete({ where: { id } });
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Update user role (Admin only)
  router.patch('/:id/role', authorize('Admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body;
      const validRoles = ['Admin', 'Editor', 'Viewer'];

      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  return router;
};
