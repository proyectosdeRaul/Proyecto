# 🔐 Credenciales del Sistema MIDA

## Credenciales de Acceso

### Usuario Administrador
- **Usuario:** `admin`
- **Contraseña:** `Admin123`
- **Rol:** Administrador
- **Permisos:** Acceso completo a todo el sistema

## Información Adicional

- Las credenciales se crean automáticamente al iniciar el servidor por primera vez
- Si las credenciales no funcionan, reinicia el servidor para que se ejecute el script de creación de usuario
- El usuario admin tiene permisos completos para:
  - ✅ Gestión de Inventario (crear, leer, actualizar, eliminar)
  - ✅ Gestión de Certificados (crear, leer, actualizar, eliminar)  
  - ✅ Gestión de Tratamientos (crear, leer, actualizar, eliminar)
  - ✅ Gestión de Usuarios (crear, leer, actualizar, eliminar)
  - ✅ Generación de Reportes (leer, crear)

## En caso de problemas

Si el login no funciona:
1. Verifica que el servidor backend esté ejecutándose
2. Verifica la conexión a la base de datos
3. Revisa los logs del servidor para errores
4. Asegúrate de escribir exactamente: `admin` / `Admin123`

---
*Generado automáticamente - MIDA Sistema de Inventarios*