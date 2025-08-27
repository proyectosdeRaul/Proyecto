const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get available areas
router.get('/areas', requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const areas = ['PPC Balboa', 'PSA', 'Chiriquí', 'Tocumen', 'Colón', 'Bocas del Toro', 'Manzanillo'];
    res.json(areas);
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get all chemical inventory
router.get('/', requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const { status, search, area } = req.query;
    let query = `
      SELECT ci.*, u.full_name as registered_by_name
      FROM chemical_inventory ci
      LEFT JOIN users u ON ci.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (area) {
      paramCount++;
      query += ` AND ci.area = $${paramCount}`;
      params.push(area);
    }

    if (status) {
      paramCount++;
      query += ` AND ci.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (ci.chemical_name ILIKE $${paramCount} OR ci.manufacturer ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY ci.registered_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single chemical by ID
router.get('/:id', requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT ci.*, u.full_name as registered_by_name
      FROM chemical_inventory ci
      LEFT JOIN users u ON ci.registered_by = u.id
      WHERE ci.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto químico no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting chemical:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Add new chemical
router.post('/', [
  requirePermission('inventory', 'write'),
  body('chemical_name').notEmpty().withMessage('Nombre del químico es requerido'),
  body('quantity').isFloat({ min: 0 }).withMessage('Cantidad debe ser un número positivo'),
  body('unit').notEmpty().withMessage('Unidad es requerida'),
  body('area').isIn(['PPC Balboa', 'PSA', 'Chiriquí', 'Tocumen', 'Colón', 'Bocas del Toro', 'Manzanillo']).withMessage('Área no válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      });
    }

    const {
      chemical_name,
      quantity,
      unit,
      area,
      concentration,
      manufacturer,
      lot_number,
      expiration_date,
      storage_location,
      notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO chemical_inventory (
        chemical_name, quantity, unit, area, concentration, manufacturer,
        lot_number, expiration_date, storage_location, notes, registered_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      chemical_name, quantity, unit, area, concentration, manufacturer,
      lot_number, expiration_date, storage_location, notes, req.user.id
    ]);

    res.status(201).json({
      message: 'Producto químico registrado exitosamente',
      chemical: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding chemical:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update chemical
router.put('/:id', [
  requirePermission('inventory', 'write'),
  body('chemical_name').notEmpty().withMessage('Nombre del químico es requerido'),
  body('quantity').isFloat({ min: 0 }).withMessage('Cantidad debe ser un número positivo'),
  body('unit').notEmpty().withMessage('Unidad es requerida')
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
    const {
      chemical_name,
      quantity,
      unit,
      concentration,
      manufacturer,
      lot_number,
      expiration_date,
      storage_location,
      notes
    } = req.body;

    const result = await pool.query(`
      UPDATE chemical_inventory SET
        chemical_name = $1, quantity = $2, unit = $3, concentration = $4,
        manufacturer = $5, lot_number = $6, expiration_date = $7,
        storage_location = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [
      chemical_name, quantity, unit, concentration, manufacturer,
      lot_number, expiration_date, storage_location, notes, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto químico no encontrado' });
    }

    res.json({
      message: 'Producto químico actualizado exitosamente',
      chemical: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating chemical:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Discard chemical
router.patch('/:id/discard', requirePermission('inventory', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(`
      UPDATE chemical_inventory SET
        status = 'discarded',
        discarded_at = CURRENT_TIMESTAMP,
        discarded_by = $1,
        notes = COALESCE($2, notes)
      WHERE id = $3 AND status = 'active'
      RETURNING *
    `, [req.user.id, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto químico no encontrado o ya descartado' });
    }

    res.json({
      message: 'Producto químico descartado exitosamente',
      chemical: result.rows[0]
    });
  } catch (error) {
    console.error('Error discarding chemical:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete chemical (admin only)
router.delete('/:id', requirePermission('inventory', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM chemical_inventory WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto químico no encontrado' });
    }

    res.json({ message: 'Producto químico eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting chemical:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get inventory statistics
router.get('/stats/overview', requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_chemicals,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_chemicals,
        COUNT(CASE WHEN status = 'discarded' THEN 1 END) as discarded_chemicals,
        COUNT(CASE WHEN expiration_date < CURRENT_DATE THEN 1 END) as expired_chemicals,
        SUM(CASE WHEN status = 'active' THEN quantity ELSE 0 END) as total_quantity
      FROM chemical_inventory
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
