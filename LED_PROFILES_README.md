# 💡 Sistema de Perfiles LED - Documentación

## 📋 Descripción General

Sistema completo para gestionar el catálogo de perfiles LED con:
- ✅ Perfiles LED (familia / ficha técnica)
- ✅ Difusores (catálogo + relaciones N:N)
- ✅ Terminaciones (reutiliza catálogo global `finishes`)
- ✅ Accesorios incluidos/opcionales por metro
- ✅ Media (imágenes: cover, gallery, tech, accessory)
- ✅ Embeddings para RAG (búsqueda semántica con IA)

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `led_profiles`
Perfil LED base con características técnicas:
```sql
- id (bigserial PK)
- code (text UNIQUE) -- ej: P01
- name (text) -- ej: Perfil-01 P01
- description (text)
- material (text) -- ej: Aluminio 6061
- finish_surface (text) -- ej: Anodizado
- max_w_per_m (numeric) -- ej: 16 W/m
- use_cases (text) -- separado por ;
- created_at (timestamptz)
```

#### 2. `led_diffusers`
Catálogo de difusores:
```sql
- id (bigserial PK)
- slug (text UNIQUE) -- 'opal' | 'transparente'
- name (text)
- material (text) -- 'PC' | 'PVC'
- uv_protection (boolean)
```

#### 3. Tablas de Relación N:N

**`led_profile_diffusers`**
```sql
- profile_id → led_profiles
- diffuser_id → led_diffusers
- included_by_m (boolean) -- si viene incluido por metro
- included_qty_per_m (numeric) -- cantidad incluida
- notes (text)
```

**`led_profile_finishes`**
```sql
- profile_id → led_profiles
- finish_id → finishes (tabla global)
```

**`led_profile_included_items`**
```sql
- profile_id → led_profiles
- accessory_id → accessories
- qty_per_m (numeric) -- ej: Grampa x2/m
```

**`led_profile_optional_items`**
```sql
- profile_id → led_profiles
- accessory_id → accessories
```

#### 4. `led_profile_media`
Imágenes del perfil:
```sql
- id (bigserial PK)
- profile_id → led_profiles
- path (text) -- URL / R2 storage
- kind ('cover' | 'gallery' | 'tech' | 'accessory')
- alt_text (text)
- created_at (timestamptz)
```

#### 5. `led_profile_embeddings`
Para búsqueda semántica con IA:
```sql
- id (bigserial PK)
- profile_id → led_profiles
- content (text) -- texto consolidado
- embedding (vector(1536)) -- OpenAI embeddings
```

## 📁 Estructura de Archivos

```
src/features/led-profiles/
├── types/
│   └── index.ts           # Tipos TypeScript completos
└── queries/
    └── index.ts           # Funciones de base de datos

src/types/
└── database.ts            # Tipos de Supabase actualizados
```

## 🔧 Tipos Disponibles

### Base Types (Database Schema)
```typescript
LedProfile              // Perfil base
LedDiffuser            // Difusor
LedProfileDiffuser     // Relación perfil-difusor
LedProfileFinish       // Relación perfil-terminación
LedProfileIncludedItem // Item incluido
LedProfileOptionalItem // Item opcional
LedProfileMedia        // Media
LedProfileEmbedding    // Embedding para IA
```

### Extended Types (Frontend)
```typescript
LedDiffuserWithInclusion  // Difusor + info de inclusión
LedAccessoryWithQty       // Accesorio + cantidad por metro
LedFinish                 // Terminación del catálogo
LedProfileFull            // Perfil completo con relaciones
LedProfileListItem        // Vista resumida para listados
```

### Form Types
```typescript
LedProfileFormData
LedProfileDiffuserFormData
LedProfileIncludedItemFormData
LedProfileMediaFormData
```

### API Response Types
```typescript
LedProfileResponse
LedProfileListResponse
LedDiffusersResponse
```

### Filter & Search Types
```typescript
LedProfileFilters          // Filtros de búsqueda
LedProfilePaginationParams // Paginación
```

## 🎯 Funciones de Queries Disponibles

### Perfiles LED - CRUD
```typescript
getLedProfiles()                    // Todos los perfiles
getLedProfileById(id)               // Perfil completo con relaciones
getLedProfileByCode(code)           // Buscar por código
getLedProfilesListItems()           // Vista resumida con contadores
createLedProfile(profile)           // Crear nuevo
updateLedProfile(id, updates)       // Actualizar
deleteLedProfile(id)                // Eliminar
```

### Difusores
```typescript
getLedDiffusers()                   // Todos los difusores
createLedDiffuser(diffuser)         // Crear nuevo
```

### Relaciones
```typescript
addDiffuserToProfile(relation)      // Asociar difusor
removeDiffuserFromProfile(id, id)   // Remover difusor
addFinishToProfile(relation)        // Asociar terminación
removeFinishFromProfile(id, id)     // Remover terminación
addIncludedItemToProfile(relation)  // Agregar item incluido
addOptionalItemToProfile(relation)  // Agregar item opcional
addMediaToProfile(media)            // Agregar imagen
deleteMediaFromProfile(id)          // Eliminar imagen
```

### Búsqueda
```typescript
searchLedProfiles(filters, pagination)  // Buscar con filtros
```

## 💻 Ejemplos de Uso

### 1. Crear un perfil LED
```typescript
import { createLedProfile } from '@/features/led-profiles/queries'

const newProfile = await createLedProfile({
  code: 'P01',
  name: 'Perfil-01 P01',
  description: 'Perfil empotrable para iluminación LED',
  material: 'Aluminio 6061',
  finish_surface: 'Anodizado',
  max_w_per_m: 16,
  use_cases: 'Escaleras;Pasillos;Cocinas'
})
```

### 2. Obtener perfil completo
```typescript
import { getLedProfileById } from '@/features/led-profiles/queries'

const profile = await getLedProfileById(1)
// Retorna: LedProfileFull con diffusers, finishes, included_items, etc.
```

### 3. Asociar difusor a perfil
```typescript
import { addDiffuserToProfile } from '@/features/led-profiles/queries'

await addDiffuserToProfile({
  profile_id: 1,
  diffuser_id: 2,  // Opal
  included_by_m: true,
  included_qty_per_m: 1,
  notes: 'Con protección UV'
})
```

### 4. Agregar items incluidos por metro
```typescript
import { addIncludedItemToProfile } from '@/features/led-profiles/queries'

// Grampa x2 por metro
await addIncludedItemToProfile({
  profile_id: 1,
  accessory_id: 15,  // ID de grampa
  qty_per_m: 2
})
```

### 5. Buscar perfiles con filtros
```typescript
import { searchLedProfiles } from '@/features/led-profiles/queries'

const { data, total } = await searchLedProfiles(
  {
    search: 'aluminio',
    min_w_per_m: 10,
    max_w_per_m: 20
  },
  {
    page: 1,
    limit: 10,
    sort_by: 'name',
    sort_order: 'asc'
  }
)
```

### 6. Vista de listado para dashboard
```typescript
import { getLedProfilesListItems } from '@/features/led-profiles/queries'

const profiles = await getLedProfilesListItems()
// Retorna: LedProfileListItem[] con contadores y cover_image
```

## 🎨 Próximos Pasos

### 1. Crear Componentes UI
```
src/components/led-profiles/
├── LedProfileList.tsx         # Tabla de perfiles
├── LedProfileCard.tsx         # Tarjeta de perfil
├── LedProfileForm.tsx         # Formulario crear/editar
├── LedProfileDetail.tsx       # Vista detallada
├── DiffuserSelector.tsx       # Selector de difusores
└── LedProfileDashboard.tsx    # Dashboard principal
```

### 2. Crear Páginas
```
src/app/(admin)/led-profiles/
├── page.tsx                   # Lista de perfiles
├── new/
│   └── page.tsx              # Crear nuevo
└── [code]/
    ├── page.tsx              # Ver detalle
    └── edit/
        └── page.tsx          # Editar
```

### 3. Crear API Routes
```
src/app/api/led-profiles/
├── route.ts                   # GET (listar), POST (crear)
├── [id]/
│   └── route.ts              # GET, PUT, DELETE
├── [id]/diffusers/
│   └── route.ts              # POST (asociar)
└── [id]/media/
    └── route.ts              # POST (subir imagen)
```

### 4. Integrar con Sistema de Búsqueda IA
```typescript
// Generar embeddings para búsqueda semántica
import { generateLedProfileEmbedding } from '@/lib/embeddings'

// Al crear/actualizar perfil
const content = `${profile.name} ${profile.description} ${profile.use_cases}`
const embedding = await generateLedProfileEmbedding(content)

// Guardar en led_profile_embeddings
```

## 📊 Diferencias con Sistema de Products

| Feature | Products | LED Profiles |
|---------|----------|--------------|
| Estructura | Product → Variant → Config | Profile (flat) |
| Terminaciones | N:N por variante | N:N por perfil |
| Difusores | ❌ | ✅ (con inclusión) |
| Items incluidos | ❌ | ✅ (qty por metro) |
| Items opcionales | ❌ | ✅ |
| Potencia | Por config | max_w_per_m |
| Casos de uso | ❌ | ✅ (text field) |

## ✅ Estado Actual

- ✅ Esquema SQL completo
- ✅ Tipos TypeScript (`/features/led-profiles/types/`)
- ✅ Tipos de base de datos (`/types/database.ts`)
- ✅ Queries completas (`/features/led-profiles/queries/`)
- ❌ Componentes UI (pendiente)
- ❌ Páginas (pendiente)
- ❌ API Routes (pendiente)
- ❌ Integración con IA (pendiente)

## 🔗 Referencias

- **Schema SQL**: Ver el esquema SQL original proporcionado
- **Products Feature**: `/src/features/products/` (similar structure)
- **Accessories Feature**: `/src/features/accessories/` (N:N relations)
- **Finishes Feature**: `/src/features/finishes/` (shared catalog)

---

**🎯 Ready to build!** Toda la lógica de datos está lista. Ahora puedes crear los componentes y páginas siguiendo los mismos patrones que products y accessories.
