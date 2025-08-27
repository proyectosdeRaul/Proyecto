#!/bin/bash

# Script de build para Render
echo "🚀 Iniciando build para Render..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
npm install

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd client
npm install
npm run build
cd ..

echo "✅ Build completado exitosamente!"
