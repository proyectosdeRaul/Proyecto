# Sistema de Inventarios Químicos - MIDA

Sistema web moderno para el control, registro y generación de reportes sobre productos químicos utilizados en tratamientos cuarentenarios del Ministerio de Desarrollo Agropecuario (MIDA) - Dirección Ejecutiva de Cuarentena.

## 🚀 Características

- **Autenticación Segura**: Sistema de login con JWT y control de roles
- **Gestión de Inventario**: Registro, actualización y descarte de productos químicos
- **Certificados de Tratamiento**: Generación de constancias oficiales en PDF
- **Programación de Tratamientos**: Agendamiento y control de aplicaciones químicas
- **Reportes Automáticos**: Generación de reportes en PDF con filtros por fecha
- **Panel de Administración**: Gestión de usuarios y permisos
- **Interfaz Moderna**: Diseño responsive con colores institucionales del MIDA

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **PostgreSQL** como base de datos
- **JWT** para autenticación
- **bcryptjs** para encriptación de contraseñas
- **PDFKit** para generación de reportes
- **Helmet** para seguridad

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **React Query** para manejo de estado
- **React Hook Form** para formularios
- **Lucide React** para iconos
- **React Hot Toast** para notificaciones

## 📋 Requisitos Previos

- Node.js 16+ 
- PostgreSQL 12+
- npm o yarn

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd mida-chemical-inventory
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar las variables de entorno
nano .env
```

Configurar las siguientes variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mida_chemical_inventory
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Instalar dependencias
```bash
# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd client
npm install
cd ..
```

### 4. Configurar la base de datos
```bash
# Crear la base de datos en PostgreSQL
createdb mida_chemical_inventory

# Las tablas se crearán automáticamente al iniciar el servidor
```

### 5. Iniciar el desarrollo
```bash
# Iniciar backend y frontend simultáneamente
npm run dev

# O iniciar por separado:
npm run server    # Backend en puerto 5000
npm run client    # Frontend en puerto 3000
```

## 🗄️ Estructura de la Base de Datos

El sistema crea automáticamente las siguientes tablas:

### users
- Gestión de usuarios y permisos
- Roles: admin, user
- Permisos granulares por módulo

### chemical_inventory
- Registro de productos químicos
- Estados: active, discarded, expired
- Trazabilidad completa

### treatment_certificates
- Certificados de tratamiento
- Generación automática de números
- Exportación a PDF

### treatment_schedules
- Programación de tratamientos
- Estados: scheduled, in_progress, completed, cancelled
- Ubicaciones: puerto, fuera_puerto

## 👤 Usuarios por Defecto

Al iniciar el sistema se crea automáticamente un usuario administrador:

- **Usuario**: admin
- **Contraseña**: admin123
- **Rol**: Administrador con todos los permisos

## 🔐 Sistema de Permisos

### Roles
- **admin**: Acceso total a todos los módulos
- **user**: Acceso limitado según permisos asignados

### Módulos
- **inventory**: Gestión de inventario
- **certificates**: Gestión de certificados
- **treatments**: Gestión de tratamientos
- **users**: Gestión de usuarios (solo admin)
- **reports**: Generación de reportes

### Acciones
- **read**: Lectura de datos
- **write**: Creación y edición
- **delete**: Eliminación de registros

## 📊 Funcionalidades Principales

### 1. Gestión de Inventario
- Registro de productos químicos
- Actualización de cantidades
- Descarte de productos
- Búsqueda y filtros
- Estadísticas en tiempo real

### 2. Certificados de Tratamiento
- Generación automática de números
- Formularios completos
- Exportación a PDF
- Historial de certificados

### 3. Programación de Tratamientos
- Agendamiento de tratamientos
- Control de estados
- Ubicaciones (puerto/fuera puerto)
- Prioridades y notas

### 4. Reportes
- Reporte de inventario
- Reporte de certificados
- Reporte de tratamientos
- Reporte mensual comprehensivo
- Exportación en PDF

### 5. Administración
- Gestión de usuarios
- Asignación de permisos
- Control de acceso
- Auditoría de actividades

## 🚀 Despliegue en Render

### 1. Configurar PostgreSQL en Render
1. Crear una nueva base de datos PostgreSQL
2. Copiar las credenciales de conexión

### 2. Configurar el Backend
1. Conectar el repositorio a Render
2. Configurar las variables de entorno:
   ```env
   DB_HOST=your-render-postgres-host
   DB_PORT=5432
   DB_NAME=your-database-name
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   PORT=10000
   ```

### 3. Configurar el Frontend
1. Crear un nuevo servicio web en Render
2. Configurar el build command: `cd client && npm install && npm run build`
3. Configurar el start command: `npm start`
4. Configurar las variables de entorno:
   ```env
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia backend y frontend
npm run server       # Solo backend
npm run client       # Solo frontend

# Producción
npm run build        # Construye el frontend
npm start           # Inicia el servidor de producción

# Utilidades
npm run install-all  # Instala todas las dependencias
```

## 📁 Estructura del Proyecto

```
mida-chemical-inventory/
├── server/                 # Backend
│   ├── config/            # Configuración de BD
│   ├── middleware/        # Middleware de autenticación
│   ├── routes/           # Rutas de la API
│   └── index.js          # Servidor principal
├── client/               # Frontend
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # Contextos (Auth)
│   │   ├── services/     # Servicios de API
│   │   ├── types/        # Tipos TypeScript
│   │   └── App.tsx       # Componente principal
│   └── package.json
├── package.json          # Dependencias del backend
└── README.md
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verificar que PostgreSQL esté ejecutándose
- Confirmar las credenciales en `.env`
- Verificar que la base de datos exista

### Error de CORS
- Verificar que la URL del frontend esté en la configuración de CORS
- En producción, configurar las URLs correctas

### Error de autenticación
- Verificar que el JWT_SECRET esté configurado
- Limpiar el localStorage del navegador
- Verificar que el token no haya expirado

## 📞 Soporte

Para soporte técnico o reportar problemas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

## 📄 Licencia

Este proyecto es propiedad del Ministerio de Desarrollo Agropecuario (MIDA) - Dirección Ejecutiva de Cuarentena.

---

**Desarrollado para el Ministerio de Desarrollo Agropecuario - Dirección Ejecutiva de Cuarentena**
