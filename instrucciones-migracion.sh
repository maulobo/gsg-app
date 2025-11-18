#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Migraciones de Distribuidores${NC}\n"

echo -e "${YELLOW}⚠️  No se puede ejecutar SQL directamente sin acceso al dashboard.${NC}\n"

echo -e "Para aplicar las migraciones, tienes ${GREEN}2 opciones${NC}:\n"

echo -e "${BLUE}Opción 1 - SQL Editor (RECOMENDADO):${NC}"
echo "1. Accede a: https://supabase.com/dashboard/project/quhuhsjgejrxsvenviyv/sql/new"
echo "2. Copia y pega el contenido de: ${GREEN}src/script/distributors-schema.sql${NC}"
echo "3. Haz clic en 'Run'"
echo "4. Luego copia y pega: ${GREEN}src/script/distributors-seed-data.sql${NC}"
echo "5. Haz clic en 'Run'"
echo ""

echo -e "${BLUE}Opción 2 - Recuperar acceso al dashboard:${NC}"
echo "1. Prueba recuperar contraseña en: https://supabase.com/dashboard"
echo "2. Intenta con estos emails comunes:"
echo "   - Tu email principal"
echo "   - Emails de trabajo anteriores"
echo "   - Revisa tu historial de navegador"
echo ""

echo -e "${YELLOW}Una vez que ejecutes los SQLs, el sistema de distribuidores estará listo.${NC}"
echo ""
echo -e "${GREEN}Archivos preparados:${NC}"
echo "  ✅ Schema: src/script/distributors-schema.sql"
echo "  ✅ Datos:  src/script/distributors-seed-data.sql"
echo "  ✅ API:    src/app/api/distributors/"
echo "  ✅ UI:     src/components/distributors/"
echo "  ✅ Pages:  src/app/(admin)/distributors/"
