#!/bin/bash
set -e

echo "🚀 Aplicando migraciones de distribuidores..."
echo ""

# Cargar variables de entorno
export $(cat .env.local | grep -v '^#' | xargs)

# Ejecutar schema
echo "📋 Paso 1: Creando tablas..."
curl -X POST \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat src/script/distributors-schema.sql | tr '\n' ' ' | sed 's/"/\\"/g')\"}"

echo ""
echo "✅ Schema aplicado"
echo ""

# Ejecutar seed data
echo "📋 Paso 2: Insertando datos iniciales..."
curl -X POST \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat src/script/distributors-seed-data.sql | tr '\n' ' ' | sed 's/"/\\"/g')\"}"

echo ""
echo "✅ Datos iniciales insertados"
echo ""
echo "🎉 Migraciones completadas exitosamente!"
