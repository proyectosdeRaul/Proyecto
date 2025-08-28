const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
let pool;

if (process.env.DATABASE_URL) {
  // Production with DATABASE_URL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
  // Development with individual parameters
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mida_chemical_inventory',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

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

// Initialize database
const initDatabase = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`🔄 Intentando conectar a la base de datos... (${6-retries}/5)`);
      const client = await pool.connect();
      console.log('✅ Base de datos PostgreSQL conectada exitosamente');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
          permissions JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create default admin user if it doesn't exist
      const adminPassword = await bcrypt.hash('Admin123', 10);
      
      await client.query(`
        INSERT INTO users (username, password, full_name, email, role, permissions, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (username) DO NOTHING
      `, [
        'admin',
        adminPassword,
        'Administrador MIDA',
        'admin@mida.gob.pa',
        'admin',
        JSON.stringify({
          inventory: ['read', 'write', 'delete'],
          certificates: ['read', 'write', 'delete'],
          treatments: ['read', 'write', 'delete'],
          users: ['read', 'write', 'delete'],
          reports: ['read', 'write']
        }),
        true
      ]);

      console.log('✅ Usuario admin creado/verificado: admin / Admin123');
      
      client.release();
      console.log('✅ Base de datos inicializada correctamente');
      return;
    } catch (error) {
      console.error(`❌ Error inicializando base de datos (intento ${6-retries}/5):`, error.message);
      retries--;
      if (retries > 0) {
        console.log(`⏳ Reintentando en 5 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('❌ No se pudo conectar a la base de datos después de 5 intentos');
        console.log('🔧 El servidor continuará sin base de datos (modo degradado)');
      }
    }
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

// Auth login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos'
      });
    }

    try {
      // Try database login first
      const result = await pool.query(
        'SELECT id, username, password, full_name, role, permissions, is_active FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({ error: 'Usuario inactivo' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role 
        },
        process.env.JWT_SECRET || 'mida_jwt_secret_development_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Update last login
      await pool.query(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      res.json({
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          permissions: user.permissions
        }
      });

    } catch (dbError) {
      // Fallback to hardcoded admin login if database fails
      console.log('🔧 Base de datos no disponible, usando autenticación de respaldo');
      
      if (username === 'admin' && password === 'Admin123') {
        const token = jwt.sign(
          { 
            userId: 1, 
            username: 'admin',
            role: 'admin' 
          },
          process.env.JWT_SECRET || 'mida_jwt_secret_development_2024',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
          message: 'Inicio de sesión exitoso (modo degradado)',
          token,
          user: {
            id: 1,
            username: 'admin',
            fullName: 'Administrador MIDA',
            role: 'admin',
            permissions: {
              inventory: ['read', 'write', 'delete'],
              certificates: ['read', 'write', 'delete'],
              treatments: ['read', 'write', 'delete'],
              users: ['read', 'write', 'delete'],
              reports: ['read', 'write']
            }
          }
        });
      } else {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Auth verify endpoint
app.get('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mida_jwt_secret_development_2024');
    
    const result = await pool.query(
      'SELECT id, username, full_name, role, permissions, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        permissions: user.permissions
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    res.status(403).json({ error: 'Token inválido' });
  }
});

// Basic inventory endpoints (placeholder for now)
app.get('/api/inventory', (req, res) => {
  res.json([]);
});

app.get('/api/certificates', (req, res) => {
  res.json([]);
});

app.get('/api/treatments', (req, res) => {
  res.json([]);
});

app.get('/api/users', (req, res) => {
  res.json([]);
});

app.get('/api/reports', (req, res) => {
  res.json({
    inventory: 0,
    certificates: 0,
    treatments: 0,
    users: 1
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor MIDA corriendo en puerto ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET  / (información del servidor)`);
  console.log(`   - GET  /api/health (estado del servidor)`);
  console.log(`   - POST /api/auth/login (autenticación)`);
  console.log(`   - GET  /api/auth/verify (verificar token)`);
  console.log(`   - GET  /api/inventory (inventario)`);
  console.log(`   - GET  /api/certificates (constancias)`);
  console.log(`   - GET  /api/treatments (tratamientos)`);
  console.log(`   - GET  /api/users (usuarios)`);
  console.log(`   - GET  /api/reports (reportes)`);
});