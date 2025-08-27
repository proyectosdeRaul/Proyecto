# Guía de Despliegue en Render

## Pasos para desplegar el Sistema MIDA en Render

### 1. Preparación del Repositorio

1. **Subir a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MIDA Chemical Inventory System"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/mida-chemical-inventory.git
   git push -u origin main
   ```

### 2. Configuración en Render

#### 2.1 Crear Base de Datos PostgreSQL
1. Ir a [Render Dashboard](https://dashboard.render.com)
2. Click en "New" → "PostgreSQL"
3. Configurar:
   - **Name**: `mida-postgres`
   - **Database**: `mida_chemical_inventory`
   - **User**: `mida_user`
   - **Plan**: Free
4. Click "Create Database"
5. Guardar las credenciales de conexión

#### 2.2 Crear Servicio Backend
1. Click en "New" → "Web Service"
2. Conectar el repositorio de GitHub
3. Configurar:
   - **Name**: `mida-backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 2.3 Variables de Entorno del Backend
Configurar las siguientes variables:
```
NODE_ENV=production
PORT=10000
DB_HOST=[host de la base de datos]
DB_PORT=5432
DB_NAME=mida_chemical_inventory
DB_USER=[usuario de la base de datos]
DB_PASSWORD=[contraseña de la base de datos]
JWT_SECRET=[generar una clave secreta segura]
JWT_EXPIRES_IN=24h
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

#### 2.4 Crear Servicio Frontend
1. Click en "New" → "Static Site"
2. Conectar el mismo repositorio
3. Configurar:
   - **Name**: `mida-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`
   - **Plan**: Free

#### 2.5 Variables de Entorno del Frontend
Configurar:
```
REACT_APP_API_URL=https://mida-backend.onrender.com/api
```

### 3. Configuración de Dominios

#### 3.1 Backend
- URL: `https://mida-backend.onrender.com`
- Endpoint API: `https://mida-backend.onrender.com/api`

#### 3.2 Frontend
- URL: `https://mida-frontend.onrender.com`

### 4. Verificación del Despliegue

1. **Verificar Base de Datos:**
   - Las tablas se crearán automáticamente al iniciar el backend
   - Usuario admin por defecto: `admin` / `admin123`

2. **Verificar Backend:**
   - Health check: `https://mida-backend.onrender.com/api/health`
   - Debe responder con status 200

3. **Verificar Frontend:**
   - Acceder a la URL del frontend
   - Probar login con credenciales admin

### 5. Configuración de CORS

El backend ya está configurado para aceptar peticiones del frontend. Si hay problemas de CORS, verificar que las URLs estén correctamente configuradas.

### 6. Monitoreo y Logs

- **Logs del Backend**: Disponibles en el dashboard de Render
- **Logs de la Base de Datos**: Disponibles en el dashboard de Render
- **Métricas**: Render proporciona métricas básicas en el plan gratuito

### 7. Actualizaciones

Para actualizar el sistema:
1. Hacer cambios en el código
2. Commit y push a GitHub
3. Render detectará automáticamente los cambios y redeployará

### 8. Resolución de Problemas

#### Error de Conexión a Base de Datos
- Verificar variables de entorno
- Verificar que la base de datos esté activa
- Revisar logs del backend

#### Error de Build del Frontend
- Verificar que todas las dependencias estén en package.json
- Revisar logs de build en Render

#### Error de CORS
- Verificar REACT_APP_API_URL en el frontend
- Verificar configuración de CORS en el backend

### 9. Seguridad

- Cambiar JWT_SECRET por una clave segura
- Cambiar contraseña del usuario admin después del primer login
- Configurar HTTPS (automático en Render)
- Revisar logs regularmente

### 10. Backup

- La base de datos PostgreSQL en Render incluye backups automáticos
- Considerar exportar datos regularmente para respaldo adicional

---

**Nota**: Este sistema está configurado para el plan gratuito de Render. Para producción, considerar actualizar a planes pagados para mejor rendimiento y soporte.
