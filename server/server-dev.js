const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Datos en memoria para desarrollo
let users = [];
let inventory = [];

// Inicializar usuario admin
const initUsers = async () => {
  const adminPassword = await bcrypt.hash('Admin123', 10);
  users.push({
    id: 1,
    username: 'admin',
    password: adminPassword,
    fullName: 'Administrador MIDA',
    role: 'admin',
    permissions: {
      inventory: ['read', 'write', 'delete'],
      certificates: ['read', 'write', 'delete'],
      treatments: ['read', 'write', 'delete'],
      users: ['read', 'write', 'delete'],
      reports: ['read', 'write']
    }
  });

  // Datos de ejemplo para el inventario
  inventory.push({
    id: 1,
    chemical_name: 'Herbicida',
    quantity: 20,
    unit: 'kg',
    area: 'PPC Balboa',
    status: 'active',
    registered_by_name: 'admin',
    registered_at: new Date().toISOString()
  });

  console.log('✅ Usuario admin creado: admin / Admin123');
  console.log('✅ Datos de ejemplo cargados');
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Simular JWT token
    const token = 'dev-token-' + Date.now();

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  // En desarrollo, siempre devolver el usuario admin
  const user = users[0];
  res.json({
    valid: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions
    }
  });
});

// Rutas de inventario
app.get('/api/inventory/areas', (req, res) => {
  const areas = ['PPC Balboa', 'PSA', 'Chiriquí', 'Tocumen', 'Colón', 'Bocas del Toro', 'Manzanillo'];
  res.json(areas);
});

app.get('/api/inventory', (req, res) => {
  const { area } = req.query;
  let filteredInventory = inventory;
  
  if (area) {
    filteredInventory = inventory.filter(item => item.area === area);
  }
  
  res.json(filteredInventory);
});

app.post('/api/inventory', (req, res) => {
  try {
    const { chemical_name, quantity, unit, area } = req.body;
    
    const newItem = {
      id: inventory.length + 1,
      chemical_name,
      quantity,
      unit,
      area,
      status: 'active',
      registered_by_name: 'admin',
      registered_at: new Date().toISOString()
    };
    
    inventory.push(newItem);
    res.status(201).json({
      message: 'Producto químico registrado exitosamente',
      chemical: newItem
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.patch('/api/inventory/:id/discard', (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const item = inventory.find(i => i.id == id);
    if (!item) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    item.status = 'discarded';
    item.discarded_at = new Date().toISOString();
    item.notes = notes;
    
    res.json({
      message: 'Producto químico descartado exitosamente',
      chemical: item
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de información del servidor
app.get('/', (req, res) => {
  res.json({
    message: 'MIDA - Sistema de Inventarios (Servidor de Desarrollo)',
    status: 'running',
    mode: 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mode: 'development' });
});

// Inicializar y ejecutar servidor
const startServer = async () => {
  await initUsers();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de desarrollo MIDA corriendo en puerto ${PORT}`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   - GET  http://localhost:${PORT}/ (información del servidor)`);
    console.log(`   - GET  http://localhost:${PORT}/api/health (estado del servidor)`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/login (autenticación)`);
    console.log(`   - GET  http://localhost:${PORT}/api/inventory (obtener inventario)`);
    console.log(`   - POST http://localhost:${PORT}/api/inventory (agregar químico)`);
    console.log(`🔐 Credenciales: admin / Admin123`);
  });
};

startServer();