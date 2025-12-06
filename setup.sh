#!/bin/bash

# CMS Setup Script
# Chạy script này để setup nhanh hệ thống

echo "🚀 CMS Setup Script"
echo "===================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/api && npx prisma generate && cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start MySQL database:"
echo "   docker-compose up -d"
echo ""
echo "2. Update .env with your database credentials"
echo ""
echo "3. Push schema to database:"
echo "   pnpm db:push"
echo ""
echo "4. Seed database with admin user:"
echo "   pnpm db:seed"
echo ""
echo "5. Start development servers:"
echo "   pnpm dev"
echo ""
echo "URLs:"
echo "  - Public Website: http://localhost:3000"
echo "  - API Server:     http://localhost:3001"
echo "  - Admin Panel:    http://localhost:3002"
echo ""
echo "Default login: admin@example.com / admin123"
