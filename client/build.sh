#!/bin/bash

echo "🚀 Building MIDA Frontend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building React application..."
npm run build

echo "✅ Frontend build completed!"
