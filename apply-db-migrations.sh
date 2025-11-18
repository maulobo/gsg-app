#!/bin/bash
set -e

# Load env vars
export $(cat .env.local | grep -E '^(NEXT_PUBLIC_SUPABASE_URL)=' | xargs)

# Extract project ref from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -n 's/.*https:\/\/\([^.]*\).*/\1/p')

echo "📦 Proyecto: $PROJECT_REF"
echo ""
echo "⚠️  Necesitas la DATABASE PASSWORD de tu proyecto Supabase."
echo "   Se encuentra en: Supabase Dashboard > Settings > Database > Database Password"
echo ""
read -sp "Ingresa la password de la DB: " DB_PASSWORD
echo ""
echo ""

# Build connection string
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "🚀 Aplicando schema..."
psql "$DB_URL" -f src/script/distributors-schema.sql

echo ""
echo "🚀 Insertando datos iniciales..."
psql "$DB_URL" -f src/script/distributors-seed-data.sql

echo ""
echo "✅ Migraciones completadas exitosamente!"
