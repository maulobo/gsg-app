#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Ejecutando migraciones de distribuidores...${NC}\n"

# Load environment variables
if [ ! -f .env.local ]; then
  echo "❌ Archivo .env.local no encontrado"
  exit 1
fi

export $(cat .env.local | grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' | xargs)

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Variables de entorno faltantes"
  exit 1
fi

echo -e "${BLUE}📋 Paso 1: Creando esquema de distribuidores...${NC}"

# Escape SQL for JSON
SCHEMA_SQL=$(cat src/script/distributors-schema.sql | jq -Rs .)

# Execute schema via Supabase SQL API
RESPONSE=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d "{\"query\": ${SCHEMA_SQL}}")

if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
  if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error en schema:"
    echo "$RESPONSE" | jq .
    exit 1
  fi
fi

echo -e "${GREEN}✅ Schema aplicado${NC}\n"

echo -e "${BLUE}📋 Paso 2: Insertando datos iniciales...${NC}"

# Escape SQL for JSON
SEED_SQL=$(cat src/script/distributors-seed-data.sql | jq -Rs .)

# Execute seed data
RESPONSE=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d "{\"query\": ${SEED_SQL}}")

if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
  if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error en seed data:"
    echo "$RESPONSE" | jq .
    exit 1
  fi
fi

echo -e "${GREEN}✅ Datos iniciales insertados${NC}\n"
echo -e "${GREEN}🎉 Migraciones completadas exitosamente!${NC}"
