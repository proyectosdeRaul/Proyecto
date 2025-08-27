const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { requirePermission } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const router = express.Router();

// Generate inventory report
router.get('/inventory', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { start_date, end_date, status, format = 'pdf' } = req.query;

    let query = `
      SELECT ci.*, u.full_name as registered_by_name
      FROM chemical_inventory ci
      LEFT JOIN users u ON ci.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      query += ` AND ci.registered_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND ci.registered_at <= $${paramCount}`;
      params.push(end_date);
    }

    if (status) {
      paramCount++;
      query += ` AND ci.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY ci.registered_at DESC';

    const result = await pool.query(query, params);

    if (format === 'json') {
      return res.json({
        report_type: 'inventory',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date, status },
        total_records: result.rows.length,
        data: result.rows
      });
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-inventario-${moment().format('YYYY-MM-DD')}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MINISTERIO DE DESARROLLO AGROPECUARIO', { align: 'center' });
    doc.fontSize(16).text('Dirección Ejecutiva de Cuarentena', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('REPORTE DE INVENTARIO QUÍMICO', { align: 'center' });
    doc.moveDown();

    // Report info
    doc.fontSize(12);
    doc.text(`Fecha de generación: ${moment().format('DD/MM/YYYY HH:mm')}`);
    doc.text(`Total de registros: ${result.rows.length}`);
    if (start_date || end_date) {
      doc.text(`Período: ${start_date || 'Inicio'} - ${end_date || 'Fin'}`);
    }
    doc.moveDown(2);

    // Table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [80, 120, 60, 80, 100, 80];

    // Draw table headers
    doc.fontSize(10);
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Estado', 'Registrado por', 'Ubicación'];
    let x = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop);
      x += colWidths[i];
    });

    // Draw table rows
    let y = tableTop + 20;
    result.rows.forEach((row, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      x = tableLeft;
      doc.text(moment(row.registered_at).format('DD/MM/YYYY'), x, y);
      x += colWidths[0];
      
      doc.text(row.chemical_name.substring(0, 15), x, y);
      x += colWidths[1];
      
      doc.text(`${row.quantity} ${row.unit}`, x, y);
      x += colWidths[2];
      
      doc.text(row.status, x, y);
      x += colWidths[3];
      
      doc.text(row.registered_by_name || 'N/A', x, y);
      x += colWidths[4];
      
      doc.text(row.storage_location || 'N/A', x, y);

      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generate certificates report
router.get('/certificates', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { start_date, end_date, treatment_type, format = 'pdf' } = req.query;

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

    query += ' ORDER BY tc.application_date DESC';

    const result = await pool.query(query, params);

    if (format === 'json') {
      return res.json({
        report_type: 'certificates',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date, treatment_type },
        total_records: result.rows.length,
        data: result.rows
      });
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-certificados-${moment().format('YYYY-MM-DD')}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MINISTERIO DE DESARROLLO AGROPECUARIO', { align: 'center' });
    doc.fontSize(16).text('Dirección Ejecutiva de Cuarentena', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('REPORTE DE CERTIFICADOS DE TRATAMIENTO', { align: 'center' });
    doc.moveDown();

    // Report info
    doc.fontSize(12);
    doc.text(`Fecha de generación: ${moment().format('DD/MM/YYYY HH:mm')}`);
    doc.text(`Total de certificados: ${result.rows.length}`);
    if (start_date || end_date) {
      doc.text(`Período: ${start_date || 'Inicio'} - ${end_date || 'Fin'}`);
    }
    doc.moveDown(2);

    // Table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [80, 120, 100, 80, 100];

    // Draw table headers
    doc.fontSize(10);
    const headers = ['Fecha', 'Tipo Tratamiento', 'Producto', 'Responsable', 'Ubicación'];
    let x = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop);
      x += colWidths[i];
    });

    // Draw table rows
    let y = tableTop + 20;
    result.rows.forEach((row, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      x = tableLeft;
      doc.text(moment(row.application_date).format('DD/MM/YYYY'), x, y);
      x += colWidths[0];
      
      doc.text(row.treatment_type.substring(0, 15), x, y);
      x += colWidths[1];
      
      doc.text(row.product_name.substring(0, 15), x, y);
      x += colWidths[2];
      
      doc.text(row.responsible_person.substring(0, 15), x, y);
      x += colWidths[3];
      
      doc.text(row.application_location.substring(0, 15), x, y);

      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating certificates report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generate treatments report
router.get('/treatments', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { start_date, end_date, status, location_type, format = 'pdf' } = req.query;

    let query = `
      SELECT ts.*, u.full_name as created_by_name
      FROM treatment_schedules ts
      LEFT JOIN users u ON ts.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

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

    query += ' ORDER BY ts.scheduled_date ASC';

    const result = await pool.query(query, params);

    if (format === 'json') {
      return res.json({
        report_type: 'treatments',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date, status, location_type },
        total_records: result.rows.length,
        data: result.rows
      });
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-tratamientos-${moment().format('YYYY-MM-DD')}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MINISTERIO DE DESARROLLO AGROPECUARIO', { align: 'center' });
    doc.fontSize(16).text('Dirección Ejecutiva de Cuarentena', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('REPORTE DE PROGRAMACIÓN DE TRATAMIENTOS', { align: 'center' });
    doc.moveDown();

    // Report info
    doc.fontSize(12);
    doc.text(`Fecha de generación: ${moment().format('DD/MM/YYYY HH:mm')}`);
    doc.text(`Total de programaciones: ${result.rows.length}`);
    if (start_date || end_date) {
      doc.text(`Período: ${start_date || 'Inicio'} - ${end_date || 'Fin'}`);
    }
    doc.moveDown(2);

    // Table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [80, 100, 80, 100, 80, 80];

    // Draw table headers
    doc.fontSize(10);
    const headers = ['Fecha', 'Tipo', 'Estado', 'Responsable', 'Ubicación', 'Prioridad'];
    let x = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop);
      x += colWidths[i];
    });

    // Draw table rows
    let y = tableTop + 20;
    result.rows.forEach((row, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      x = tableLeft;
      doc.text(moment(row.scheduled_date).format('DD/MM/YYYY'), x, y);
      x += colWidths[0];
      
      doc.text(row.treatment_type.substring(0, 12), x, y);
      x += colWidths[1];
      
      doc.text(row.status, x, y);
      x += colWidths[2];
      
      doc.text(row.responsible_person.substring(0, 12), x, y);
      x += colWidths[3];
      
      doc.text(row.location_name.substring(0, 12), x, y);
      x += colWidths[4];
      
      doc.text(row.priority, x, y);

      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating treatments report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generate comprehensive monthly report
router.get('/monthly/:year/:month', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { year, month } = req.params;
    const { format = 'pdf' } = req.query;

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

    // Get inventory stats
    const inventoryStats = await pool.query(`
      SELECT 
        COUNT(*) as total_chemicals,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_chemicals,
        COUNT(CASE WHEN status = 'discarded' THEN 1 END) as discarded_chemicals,
        SUM(CASE WHEN status = 'active' THEN quantity ELSE 0 END) as total_quantity
      FROM chemical_inventory
      WHERE registered_at >= $1 AND registered_at <= $2
    `, [startDate, endDate]);

    // Get certificates stats
    const certificatesStats = await pool.query(`
      SELECT COUNT(*) as total_certificates
      FROM treatment_certificates
      WHERE application_date >= $1 AND application_date <= $2
    `, [startDate, endDate]);

    // Get treatments stats
    const treatmentsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_treatments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_treatments,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_treatments
      FROM treatment_schedules
      WHERE scheduled_date >= $1 AND scheduled_date <= $2
    `, [startDate, endDate]);

    const reportData = {
      period: `${month}/${year}`,
      inventory: inventoryStats.rows[0],
      certificates: certificatesStats.rows[0],
      treatments: treatmentsStats.rows[0]
    };

    if (format === 'json') {
      return res.json({
        report_type: 'monthly_comprehensive',
        generated_at: new Date().toISOString(),
        period: reportData.period,
        data: reportData
      });
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-mensual-${year}-${month}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MINISTERIO DE DESARROLLO AGROPECUARIO', { align: 'center' });
    doc.fontSize(16).text('Dirección Ejecutiva de Cuarentena', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('REPORTE MENSUAL COMPREHENSIVO', { align: 'center' });
    doc.moveDown();

    // Report info
    doc.fontSize(14);
    doc.text(`Período: ${moment(startDate).format('MMMM YYYY')}`, { align: 'center' });
    doc.text(`Fecha de generación: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Inventory section
    doc.fontSize(16).text('INVENTARIO QUÍMICO', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total de productos químicos: ${reportData.inventory.total_chemicals}`);
    doc.text(`Productos activos: ${reportData.inventory.active_chemicals}`);
    doc.text(`Productos descartados: ${reportData.inventory.discarded_chemicals}`);
    doc.text(`Cantidad total en inventario: ${reportData.inventory.total_quantity || 0}`);
    doc.moveDown(2);

    // Certificates section
    doc.fontSize(16).text('CERTIFICADOS DE TRATAMIENTO', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total de certificados generados: ${reportData.certificates.total_certificates}`);
    doc.moveDown(2);

    // Treatments section
    doc.fontSize(16).text('PROGRAMACIÓN DE TRATAMIENTOS', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total de tratamientos programados: ${reportData.treatments.total_treatments}`);
    doc.text(`Tratamientos completados: ${reportData.treatments.completed_treatments}`);
    doc.text(`Tratamientos pendientes: ${reportData.treatments.scheduled_treatments}`);
    doc.moveDown(2);

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Este reporte es generado automáticamente por el Sistema de Inventarios Químicos del MIDA.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get available report types
router.get('/types', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const reportTypes = [
      {
        id: 'inventory',
        name: 'Reporte de Inventario',
        description: 'Reporte detallado del inventario de productos químicos',
        endpoint: '/api/reports/inventory',
        filters: ['start_date', 'end_date', 'status']
      },
      {
        id: 'certificates',
        name: 'Reporte de Certificados',
        description: 'Reporte de certificados de tratamiento generados',
        endpoint: '/api/reports/certificates',
        filters: ['start_date', 'end_date', 'treatment_type']
      },
      {
        id: 'treatments',
        name: 'Reporte de Tratamientos',
        description: 'Reporte de programación de tratamientos químicos',
        endpoint: '/api/reports/treatments',
        filters: ['start_date', 'end_date', 'status', 'location_type']
      },
      {
        id: 'monthly',
        name: 'Reporte Mensual',
        description: 'Reporte mensual comprehensivo de todas las actividades',
        endpoint: '/api/reports/monthly/:year/:month',
        filters: ['year', 'month']
      }
    ];

    res.json(reportTypes);
  } catch (error) {
    console.error('Error getting report types:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
