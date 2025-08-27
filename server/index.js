const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize database tables
const initDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Create inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        quantity VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        date_added DATE NOT NULL,
        time_added TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create discard_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS discard_logs (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id),
        quantity_discarded VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        date_discarded DATE NOT NULL,
        time_discarded TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create add_more_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS add_more_logs (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id),
        quantity_added VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        date_added DATE NOT NULL,
        time_added TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
};

// Initialize database on startup
initDatabase();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Inventarios Químicos - MIDA',
    version: '1.0.0',
    status: 'Servidor funcionando correctamente',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      inventory: '/api/inventory',
      certificates: '/api/certificates',
      treatments: '/api/treatments',
      users: '/api/users',
      reports: '/api/reports'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Inventory endpoints
app.get('/api/inventory', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM inventory ORDER BY created_at DESC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener el inventario' });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { name, type, quantity, reason } = req.body;
    
    if (!name || !type || !quantity || !reason) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const now = new Date();
    const client = await pool.connect();
    
    const result = await client.query(`
      INSERT INTO inventory (name, type, quantity, reason, user_name, date_added, time_added, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, type, quantity, reason, 'admin', now.toISOString().split('T')[0], now.toTimeString().split(' ')[0], 'Activo']);

    client.release();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar químico:', error);
    res.status(500).json({ error: 'Error al agregar el químico' });
  }
});

app.post('/api/inventory/:id/discard', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_discarded, reason } = req.body;
    
    if (!quantity_discarded || !reason) {
      return res.status(400).json({ error: 'Cantidad y motivo son requeridos' });
    }

    const now = new Date();
    const client = await pool.connect();
    
    // Log the discard
    await client.query(`
      INSERT INTO discard_logs (inventory_id, quantity_discarded, reason, user_name, date_discarded, time_discarded)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, quantity_discarded, reason, 'admin', now.toISOString().split('T')[0], now.toTimeString().split(' ')[0]]);

    client.release();
    res.json({ message: 'Descartes registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar descarte:', error);
    res.status(500).json({ error: 'Error al registrar el descarte' });
  }
});

app.post('/api/inventory/:id/add-more', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_added, reason } = req.body;
    
    if (!quantity_added || !reason) {
      return res.status(400).json({ error: 'Cantidad y motivo son requeridos' });
    }

    const now = new Date();
    const client = await pool.connect();
    
    // Log the addition
    await client.query(`
      INSERT INTO add_more_logs (inventory_id, quantity_added, reason, user_name, date_added, time_added)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, quantity_added, reason, 'admin', now.toISOString().split('T')[0], now.toTimeString().split(' ')[0]]);

    client.release();
    res.json({ message: 'Adición registrada correctamente' });
  } catch (error) {
    console.error('Error al registrar adición:', error);
    res.status(500).json({ error: 'Error al registrar la adición' });
  }
});

// Auth endpoints (placeholder)
app.post('/api/auth/login', (req, res) => {
  res.json({
    message: 'Login endpoint',
    token: 'dummy-token'
  });
});

// Certificates endpoints (placeholder)
app.get('/api/certificates', (req, res) => {
  res.json([
    { id: 1, type: 'Fumigación', product: 'Cloruro de Sodio', date: '2024-01-15', status: 'Generado' },
    { id: 2, type: 'Aspersión', product: 'Hipoclorito de Calcio', date: '2024-01-10', status: 'Pendiente' }
  ]);
});

// Treatments endpoints (placeholder)
app.get('/api/treatments', (req, res) => {
  res.json([
    { id: 1, type: 'Fumigación', location: 'Puerto de Panamá', date: '2024-01-20', status: 'Programado' },
    { id: 2, type: 'Aspersión', location: 'Almacén Central', date: '2024-01-18', status: 'En Progreso' }
  ]);
});

// Users endpoints (placeholder)
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Admin', role: 'Administrador', email: 'admin@mida.gob.pa', status: 'Activo' },
    { id: 2, name: 'Usuario', role: 'Operativo', email: 'user@mida.gob.pa', status: 'Activo' }
  ]);
});

// Reports endpoints (placeholder)
app.get('/api/reports', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as count FROM inventory');
    client.release();
    
    res.json({
      inventory: parseInt(result.rows[0].count),
      certificates: 2,
      treatments: 2,
      users: 2
    });
  } catch (error) {
    res.json({
      inventory: 0,
      certificates: 2,
      treatments: 2,
      users: 2
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor MIDA corriendo en puerto ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET  / (información del servidor)`);
  console.log(`   - GET  /api/health (estado del servidor)`);
  console.log(`   - GET  /api/inventory (obtener inventario)`);
  console.log(`   - POST /api/inventory (agregar químico)`);
  console.log(`   - POST /api/inventory/:id/discard (registrar descarte)`);
  console.log(`   - POST /api/inventory/:id/add-more (registrar adición)`);
  console.log(`   - POST /api/auth/login (autenticación)`);
  console.log(`   - GET  /api/certificates (constancias)`);
  console.log(`   - GET  /api/treatments (tratamientos)`);
  console.log(`   - GET  /api/users (usuarios)`);
  console.log(`   - GET  /api/reports (reportes)`);
});
