#!/bin/bash

echo "🚀 Building MIDA Frontend..."

# Go to client directory
cd client

# Install dependencies
echo "📦 Installing client dependencies..."
npm install

# Build the application
echo "🔨 Building React application..."
npm run build

echo "✅ Frontend build completed!"
