const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
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

// Database connection and initialization
const { connectDB } = require('./config/database');

// Initialize database on startup
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const certificatesRoutes = require('./routes/certificates');
const treatmentsRoutes = require('./routes/treatments');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');

// Authentication middleware
const authenticateToken = require('./middleware/auth');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/certificates', authenticateToken, certificatesRoutes);
app.use('/api/treatments', authenticateToken, treatmentsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);

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
