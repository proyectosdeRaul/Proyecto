const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, full_name, email, role, permissions, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single user
router.get('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, username, full_name, email, role, permissions, is_active, created_at, updated_at
      FROM users WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create new user (admin only)
router.post('/', [
  requireRole(['admin']),
  body('username').isLength({ min: 3 }).withMessage('Usuario debe tener al menos 3 caracteres'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('full_name').notEmpty().withMessage('Nombre completo es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('role').isIn(['admin', 'user']).withMessage('Rol debe ser admin o user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      });
    }

    const { username, password, full_name, email, role, permissions } = req.body;

    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default permissions for regular users
    const defaultPermissions = role === 'admin' ? {
      inventory: ['read', 'write', 'delete'],
      certificates: ['read', 'write', 'delete'],
      treatments: ['read', 'write', 'delete'],
      users: ['read', 'write', 'delete'],
      reports: ['read', 'write']
    } : {
      inventory: ['read', 'write'],
      certificates: ['read', 'write'],
      treatments: ['read', 'write'],
      reports: ['read']
    };

    const result = await pool.query(`
      INSERT INTO users (username, password, full_name, email, role, permissions)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, full_name, email, role, permissions, is_active, created_at
    `, [
      username, hashedPassword, full_name, email, role, 
      JSON.stringify(permissions || defaultPermissions)
    ]);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update user (admin only)
router.put('/:id', [
  requireRole(['admin']),
  body('full_name').notEmpty().withMessage('Nombre completo es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('role').isIn(['admin', 'user']).withMessage('Rol debe ser admin o user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { full_name, email, role, permissions, is_active } = req.body;

    const result = await pool.query(`
      UPDATE users SET
        full_name = $1, email = $2, role = $3, permissions = $4, 
        is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, username, full_name, email, role, permissions, is_active, updated_at
    `, [full_name, email, role, JSON.stringify(permissions), is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Change user password (admin only)
router.patch('/:id/password', [
  requireRole(['admin']),
  body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(`
      UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, full_name
    `, [hashedPassword, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Contraseña actualizada exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Toggle user active status (admin only)
router.patch('/:id/toggle-status', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE users SET 
        is_active = NOT is_active, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, full_name, is_active
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const status = result.rows[0].is_active ? 'activado' : 'desactivado';
    res.json({
      message: `Usuario ${status} exitosamente`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get user permissions
router.get('/:id/permissions', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT permissions FROM users WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ permissions: result.rows[0].permissions });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update user permissions (admin only)
router.put('/:id/permissions', [
  requireRole(['admin']),
  body('permissions').isObject().withMessage('Permisos deben ser un objeto válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { permissions } = req.body;

    const result = await pool.query(`
      UPDATE users SET 
        permissions = $1, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, permissions
    `, [JSON.stringify(permissions), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Permisos actualizados exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get current user profile
router.get('/profile/me', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, full_name, email, role, permissions, is_active, created_at, updated_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update current user profile
router.put('/profile/me', [
  body('full_name').notEmpty().withMessage('Nombre completo es requerido'),
  body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      });
    }

    const { full_name, email } = req.body;

    const result = await pool.query(`
      UPDATE users SET
        full_name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, full_name, email, role, updated_at
    `, [full_name, email, req.user.id]);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
