# 🚀 Guía de Desarrollo Local - MIDA

## Pasos para ejecutar el sistema localmente

### 1. Configuración inicial
```bash
# Instalar dependencias
npm run install-all
```

### 2. Ejecutar el sistema (MODO SIMPLE - RECOMENDADO)
```bash
# Ejecuta servidor de desarrollo sin base de datos + frontend
npm run dev
```

### 3. Ejecutar con base de datos PostgreSQL (MODO COMPLETO)
Primero configura el archivo `.env` con tu base de datos:
```bash
# Ejecuta servidor completo con PostgreSQL + frontend
npm run dev:full
```

### 4. Ejecutar por separado
```bash
# Terminal 1 - Backend de desarrollo (sin BD)
npm run server:dev

# Terminal 2 - Backend completo (con PostgreSQL)
npm run server

# Terminal 3 - Frontend  
npm run client
```

### 4. Acceder al sistema
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **Credenciales:** admin / Admin123

## Solución de problemas comunes

### Error 404 - Servidor no encontrado
1. Verifica que el backend esté ejecutándose en puerto 5000
2. Ejecuta `npm run server` en una terminal separada
3. Verifica que aparezca "✅ Usuario admin creado/verificado" en la consola

### Error de conexión a base de datos
1. Verifica que PostgreSQL esté instalado y ejecutándose
2. Verifica la URL de conexión en el archivo `.env`
3. Asegúrate de que la base de datos `mida_chemical_inventory` exista

### El login no funciona
1. Verifica que el servidor backend esté ejecutándose
2. Usa exactamente: `admin` / `Admin123`
3. Revisa la consola del navegador para errores específicos
4. Verifica la consola del servidor para logs de errores

## URLs configuradas automáticamente
- **Desarrollo:** http://localhost:5000
- **Producción:** https://mida-backend-gpb7.onrender.com

---
*MIDA - Sistema de Inventarios Químicos*