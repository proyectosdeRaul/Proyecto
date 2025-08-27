const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Simulated database for inventory
let inventory = [
  {
    id: 1,
    name: 'Herbicida X',
    type: 'Herbicida',
    quantity: '20',
    status: 'Activo',
    user: 'admin',
    date: '2024-01-15',
    time: '10:30:00',
    reason: 'Control de malezas en área de cuarentena'
  },
  {
    id: 2,
    name: 'Fertilizante Y',
    type: 'Fertilizante',
    quantity: '15',
    status: 'Activo',
    user: 'admin',
    date: '2024-01-10',
    time: '14:20:00',
    reason: 'Mantenimiento de plantas en invernadero'
  }
];

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
app.get('/api/inventory', (req, res) => {
  try {
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el inventario' });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    const { name, type, quantity, reason } = req.body;
    
    if (!name || !type || !quantity || !reason) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const now = new Date();
    const newChemical = {
      id: Date.now(),
      name,
      type,
      quantity,
      reason,
      user: 'admin', // Usuario actual
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      status: 'Activo'
    };

    inventory.push(newChemical);
    res.status(201).json(newChemical);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el químico' });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = inventory.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Químico no encontrado' });
    }

    inventory.splice(index, 1);
    res.json({ message: 'Químico eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el químico' });
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
app.get('/api/reports', (req, res) => {
  res.json({
    inventory: inventory.length,
    certificates: 2,
    treatments: 2,
    users: 2
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor MIDA corriendo en puerto ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET  / (información del servidor)`);
  console.log(`   - GET  /api/health (estado del servidor)`);
  console.log(`   - GET  /api/inventory (obtener inventario)`);
  console.log(`   - POST /api/inventory (agregar químico)`);
  console.log(`   - DELETE /api/inventory/:id (eliminar químico)`);
  console.log(`   - POST /api/auth/login (autenticación)`);
  console.log(`   - GET  /api/certificates (constancias)`);
  console.log(`   - GET  /api/treatments (tratamientos)`);
  console.log(`   - GET  /api/users (usuarios)`);
  console.log(`   - GET  /api/reports (reportes)`);
});
