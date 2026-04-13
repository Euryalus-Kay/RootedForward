#!/bin/bash
# deploy.sh — Helper script for deploying Rooted Forward
# Usage: ./deploy.sh [command]
#
# Commands:
#   setup      Install dependencies and verify environment
#   dev        Start the development server
#   build      Run a production build locally
#   check      Run TypeScript type checking and linting
#   db:migrate Show instructions for running the Supabase migration
#   deploy     Deploy to Vercel (requires Vercel CLI)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

command="${1:-help}"

check_env() {
  local missing=0
  local vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "NEXT_PUBLIC_MAPBOX_TOKEN")

  for var in "${vars[@]}"; do
    if [ -z "${!var}" ] && ! grep -q "^${var}=" .env.local 2>/dev/null; then
      echo -e "${YELLOW}⚠  Missing: ${var}${NC}"
      missing=1
    fi
  done

  if [ $missing -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Some environment variables are not set.${NC}"
    echo "Copy .env.example to .env.local and fill in your values:"
    echo "  cp .env.example .env.local"
    return 1
  else
    echo -e "${GREEN}✓ All environment variables configured${NC}"
    return 0
  fi
}

case $command in
  setup)
    echo "🔧 Setting up Rooted Forward..."
    echo ""

    # Check Node.js
    if ! command -v node &> /dev/null; then
      echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

    # Install dependencies
    echo ""
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"

    # Check environment
    echo ""
    echo "Checking environment variables..."
    check_env || true

    # Check for .env.local
    if [ ! -f .env.local ]; then
      echo ""
      echo -e "${YELLOW}⚠  No .env.local file found${NC}"
      echo "  Run: cp .env.example .env.local"
      echo "  Then fill in your Supabase and Mapbox credentials"
    fi

    echo ""
    echo -e "${GREEN}Setup complete!${NC}"
    echo "Next steps:"
    echo "  1. Set up your .env.local file"
    echo "  2. Run the SQL migration in Supabase"
    echo "  3. Run: npm run dev"
    ;;

  dev)
    echo "🚀 Starting development server..."
    npm run dev
    ;;

  build)
    echo "🏗️  Building for production..."
    npm run build
    echo -e "${GREEN}✓ Build successful${NC}"
    ;;

  check)
    echo "🔍 Running checks..."
    echo ""
    echo "TypeScript..."
    npx tsc --noEmit
    echo -e "${GREEN}✓ TypeScript passed${NC}"
    echo ""
    echo "Linting..."
    npm run lint
    echo -e "${GREEN}✓ Lint passed${NC}"
    ;;

  db:migrate)
    echo "📦 Database Migration Instructions"
    echo ""
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Paste the contents of: supabase/migrations/001_initial_schema.sql"
    echo "4. Click 'Run'"
    echo ""
    echo "This will create all tables, indexes, RLS policies, storage"
    echo "buckets, triggers, and seed data for cities, stops, and podcasts."
    echo ""
    echo "File location: $(pwd)/supabase/migrations/001_initial_schema.sql"
    ;;

  deploy)
    echo "🚀 Deploying to Vercel..."

    if ! command -v vercel &> /dev/null; then
      echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
      npm i -g vercel
    fi

    echo ""
    echo "Make sure you have set these environment variables in Vercel:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - NEXT_PUBLIC_MAPBOX_TOKEN"
    echo "  - NEXT_PUBLIC_SITE_URL"
    echo ""

    vercel --prod
    ;;

  help|*)
    echo "Rooted Forward — Deployment Helper"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup       Install dependencies and verify environment"
    echo "  dev         Start the development server"
    echo "  build       Run a production build locally"
    echo "  check       Run TypeScript and lint checks"
    echo "  db:migrate  Show Supabase migration instructions"
    echo "  deploy      Deploy to Vercel (requires Vercel CLI)"
    echo "  help        Show this help message"
    ;;
esac
