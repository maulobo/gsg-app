# 🔄 Migración: Múltiples Tonos de Luz en Modelos de LED Rolls

## 📋 Problema Identificado

### 1. Tonos de Luz
**Antes**: Cuando se seleccionaban múltiples tonos de luz en modo monocromático, se creaba un modelo separado por cada tono.
- ❌ 3 tonos seleccionados = 3 modelos duplicados
- ❌ Difícil gestión de inventario
- ❌ Datos redundantes

**Ahora**: Un solo modelo puede tener múltiples tonos de luz en un array.
- ✅ 3 tonos seleccionados = 1 modelo con 3 tonos
- ✅ Gestión simplificada
- ✅ Datos normalizados

### 2. Especificaciones (Pendiente)
**Problema**: Hay especificaciones generales en `led_rolls` que deberían estar solo en `led_roll_models`.
- Las especificaciones son específicas de cada modelo, no del rollo en general
- Necesita revisión y migración de datos

## 🗄️ Cambios en Base de Datos

### Nueva Tabla: `led_roll_model_light_tones`

```sql
CREATE TABLE led_roll_model_light_tones (
  model_id BIGINT NOT NULL REFERENCES led_roll_models(id) ON DELETE CASCADE,
  light_tone_id BIGINT NOT NULL REFERENCES light_tones(id) ON DELETE CASCADE,
  PRIMARY KEY (model_id, light_tone_id)
);
```

**Características**:
- Relación N:N entre modelos y tonos de luz
- Permite múltiples tonos por modelo
- Índices optimizados para queries
- Migración automática de datos existentes

### Archivo de Migración
📄 `src/script/led-roll-model-light-tones-migration.sql`
- Crea la tabla
- Crea índices
- Migra datos existentes
- Incluye verificaciones

## 📝 Cambios en Tipos TypeScript

### 1. Database Types (`src/types/database.ts`)

Agregada nueva tabla:
```typescript
led_roll_model_light_tones: {
  Row: {
    model_id: number
    light_tone_id: number
  }
  Insert: {
    model_id: number
    light_tone_id: number
  }
  Update: {
    model_id?: number
    light_tone_id?: number
  }
}
```

### 2. Feature Types (`src/features/led-rolls/types/index.ts`)

**Nuevo tipo**: `LedRollModelWithTones`
```typescript
export interface LedRollModelWithTones extends Omit<LedRollModel, 'light_tone_id'> {
  light_tones?: Array<{
    id: number
    name: string
    slug: string
    kelvin: number | null
  }>
}
```

**Actualizado**: `LedRollFormData`
```typescript
export interface LedRollModelFormData {
  // ... otros campos ...
  light_tone_id?: number | null // Deprecado: usar light_tone_ids
  light_tone_ids?: number[] // Nuevo: array de IDs de tonos de luz
}
```

**Actualizado**: `LedRollFull`
```typescript
export interface LedRollFull extends LedRoll {
  models: LedRollModelWithTones[] // Ahora con múltiples tonos
  media: LedRollMedia[]
}
```

## 🔧 Cambios en Componentes

### 1. LedRollCreationForm.tsx

**Antes** (líneas 125-137):
```typescript
// Para modo mono, crear un modelo por cada tono seleccionado
if (tempModel.color_mode === 'mono' && tempModel.light_tone_ids && tempModel.light_tone_ids.length > 0) {
  const newModels = tempModel.light_tone_ids.map(toneId => ({
    ...tempModel,
    light_tone_id: toneId,
    light_tone_ids: undefined,
  }))
  setModels([...models, ...newModels])
}
```

**Ahora**:
```typescript
// Crear UN modelo con los tonos seleccionados como array
const newModel = { 
  ...tempModel,
  light_tone_ids: tempModel.color_mode === 'mono' ? tempModel.light_tone_ids : undefined,
  light_tone_id: tempModel.color_mode === 'mono' ? null : tempModel.light_tone_id,
}
setModels([...models, newModel])
```

**Visualización actualizada**:
```typescript
const toneNames = model.light_tone_ids && model.light_tone_ids.length > 0
  ? model.light_tone_ids.map(id => lightTones.find(t => t.id === id)?.name).filter(Boolean).join(', ')
  : model.light_tone_id 
    ? lightTones.find(t => t.id === model.light_tone_id)?.name || ''
    : null
```

### 2. LedRollEditForm.tsx

**Cambios similares**:
- Eliminada la lógica de crear múltiples modelos
- Un modelo con múltiples tonos
- Visualización de tonos en la lista de modelos existentes

```typescript
{model.light_tones && model.light_tones.length > 0 && (
  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
    Tonos: {model.light_tones.map(t => t.name).join(', ')}
  </p>
)}
```

## 🚀 Cambios en API Routes

### `/api/led-rolls/[id]/models/route.ts`

**Validación actualizada**:
```typescript
// Antes
if (body.color_mode === 'mono' && !body.light_tone_id) {
  return NextResponse.json(
    { error: 'light_tone_id es requerido para modo monocromático' },
    { status: 400 }
  )
}

// Ahora
if (body.color_mode === 'mono' && !body.light_tone_ids && !body.light_tone_id) {
  return NextResponse.json(
    { error: 'light_tone_ids (array) o light_tone_id es requerido para modo monocromático' },
    { status: 400 }
  )
}
```

## 📊 Cambios en Queries

### `createLedRollModel` (`src/features/led-rolls/queries/index.ts`)

**Nueva lógica**:
```typescript
export async function createLedRollModel(model: LedRollModelFormData): Promise<LedRollModel | null> {
  const supabase = await createServerSupabaseClient()
  
  // Separar light_tone_ids del resto de los datos
  const { light_tone_ids, ...modelData } = model
  
  // Insertar el modelo
  const { data, error } = await supabase
    .from('led_roll_models')
    .insert(modelData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating LED roll model:', error)
    return null
  }
  
  // Si hay múltiples tonos de luz, insertarlos en la tabla de relación
  if (light_tone_ids && light_tone_ids.length > 0 && data) {
    const toneRelations = light_tone_ids.map(toneId => ({
      model_id: data.id,
      light_tone_id: toneId
    }))
    
    const { error: toneError } = await supabase
      .from('led_roll_model_light_tones')
      .insert(toneRelations)
    
    if (toneError) {
      console.error('Error creating light tone relations:', toneError)
    }
  }
  
  return data
}
```

### `getLedRollById` (`src/features/led-rolls/queries/index.ts`)

**Nueva lógica para obtener tonos**:
```typescript
// Para cada modelo, obtener sus tonos de luz de la tabla de relación
const modelsWithTones = await Promise.all(
  (modelsData || []).map(async (model) => {
    const { data: toneRelations } = await supabase
      .from('led_roll_model_light_tones')
      .select(`
        light_tone:light_tones(id, name, slug, kelvin)
      `)
      .eq('model_id', model.id)
    
    const tones = toneRelations?.map(r => {
      const tone = Array.isArray(r.light_tone) ? r.light_tone[0] : r.light_tone
      return tone
    }).filter(Boolean) || []
    
    return {
      ...model,
      light_tones: tones.length > 0 ? tones : undefined,
    }
  })
)
```

## 📋 Pasos para Aplicar la Migración

### 1. Ejecutar SQL Migration
```bash
# Conectarse a tu base de datos Supabase
# Ejecutar el archivo: src/script/led-roll-model-light-tones-migration.sql
```

### 2. Verificar Migración
```sql
-- Verificar tabla creada
SELECT * FROM led_roll_model_light_tones LIMIT 10;

-- Verificar datos migrados
SELECT 
  m.sku,
  m.light_tone_id as old_tone_id,
  array_agg(mlt.light_tone_id) as new_tone_ids
FROM led_roll_models m
LEFT JOIN led_roll_model_light_tones mlt ON m.id = mlt.model_id
GROUP BY m.id, m.sku, m.light_tone_id;
```

### 3. Testing
- ✅ Crear nuevo rollo LED con modelos
- ✅ Seleccionar múltiples tonos en modo mono
- ✅ Verificar que se crea UN modelo con múltiples tonos
- ✅ Editar rollo existente y agregar modelo
- ✅ Verificar visualización de tonos en listados

### 4. Opcional: Limpiar campo deprecado
```sql
-- SOLO después de verificar que todo funciona correctamente
ALTER TABLE led_roll_models DROP COLUMN IF EXISTS light_tone_id;
```

## 🎯 Beneficios de los Cambios

### Antes
- 1 SKU "LED-5050" con tonos [3000K, 4000K, 6000K]
- = 3 modelos en DB
- = 3 filas con datos duplicados
- ❌ Difícil mantener consistencia
- ❌ Stock fragmentado

### Ahora
- 1 SKU "LED-5050" con tonos [3000K, 4000K, 6000K]
- = 1 modelo en DB
- = 1 fila + 3 relaciones
- ✅ Datos normalizados
- ✅ Stock unificado
- ✅ Gestión simplificada

## ⚠️ Notas Importantes

1. **Retrocompatibilidad**: El código soporta ambos métodos (antiguo y nuevo)
   - `light_tone_id` (deprecado pero funcional)
   - `light_tone_ids` (nuevo y recomendado)

2. **Modelos existentes**: Los modelos creados antes de la migración siguen funcionando

3. **Especificaciones**: El tema de especificaciones generales vs. específicas de modelo queda pendiente de revisión

## 🔜 Próximos Pasos (Opcional)

1. Revisar especificaciones en `led_rolls` vs `led_roll_models`
2. Migrar especificaciones generales a modelos específicos
3. Limpiar campos deprecados una vez confirmado el funcionamiento
4. Actualizar documentación de API

## 📚 Archivos Modificados

```
✅ src/script/led-roll-model-light-tones-migration.sql (NUEVO)
✅ src/types/database.ts
✅ src/features/led-rolls/types/index.ts
✅ src/features/led-rolls/queries/index.ts
✅ src/components/led-rolls/LedRollCreationForm.tsx
✅ src/components/led-rolls/LedRollEditForm.tsx
✅ src/app/api/led-rolls/[id]/models/route.ts
✅ LED_ROLLS_MULTI_TONE_MIGRATION.md (ESTE ARCHIVO)
```

---

**Fecha**: 2025-11-13  
**Autor**: GitHub Copilot  
**Estado**: ✅ Implementado - Pendiente de testing en producción
