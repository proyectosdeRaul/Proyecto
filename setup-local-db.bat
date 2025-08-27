@echo off
echo Configurando base de datos PostgreSQL para MIDA...
echo.

REM Verificar si PostgreSQL está instalado
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL no está instalado o no está en el PATH
    echo Por favor instala PostgreSQL desde: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo PostgreSQL encontrado. Configurando base de datos...

REM Crear la base de datos
echo Creando base de datos mida_chemical_inventory...
psql -U postgres -c "CREATE DATABASE mida_chemical_inventory;" 2>nul
if %errorlevel% equ 0 (
    echo Base de datos creada exitosamente
) else (
    echo La base de datos ya existe o hubo un error
)

REM Configurar contraseña para el usuario postgres si es necesario
echo Configurando usuario postgres...
psql -U postgres -c "ALTER USER postgres PASSWORD 'admin123';" 2>nul

echo.
echo Configuración completada!
echo.
echo Para iniciar el sistema:
echo 1. Asegúrate de que PostgreSQL esté ejecutándose
echo 2. Ejecuta: npm run dev
echo.
pause
