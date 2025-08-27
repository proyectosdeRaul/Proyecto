const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mida_chemical_inventory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Base de datos PostgreSQL conectada exitosamente');
    
    // Create tables if they don't exist
    await createTables();
    
    client.release();
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Users table
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

    // Chemical inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chemical_inventory (
        id SERIAL PRIMARY KEY,
        chemical_name VARCHAR(200) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        concentration VARCHAR(100),
        manufacturer VARCHAR(200),
        lot_number VARCHAR(100),
        expiration_date DATE,
        storage_location VARCHAR(200),
        area VARCHAR(100) NOT NULL DEFAULT 'PPC Balboa' CHECK (area IN ('PPC Balboa', 'PSA', 'Chiriquí', 'Tocumen', 'Colón', 'Bocas del Toro', 'Manzanillo')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discarded', 'expired')),
        registered_by INTEGER REFERENCES users(id),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        discarded_at TIMESTAMP,
        discarded_by INTEGER REFERENCES users(id),
        notes TEXT
      )
    `);

    // Add area column to existing table if it doesn't exist
    await client.query(`
      ALTER TABLE chemical_inventory 
      ADD COLUMN IF NOT EXISTS area VARCHAR(100) DEFAULT 'PPC Balboa' 
      CHECK (area IN ('PPC Balboa', 'PSA', 'Chiriquí', 'Tocumen', 'Colón', 'Bocas del Toro', 'Manzanillo'))
    `);

    // Update existing records that might have the old area names
    await client.query(`
      UPDATE chemical_inventory 
      SET area = 'PPC Balboa' 
      WHERE area = 'PPC Valboa'
    `);

    await client.query(`
      UPDATE chemical_inventory 
      SET area = 'PSA' 
      WHERE area = 'PCA'
    `);

    // Treatment certificates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS treatment_certificates (
        id SERIAL PRIMARY KEY,
        certificate_number VARCHAR(50) UNIQUE NOT NULL,
        treatment_type VARCHAR(100) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        application_location VARCHAR(200) NOT NULL,
        responsible_person VARCHAR(100) NOT NULL,
        application_date DATE NOT NULL,
        application_time TIME NOT NULL,
        chemical_used VARCHAR(200),
        concentration_used VARCHAR(100),
        quantity_used DECIMAL(10,2),
        unit_used VARCHAR(50),
        weather_conditions VARCHAR(100),
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        observations TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Treatment schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS treatment_schedules (
        id SERIAL PRIMARY KEY,
        schedule_number VARCHAR(50) UNIQUE NOT NULL,
        treatment_type VARCHAR(100) NOT NULL,
        location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('puerto', 'fuera_puerto')),
        location_name VARCHAR(200) NOT NULL,
        chemical_name VARCHAR(200) NOT NULL,
        quantity_planned DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        responsible_person VARCHAR(100) NOT NULL,
        area_size DECIMAL(10,2),
        area_unit VARCHAR(20),
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        completed_by INTEGER REFERENCES users(id)
      )
    `);

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (username, password, full_name, email, role, permissions)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (username) DO NOTHING
    `, [
      'admin',
      adminPassword,
      'Administrador del Sistema',
      'admin@mida.gob.pa',
      'admin',
      JSON.stringify({
        inventory: ['read', 'write', 'delete'],
        certificates: ['read', 'write', 'delete'],
        treatments: ['read', 'write', 'delete'],
        users: ['read', 'write', 'delete'],
        reports: ['read', 'write']
      })
    ]);

    console.log('✅ Tablas creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connectDB,
  query: (text, params) => pool.query(text, params)
};
