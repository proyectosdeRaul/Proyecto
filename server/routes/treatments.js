const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

// Generate schedule number
const generateScheduleNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TRAT-${year}${month}${day}-${random}`;
};

// Get all treatment schedules
router.get('/', requirePermission('treatments', 'read'), async (req, res) => {
  try {
    const { status, location_type, start_date, end_date } = req.query;
    let query = `
      SELECT ts.*, u.full_name as created_by_name, 
             cu.full_name as completed_by_name
      FROM treatment_schedules ts
      LEFT JOIN users u ON ts.created_by = u.id
      LEFT JOIN users cu ON ts.completed_by = cu.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND ts.status = $${paramCount}`;
      params.push(status);
    }

    if (location_type) {
      paramCount++;
      query += ` AND ts.location_type = $${paramCount}`;
      params.push(location_type);
    }

    if (start_date) {
      paramCount++;
      query += ` AND ts.scheduled_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND ts.scheduled_date <= $${paramCount}`;
      params.push(end_date);
    }

    query += ' ORDER BY ts.scheduled_date ASC, ts.scheduled_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting treatments:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single treatment schedule
router.get('/:id', requirePermission('treatments', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT ts.*, u.full_name as created_by_name, 
             cu.full_name as completed_by_name
      FROM treatment_schedules ts
      LEFT JOIN users u ON ts.created_by = u.id
      LEFT JOIN users cu ON ts.completed_by = cu.id
      WHERE ts.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación de tratamiento no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting treatment:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create new treatment schedule
router.post('/', [
  requirePermission('treatments', 'write'),
  body('treatment_type').notEmpty().withMessage('Tipo de tratamiento es requerido'),
  body('location_type').isIn(['puerto', 'fuera_puerto']).withMessage('Tipo de ubicación debe ser puerto o fuera_puerto'),
  body('location_name').notEmpty().withMessage('Nombre de la ubicación es requerido'),
  body('chemical_name').notEmpty().withMessage('Nombre del químico es requerido'),
  body('quantity_planned').isFloat({ min: 0 }).withMessage('Cantidad planificada debe ser un número positivo'),
  body('unit').notEmpty().withMessage('Unidad es requerida'),
  body('scheduled_date').notEmpty().withMessage('Fecha programada es requerida'),
  body('scheduled_time').notEmpty().withMessage('Hora programada es requerida'),
  body('responsible_person').notEmpty().withMessage('Persona responsable es requerida')
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
      treatment_type,
      location_type,
      location_name,
      chemical_name,
      quantity_planned,
      unit,
      scheduled_date,
      scheduled_time,
      responsible_person,
      area_size,
      area_unit,
      priority,
      notes
    } = req.body;

    const schedule_number = generateScheduleNumber();

    const result = await pool.query(`
      INSERT INTO treatment_schedules (
        schedule_number, treatment_type, location_type, location_name,
        chemical_name, quantity_planned, unit, scheduled_date, scheduled_time,
        responsible_person, area_size, area_unit, priority, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      schedule_number, treatment_type, location_type, location_name,
      chemical_name, quantity_planned, unit, scheduled_date, scheduled_time,
      responsible_person, area_size, area_unit, priority || 'normal', notes, req.user.id
    ]);

    res.status(201).json({
      message: 'Programación de tratamiento creada exitosamente',
      treatment: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating treatment:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update treatment schedule
router.put('/:id', [
  requirePermission('treatments', 'write'),
  body('treatment_type').notEmpty().withMessage('Tipo de tratamiento es requerido'),
  body('location_type').isIn(['puerto', 'fuera_puerto']).withMessage('Tipo de ubicación debe ser puerto o fuera_puerto'),
  body('location_name').notEmpty().withMessage('Nombre de la ubicación es requerido'),
  body('chemical_name').notEmpty().withMessage('Nombre del químico es requerido'),
  body('quantity_planned').isFloat({ min: 0 }).withMessage('Cantidad planificada debe ser un número positivo'),
  body('unit').notEmpty().withMessage('Unidad es requerida'),
  body('scheduled_date').notEmpty().withMessage('Fecha programada es requerida'),
  body('scheduled_time').notEmpty().withMessage('Hora programada es requerida'),
  body('responsible_person').notEmpty().withMessage('Persona responsable es requerida')
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
      treatment_type,
      location_type,
      location_name,
      chemical_name,
      quantity_planned,
      unit,
      scheduled_date,
      scheduled_time,
      responsible_person,
      area_size,
      area_unit,
      priority,
      notes
    } = req.body;

    const result = await pool.query(`
      UPDATE treatment_schedules SET
        treatment_type = $1, location_type = $2, location_name = $3,
        chemical_name = $4, quantity_planned = $5, unit = $6,
        scheduled_date = $7, scheduled_time = $8, responsible_person = $9,
        area_size = $10, area_unit = $11, priority = $12, notes = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [
      treatment_type, location_type, location_name, chemical_name,
      quantity_planned, unit, scheduled_date, scheduled_time, responsible_person,
      area_size, area_unit, priority || 'normal', notes, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación de tratamiento no encontrada' });
    }

    res.json({
      message: 'Programación de tratamiento actualizada exitosamente',
      treatment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating treatment:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update treatment status
router.patch('/:id/status', requirePermission('treatments', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    let query = `
      UPDATE treatment_schedules SET
        status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const params = [status];

    if (status === 'completed') {
      query += `, completed_at = CURRENT_TIMESTAMP, completed_by = $2`;
      params.push(req.user.id);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación de tratamiento no encontrada' });
    }

    res.json({
      message: 'Estado de tratamiento actualizado exitosamente',
      treatment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating treatment status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete treatment schedule
router.delete('/:id', requirePermission('treatments', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM treatment_schedules WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación de tratamiento no encontrada' });
    }

    res.json({ message: 'Programación de tratamiento eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting treatment:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get treatment statistics
router.get('/stats/overview', requirePermission('treatments', 'read'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_treatments,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_treatments,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_treatments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_treatments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_treatments,
        COUNT(CASE WHEN scheduled_date < CURRENT_DATE AND status IN ('scheduled', 'in_progress') THEN 1 END) as overdue_treatments
      FROM treatment_schedules
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error getting treatment stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get upcoming treatments
router.get('/upcoming/list', requirePermission('treatments', 'read'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts.*, u.full_name as created_by_name
      FROM treatment_schedules ts
      LEFT JOIN users u ON ts.created_by = u.id
      WHERE ts.scheduled_date >= CURRENT_DATE 
        AND ts.status IN ('scheduled', 'in_progress')
      ORDER BY ts.scheduled_date ASC, ts.scheduled_time ASC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting upcoming treatments:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
