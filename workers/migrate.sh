#!/bin/bash

# Database Migration Script for Accord and Harmony Foundation
# This script sets up the Cloudflare D1 database

set -e

echo "🚀 Starting database migration..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI is not installed"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

echo "${YELLOW}📋 This script will:${NC}"
echo "  1. Create D1 database (if not exists)"
echo "  2. Apply database schema"
echo "  3. Insert initial data"
echo ""

# Ask for environment
read -p "Which environment? (development/production) [development]: " ENV
ENV=${ENV:-development}

echo ""
echo "${GREEN}✓${NC} Using environment: $ENV"

# Database name based on environment
if [ "$ENV" = "production" ]; then
    DB_NAME="accordharmony-db-prod"
else
    DB_NAME="accordharmony-db-dev"
fi

echo "${YELLOW}🗄️  Database:${NC} $DB_NAME"
echo ""

# Step 1: Create database (if it doesn't exist)
echo "📦 Creating D1 database..."
if wrangler d1 create "$DB_NAME" 2>/dev/null; then
    echo "${GREEN}✓${NC} Database created successfully"
    echo "⚠️  IMPORTANT: Copy the database_id from above and update wrangler.toml"
else
    echo "${YELLOW}ℹ${NC}  Database may already exist (this is fine)"
fi

echo ""
read -p "Press Enter to continue with schema migration..."

# Step 2: Apply schema
echo ""
echo "📝 Applying database schema..."
if wrangler d1 execute "$DB_NAME" --file=./schema.sql --env="$ENV"; then
    echo "${GREEN}✓${NC} Schema applied successfully"
else
    echo "❌ Failed to apply schema"
    exit 1
fi

echo ""
echo "${GREEN}✅ Migration completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update wrangler.toml with the database_id"
echo "  2. Set environment variables in Cloudflare dashboard"
echo "  3. Upload the Jazz Trumpet Master Class PDF to R2 bucket"
echo "  4. Deploy the worker: npm run deploy"
echo ""
