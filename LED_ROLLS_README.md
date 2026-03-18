# Sistema de Rollos/Tiras LED

## 📋 Descripción General

Sistema completo para gestionar familias de tiras LED (COB, SMD) y sus modelos/SKUs específicos, siguiendo el patrón familia→modelos similar a productos→variantes.

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `led_rolls` (Familias)
Define las características generales de una familia de rollos LED con **rangos** de especificaciones:

```sql
- id, code, name, description
- typology (LED COB, SMD 5050, etc.)
- color_control (monocromático, CCT, RGB Pixel)
- voltage_v (12V, 24V)
- ip_rating (IP20, IP65, IP67)
- cri_min, dimmable, dynamic_effects
- cut_step_mm_min/max (rango de paso de corte)
- width_mm_min/max (rango de ancho)
- eff_lm_per_w_min/max (eficiencia lumínica)
- flux_lm_per_m_min/max (flujo luminoso)
- leds_per_m_min/max (LEDs por metro)
- roll_length_m, warranty_years, packaging
- is_active (soft delete)
```

#### 2. `led_roll_models` (Modelos/SKUs)
Modelos específicos vendibles con **valores exactos**:

```sql
- id, roll_id, sku, name
- watt_per_m, leds_per_m (exactos)
- luminous_efficacy_lm_w, luminous_flux_per_m_lm
- cut_step_mm, width_mm
- color_mode: 'mono' | 'cct' | 'rgb' | 'rgb_pixel'
  - mono: requiere light_tone_id
  - cct: requiere cct_min_k, cct_max_k
  - rgb/rgb_pixel: modo dinámico
- ip_rating, voltage_v (pueden override parent)
- price, stock, is_active
```

#### 3. `led_roll_media`
Imágenes y documentos:
- cover, gallery, tech, datasheet, installation
- path (R2 URL), alt_text, display_order

#### 4. `led_roll_embeddings`
Vector search para RAG con pgvector

## 🏗️ Arquitectura de Código

```
src/
├── features/led-rolls/
│   ├── types/index.ts          # Tipos TypeScript completos
│   └── queries/index.ts        # Queries Supabase (SSR)
├── app/api/led-rolls/
│   ├── route.ts                # GET list, POST create
│   ├── [id]/route.ts           # GET/PUT/DELETE by ID
│   ├── [id]/models/route.ts    # POST create model
│   └── [id]/images/upload/route.ts  # Image upload R2
├── app/(admin)/led-rolls/
│   ├── page.tsx                # Listing page
│   ├── new/page.tsx            # Creation page
│   └── [code]/edit/page.tsx    # Edit page
└── components/led-rolls/
    ├── LedRollCreationForm.tsx # Wizard multi-paso
    └── LedRollEditForm.tsx     # Edición + agregar modelos
```

## 🎨 UI/UX

### Wizard de Creación (5 pasos)

1. **Info Básica**: Código, nombre, tipología, descripción
2. **Especificaciones**: Rangos de CRI, voltaje, IP, eficiencia, LEDs/m
3. **Modelos**: Agregar SKUs con valores exactos + validación color_mode
4. **Imágenes**: Upload portada y técnica
5. **Revisar**: Confirmación antes de crear

### Formulario de Edición

- Panel izquierdo: Editar info/specs del rollo + agregar nuevos modelos
- Panel derecho: Ver imagen actual, modelos existentes
- Validación de modos de color (mono→tone_id, cct→kelvin range)

### Página de Listing

- Stats: Total rollos, modelos, tipologías
- Grid con imágenes de portada
- Badges de tipología y color control
- Contador de modelos por rollo

## 🔍 Queries Principales

```typescript
// Listar con conteo de modelos
getLedRollsListItems(): Promise<LedRollListItem[]>

// Obtener completo (roll + models + media)
getLedRollById(id): Promise<LedRollFull | null>

// CRUD rollos
createLedRoll(data): Promise<LedRoll>
updateLedRoll(id, data): Promise<LedRoll>
deleteLedRoll(id): Promise<void> // soft delete

// CRUD modelos
createLedRollModel(data): Promise<LedRollModel>

// Media
createLedRollMedia(data): Promise<LedRollMedia>

// Búsqueda/filtros
searchLedRolls(filters): Promise<LedRollFull[]>
```

## 🔐 Validación de Color Modes

API valida modos de color antes de crear modelos:

```typescript
- mono: Requiere light_tone_id (no null)
- cct: Requiere cct_min_k y cct_max_k (no null)
- rgb/rgb_pixel: No requiere campos extra
```

## 📸 Imágenes R2

Upload con sharp processing:
- Cover: Imagen principal del rollo
- Tech: Imagen técnica/dimensional
- Gallery: Galería adicional
- Datasheet/Installation: PDFs/docs

Path format: `led-rolls/{rollCode}/{kind}/{timestamp}-{filename}`

## 🚀 Navegación

- Sidebar: Item "Rollos LED" (entre Perfiles LED e Items Destacados)
- `/led-rolls` - Listing
- `/led-rolls/new` - Crear nuevo
- `/led-rolls/[id]/edit` - Editar existente

## 🛡️ Seguridad (RLS Policies)

```sql
- SELECT: Public (authenticated + anon)
- INSERT/UPDATE/DELETE: Authenticated only
- Embeddings: Blocked for regular users
```

## 🎯 Flujo de Uso

1. Admin crea familia de rollo con rangos generales
2. Agrega modelos específicos con valores exactos
3. Sube imágenes (portada obligatoria recomendada)
4. Sistema genera embeddings automáticamente (trigger)
5. Frontend lista rollos con stats y filtros
6. Usuarios buscan por tipología, voltaje, IP, etc.

## 📊 Casos de Uso

- **Catálogo**: Mostrar familias con diferentes modelos
- **Búsqueda semántica**: RAG con embeddings
- **Configurador**: Filtrar por specs técnicas
- **E-commerce**: Precio y stock por SKU

## 🔄 Diferencias vs LED Profiles

| Característica | LED Profiles | LED Rolls |
|---|---|---|
| Familia | Perfiles de aluminio | Tiras/rollos LED |
| Override | Difusores con material | Modelos con specs exactas |
| Color | Solo difusor | Modo color (mono/cct/rgb) |
| Dimensiones | Alto/ancho fijo | Rangos de ancho/corte |
| Pricing | Por familia | Por modelo/SKU |

---

**Documentación actualizada**: 2024-01-XX
