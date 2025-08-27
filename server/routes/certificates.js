const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { requirePermission } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const router = express.Router();

// Generate certificate number
const generateCertificateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CERT-${year}${month}${day}-${random}`;
};

// Get all certificates
router.get('/', requirePermission('certificates', 'read'), async (req, res) => {
  try {
    const { start_date, end_date, treatment_type } = req.query;
    let query = `
      SELECT tc.*, u.full_name as created_by_name
      FROM treatment_certificates tc
      LEFT JOIN users u ON tc.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      query += ` AND tc.application_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND tc.application_date <= $${paramCount}`;
      params.push(end_date);
    }

    if (treatment_type) {
      paramCount++;
      query += ` AND tc.treatment_type = $${paramCount}`;
      params.push(treatment_type);
    }

    query += ' ORDER BY tc.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting certificates:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single certificate
router.get('/:id', requirePermission('certificates', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT tc.*, u.full_name as created_by_name
      FROM treatment_certificates tc
      LEFT JOIN users u ON tc.created_by = u.id
      WHERE tc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create new certificate
router.post('/', [
  requirePermission('certificates', 'write'),
  body('treatment_type').notEmpty().withMessage('Tipo de tratamiento es requerido'),
  body('product_name').notEmpty().withMessage('Nombre del producto es requerido'),
  body('application_location').notEmpty().withMessage('Lugar de aplicación es requerido'),
  body('responsible_person').notEmpty().withMessage('Persona responsable es requerida'),
  body('application_date').notEmpty().withMessage('Fecha de aplicación es requerida'),
  body('application_time').notEmpty().withMessage('Hora de aplicación es requerida')
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
      product_name,
      application_location,
      responsible_person,
      application_date,
      application_time,
      chemical_used,
      concentration_used,
      quantity_used,
      unit_used,
      weather_conditions,
      temperature,
      humidity,
      observations
    } = req.body;

    const certificate_number = generateCertificateNumber();

    const result = await pool.query(`
      INSERT INTO treatment_certificates (
        certificate_number, treatment_type, product_name, application_location,
        responsible_person, application_date, application_time, chemical_used,
        concentration_used, quantity_used, unit_used, weather_conditions,
        temperature, humidity, observations, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      certificate_number, treatment_type, product_name, application_location,
      responsible_person, application_date, application_time, chemical_used,
      concentration_used, quantity_used, unit_used, weather_conditions,
      temperature, humidity, observations, req.user.id
    ]);

    res.status(201).json({
      message: 'Certificado creado exitosamente',
      certificate: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update certificate
router.put('/:id', [
  requirePermission('certificates', 'write'),
  body('treatment_type').notEmpty().withMessage('Tipo de tratamiento es requerido'),
  body('product_name').notEmpty().withMessage('Nombre del producto es requerido'),
  body('application_location').notEmpty().withMessage('Lugar de aplicación es requerido'),
  body('responsible_person').notEmpty().withMessage('Persona responsable es requerida'),
  body('application_date').notEmpty().withMessage('Fecha de aplicación es requerida'),
  body('application_time').notEmpty().withMessage('Hora de aplicación es requerida')
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
      product_name,
      application_location,
      responsible_person,
      application_date,
      application_time,
      chemical_used,
      concentration_used,
      quantity_used,
      unit_used,
      weather_conditions,
      temperature,
      humidity,
      observations
    } = req.body;

    const result = await pool.query(`
      UPDATE treatment_certificates SET
        treatment_type = $1, product_name = $2, application_location = $3,
        responsible_person = $4, application_date = $5, application_time = $6,
        chemical_used = $7, concentration_used = $8, quantity_used = $9,
        unit_used = $10, weather_conditions = $11, temperature = $12,
        humidity = $13, observations = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      treatment_type, product_name, application_location, responsible_person,
      application_date, application_time, chemical_used, concentration_used,
      quantity_used, unit_used, weather_conditions, temperature, humidity,
      observations, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    res.json({
      message: 'Certificado actualizado exitosamente',
      certificate: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete certificate
router.delete('/:id', requirePermission('certificates', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM treatment_certificates WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    res.json({ message: 'Certificado eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generate PDF certificate
router.get('/:id/pdf', requirePermission('certificates', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT tc.*, u.full_name as created_by_name
      FROM treatment_certificates tc
      LEFT JOIN users u ON tc.created_by = u.id
      WHERE tc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    const certificate = result.rows[0];

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado-${certificate.certificate_number}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('MINISTERIO DE DESARROLLO AGROPECUARIO', { align: 'center' });
    doc.fontSize(16).text('Dirección Ejecutiva de Cuarentena', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('CERTIFICADO DE TRATAMIENTO', { align: 'center' });
    doc.moveDown(2);

    // Certificate details
    doc.fontSize(12);
    doc.text(`Número de Certificado: ${certificate.certificate_number}`, { continued: true });
    doc.text(`Fecha: ${moment(certificate.application_date).format('DD/MM/YYYY')}`, { align: 'right' });
    doc.moveDown();

    doc.text(`Tipo de Tratamiento: ${certificate.treatment_type}`);
    doc.text(`Producto: ${certificate.product_name}`);
    doc.text(`Lugar de Aplicación: ${certificate.application_location}`);
    doc.text(`Responsable: ${certificate.responsible_person}`);
    doc.text(`Fecha de Aplicación: ${moment(certificate.application_date).format('DD/MM/YYYY')}`);
    doc.text(`Hora de Aplicación: ${certificate.application_time}`);
    doc.moveDown();

    if (certificate.chemical_used) {
      doc.text(`Químico Utilizado: ${certificate.chemical_used}`);
    }
    if (certificate.concentration_used) {
      doc.text(`Concentración: ${certificate.concentration_used}`);
    }
    if (certificate.quantity_used) {
      doc.text(`Cantidad: ${certificate.quantity_used} ${certificate.unit_used || ''}`);
    }
    doc.moveDown();

    if (certificate.weather_conditions) {
      doc.text(`Condiciones Climáticas: ${certificate.weather_conditions}`);
    }
    if (certificate.temperature) {
      doc.text(`Temperatura: ${certificate.temperature}°C`);
    }
    if (certificate.humidity) {
      doc.text(`Humedad: ${certificate.humidity}%`);
    }
    doc.moveDown();

    if (certificate.observations) {
      doc.text('Observaciones:');
      doc.fontSize(10).text(certificate.observations);
      doc.moveDown();
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Este documento es generado automáticamente por el Sistema de Inventarios Químicos del MIDA.', { align: 'center' });
    doc.text(`Generado por: ${certificate.created_by_name}`, { align: 'center' });
    doc.text(`Fecha de generación: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
