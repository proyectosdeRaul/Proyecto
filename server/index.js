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
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS - Manual configuration for maximum compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

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
      
      // Create chemical inventory table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chemical_inventory (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) CHECK (type IN ('Químico', 'Herramienta')),
          quantity INTEGER DEFAULT 0,
          unit VARCHAR(50) DEFAULT 'unidades',
          location VARCHAR(255),
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla chemical_inventory creada/verificada');

      // Create log tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS discard_logs (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES chemical_inventory(id),
          quantity INTEGER NOT NULL,
          reason TEXT,
          discarded_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS addition_logs (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES chemical_inventory(id),
          quantity INTEGER NOT NULL,
          reason TEXT,
          added_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tablas de logs creadas/verificadas');
      
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

// Test endpoint - super simple
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

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

// Inventory endpoints
app.get('/api/inventory', async (req, res) => {
  try {
    console.log('📦 Obteniendo inventario...');
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chemical_inventory'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📦 Tabla chemical_inventory no existe, creando...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chemical_inventory (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) CHECK (type IN ('Químico', 'Herramienta')),
          quantity INTEGER DEFAULT 0,
          unit VARCHAR(50) DEFAULT 'unidades',
          location VARCHAR(255),
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    const result = await pool.query(
      'SELECT * FROM chemical_inventory ORDER BY created_at DESC'
    );
    
    console.log(`📦 Inventario obtenido: ${result.rows.length} productos`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error obteniendo inventario:', error);
    res.status(500).json({ 
      error: 'Error al obtener el inventario',
      details: error.message 
    });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    console.log('📦 Agregando producto:', req.body);
    const { name, type, quantity, reason, created_by } = req.body;
    
    // Validate required fields
    if (!name || !type || !quantity) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: name, type, quantity' 
      });
    }
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chemical_inventory'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📦 Tabla chemical_inventory no existe, creando...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chemical_inventory (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) CHECK (type IN ('Químico', 'Herramienta')),
          quantity INTEGER DEFAULT 0,
          unit VARCHAR(50) DEFAULT 'unidades',
          location VARCHAR(255),
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    const result = await pool.query(
      `INSERT INTO chemical_inventory (name, type, quantity, unit, location, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, type, quantity, 'unidades', 'Almacén Principal', created_by || 'admin']
    );
    
    console.log('✅ Producto agregado exitosamente:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error agregando producto:', error);
    res.status(500).json({ 
      error: 'Error al agregar el producto',
      details: error.message 
    });
  }
});

app.post('/api/inventory/:id/discard', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, discarded_by } = req.body;
    
    // Verificar que el producto existe y tiene suficiente cantidad
    const checkResult = await pool.query(
      'SELECT * FROM chemical_inventory WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const product = checkResult.rows[0];
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Cantidad insuficiente' });
    }
    
    // Actualizar cantidad
    const updateResult = await pool.query(
      'UPDATE chemical_inventory SET quantity = quantity - $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    
    // Registrar el descarte en una tabla de logs (si existe)
    try {
      await pool.query(
        `INSERT INTO discard_logs (product_id, quantity, reason, discarded_by) 
         VALUES ($1, $2, $3, $4)`,
        [id, quantity, reason, discarded_by || 'admin']
      );
    } catch (logError) {
      console.log('Tabla de logs no existe aún');
    }
    
    res.json({
      message: 'Producto descartado exitosamente',
      product: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error descartando producto:', error);
    res.status(500).json({ error: 'Error al descartar el producto' });
  }
});

app.post('/api/inventory/:id/add-more', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, added_by } = req.body;
    
    // Verificar que el producto existe
    const checkResult = await pool.query(
      'SELECT * FROM chemical_inventory WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Actualizar cantidad
    const updateResult = await pool.query(
      'UPDATE chemical_inventory SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    
    // Registrar la adición en una tabla de logs (si existe)
    try {
      await pool.query(
        `INSERT INTO addition_logs (product_id, quantity, reason, added_by) 
         VALUES ($1, $2, $3, $4)`,
        [id, quantity, reason, added_by || 'admin']
      );
    } catch (logError) {
      console.log('Tabla de logs no existe aún');
    }
    
    res.json({
      message: 'Cantidad añadida exitosamente',
      product: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error añadiendo cantidad:', error);
    res.status(500).json({ error: 'Error al añadir cantidad' });
  }
});

// Areas endpoint
app.get('/api/inventory/areas', (req, res) => {
  try {
    // Return predefined areas for now
    const areas = [
      'PPC Balboa',
      'PPC Cristóbal', 
      'Almacén Central',
      'Laboratorio',
      'Oficina Administrativa'
    ];
    res.json(areas);
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor MIDA corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS configurado para: TODOS LOS ORÍGENES (temporalmente)`);
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
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend esperado en: https://mida-frontend-gpb7.onrender.com`);
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('Error al iniciar servidor:', error);
  process.exit(1);
});