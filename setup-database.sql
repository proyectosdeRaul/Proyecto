-- Script para configurar la base de datos MIDA
-- Ejecutar como usuario postgres

-- Crear la base de datos
CREATE DATABASE mida_chemical_inventory;

-- Crear usuario si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE USER postgres WITH PASSWORD 'admin123';
    END IF;
END
$$;

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE mida_chemical_inventory TO postgres;

-- Conectar a la base de datos
\c mida_chemical_inventory;

-- Dar permisos en el esquema público
GRANT ALL ON SCHEMA public TO postgres;
