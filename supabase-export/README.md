# 🔄 Migración Completa a Nuevo Proyecto Supabase

## 📦 Archivos Exportados

✅ Ya se exportaron todos los datos del proyecto actual:
- **112 registros totales** en 10 tablas
- Schema completo con relaciones, índices y triggers
- Datos en formato JSON y SQL

## 🚀 Proceso de Migración (15 minutos)

### 1️⃣ Crear Nuevo Proyecto Supabase

1. Ir a: https://supabase.com/dashboard
2. Click en **"New project"**
3. Configuración:
   - **Name:** `gsg-dash-v2` (o el que prefieras)
   - **Database Password:** `Alal1010!!` (guárdalo!)
   - **Region:** `South America (São Paulo)` o `US East (N. Virginia)`
   - **Pricing Plan:** Free tier (suficiente para desarrollo)
4. Click **"Create new project"** (tarda ~2 minutos)

### 2️⃣ Ejecutar Schema

1. En el nuevo proyecto, ir a: **SQL Editor** (menú izquierdo)
2. Click en **"New query"**
3. Abrir el archivo: `supabase-export/00-schema.sql`
4. **Copiar todo el contenido** y pegarlo en el editor
5. Click en **"Run"** (esquina inferior derecha)
6. Verificar: ✅ "Success. No rows returned"

### 3️⃣ Importar Datos Automáticamente

Ejecutar en la terminal:

```bash
node import-to-new-project.mjs
```

El script te pedirá:
- Project URL del nuevo proyecto
- Anon Key
- Service Role Key

**(Los encontrás en: Settings > API del nuevo proyecto)**

### 4️⃣ Actualizar Variables de Entorno

Editar `.env.local` y reemplazar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-NUEVO-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-nueva-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-nuevo-service-role-key
```

### 5️⃣ Agregar Sistema de Distribuidores

En el SQL Editor del nuevo proyecto, ejecutar:

1. **Schema:** Copiar y pegar `src/script/distributors-schema.sql`
2. **Datos:** Copiar y pegar `src/script/distributors-seed-data.sql`

### 6️⃣ Verificar

```bash
pnpm dev
```

Ir a:
- http://localhost:3000/admin-products → Ver productos
- http://localhost:3000/distributors → Ver distribuidores

---

## 📊 Datos que se Migran

| Tabla | Registros |
|-------|-----------|
| Categories | 7 |
| Light Tones | 9 |
| Finishes | 22 |
| Products | 22 |
| LED Profiles | 4 |
| LED Diffusers | 4 |
| LED Rolls | 1 |
| Accessories | 43 |
| User Profiles | 0 |
| **TOTAL** | **112** |

---

## ⚡ Migración Manual (Alternativa)

Si preferís hacerlo manual:

### Paso 1: Schema
```bash
# En el SQL Editor del nuevo proyecto, ejecutar en orden:
supabase-export/00-schema.sql
```

### Paso 2: Datos
```bash
# Ejecutar cada .sql en orden:
supabase-export/categories.sql
supabase-export/light_tones.sql
supabase-export/finishes.sql
supabase-export/led_diffusers.sql
supabase-export/products.sql
supabase-export/led_profiles.sql
supabase-export/led_rolls.sql
supabase-export/accessories.sql
```

---

## 🔒 Storage y Auth (Opcional)

Si usás Storage para imágenes:

1. En el nuevo proyecto: **Storage > Create bucket**
2. Nombre: `products` (o el que uses)
3. Configurar como **Public** si es necesario
4. Copiar las imágenes manualmente o usar el Migration Tool de Supabase

Para Auth:
1. En Settings > Auth > Email templates
2. Configurar según necesites

---

## ✅ Verificación Post-Migración

```bash
# Test de conexión
node create-tables-direct.mjs

# Debería mostrar:
# ✅ Products: 22 registros
# ✅ LED Profiles: 4 registros
# ✅ Accessories: 43 registros
```

---

## 🆘 Troubleshooting

### "Could not find the table"
- Verificá que ejecutaste el schema primero
- Revisá que el schema se ejecutó sin errores

### "Foreign key violation"
- Importá las tablas en el orden correcto (categories primero, products después)
- El script automático ya lo hace en orden

### "Duplicate key value"
- La tabla ya tiene datos
- Truncar con: `TRUNCATE TABLE nombre_tabla CASCADE;`

---

## 📝 Notas

- El proyecto viejo seguirá funcionando hasta que cambies las keys
- Podés tener ambos proyectos activos simultáneamente
- Free tier de Supabase: 500MB DB, 1GB Storage, 2GB Bandwidth/mes
- Para producción, considerá el tier Pro

---

## 🎯 Resultado Final

Después de la migración tendrás:

✅ Nuevo proyecto Supabase con acceso completo
✅ Todos los datos migrados (112 registros)
✅ Schema idéntico con relaciones e índices
✅ Sistema de distribuidores incluido (4 zonas + 20 distribuidores)
✅ Control total del dashboard y SQL Editor

**Tiempo total estimado: 15 minutos**
