# Actualización del Schema de Base de Datos

## Cambios Realizados

### 📊 Cambios en la Estructura de Base de Datos

#### 1. **Tabla `variants` → `product_variants`**
- **Antes**: `variants`
- **Ahora**: `product_variants`
- **Cambios de campos**:
  - ✅ Mantiene: `id`, `product_id`, `name`
  - ➕ Agrega: `variant_code` (código único de variante)
  - ❌ Elimina: `sku`, `watt`, `lumens`, `voltage`, `length_mm`, `width_mm`, `diameter_mm`, `includes_led`, `includes_driver`, `specs`, `created_at`

**Nueva estructura simplificada**:
```typescript
{
  id: number
  product_id: number
  variant_code: string | null  // NUEVO
  name: string
}
```

#### 2. **Tabla `variant_config` → `variant_configurations`**
- **Antes**: `variant_config`
- **Ahora**: `variant_configurations`
- **Cambios de campos**:
  - ✅ Mantiene: `id`, `variant_id`, `watt`, `lumens`, `voltage`, `length_mm`, `width_mm`, `includes_led`, `includes_driver`, `sku`, `specs`
  - ➕ Agrega: `diameter_description` (descripción del diámetro en texto)
  - ❌ Elimina: `kelvin`, `created_at`
  - ⚠️ Ahora `watt` y `lumens` son **requeridos** (not null)

**Nueva estructura técnica**:
```typescript
{
  id: number
  variant_id: number
  sku: string | null
  watt: number              // ⚠️ AHORA REQUERIDO
  lumens: number            // ⚠️ AHORA REQUERIDO
  diameter_description: string | null  // NUEVO
  length_mm: number | null
  width_mm: number | null
  voltage: number | null
  includes_led: boolean | null
  includes_driver: boolean | null
  specs: jsonb
}
```

### 🎯 Filosofía del Nuevo Diseño

**Separación de Responsabilidades**:
1. **`product_variants`**: Define VARIANTES del producto (ej: "Buro Directo", "Buro Indirecto")
2. **`variant_configurations`**: Define CONFIGURACIONES técnicas de cada variante (ej: "30W 3000lm", "50W 5000lm")

**Ejemplo práctico**:
```
Producto: Buro
├─ Variante 1: "Buro Directo" (variant_code: "BUR-D")
│  ├─ Config 1: SKU "BUR-D-30W-3K" → 30W, 3000lm, 220V
│  ├─ Config 2: SKU "BUR-D-50W-3K" → 50W, 5000lm, 220V
│  └─ Config 3: SKU "BUR-D-30W-4K" → 30W, 3000lm, 220V, ⌀ 120mm
│
└─ Variante 2: "Buro Indirecto" (variant_code: "BUR-I")
   ├─ Config 1: SKU "BUR-I-40W-3K" → 40W, 4000lm, 220V
   └─ Config 2: SKU "BUR-I-60W-3K" → 60W, 6000lm, 220V
```

## 📁 Archivos Actualizados

### 1. `/src/types/database.ts`
✅ Actualizado con las nuevas estructuras de tabla
- `product_variants` con campos simplificados
- `variant_configurations` con campos técnicos completos
- Helper types actualizados
- Tipos de Insert/Update actualizados

### 2. `/src/features/variants/types/index.ts`
✅ Form data types actualizados
- `VariantFormData`: Solo product_id, variant_code, name
- `VariantConfigFormData`: Todos los campos técnicos (watt y lumens requeridos)

### 3. `/src/features/variants/queries/index.ts`
✅ Queries actualizadas
- `getProductVariants()`: Usa `product_variants` y `variant_configurations`
- `getVariantById()`: Usa `product_variants` y `variant_configurations`
- Joins actualizados para las nuevas tablas

### 4. `/src/features/variants/actions/index.ts`
✅ Server actions actualizadas
- `createVariant()`: Usa `product_variants`
- `updateVariant()`: Usa `product_variants`
- `deleteVariant()`: Usa `product_variants`
- `createVariantConfig()`: Usa `variant_configurations` con nuevos campos
- `deleteVariantConfig()`: Usa `variant_configurations`
- Mantiene acciones de M:M (finishes, light_tones)

### 5. `/src/features/products/queries/index.ts`
✅ Queries de productos actualizadas
- `getProductByCode()`: Ahora usa `product_variants` y `variant_configurations`
- `getProductById()`: Ahora usa `product_variants` y `variant_configurations`
- Joins actualizados con nuevos nombres de campos

### 6. `/src/app/(admin)/products/[code]/page.tsx`
✅ Vista de producto actualizada
- Usa `product_variants` en lugar de `variants`
- Muestra `variant_code`
- Renderiza `variant_configurations` con mejor formato
- Muestra SKU, specs técnicos, includes_led/driver

## 🔄 Migraciones Pendientes

### En Supabase SQL Editor, ejecutar:

```sql
-- 1. Renombrar tablas
ALTER TABLE variants RENAME TO product_variants;
ALTER TABLE variant_config RENAME TO variant_configurations;

-- 2. Modificar product_variants
ALTER TABLE product_variants 
  ADD COLUMN variant_code text UNIQUE,
  DROP COLUMN sku,
  DROP COLUMN watt,
  DROP COLUMN lumens,
  DROP COLUMN voltage,
  DROP COLUMN length_mm,
  DROP COLUMN width_mm,
  DROP COLUMN diameter_mm,
  DROP COLUMN includes_led,
  DROP COLUMN includes_driver,
  DROP COLUMN specs,
  DROP COLUMN created_at;

-- 3. Modificar variant_configurations
ALTER TABLE variant_configurations
  ADD COLUMN diameter_description text,
  ALTER COLUMN watt SET NOT NULL,
  ALTER COLUMN lumens SET NOT NULL,
  DROP COLUMN kelvin,
  DROP COLUMN created_at;

-- 4. Actualizar foreign keys si es necesario
-- (Supabase suele manejar esto automáticamente)
```

⚠️ **ADVERTENCIA**: Ejecuta estas migraciones en un entorno de desarrollo primero!

## 🧪 Testing

Después de aplicar los cambios:

1. Verifica que las queries funcionen:
```typescript
const product = await getProductByCode('bur')
console.log(product?.product_variants) // debe mostrar variants
console.log(product?.product_variants[0]?.variant_configurations) // debe mostrar configs
```

2. Verifica la página de producto: `/products/bur`
   - Debe mostrar las variantes
   - Debe mostrar las configuraciones
   - Debe mostrar acabados y tonos de luz

## 📝 Notas Importantes

1. **Cambio de nomenclatura**: 
   - `variants` → `product_variants` (más explícito)
   - `variant_config` → `variant_configurations` (más descriptivo)

2. **Separación de datos**:
   - Variante = Tipo de producto (nombre + código)
   - Configuración = Especificaciones técnicas (potencia, flujo, dimensiones)

3. **Campos requeridos**:
   - `watt` y `lumens` ahora son obligatorios en `variant_configurations`
   - Asegúrate de siempre proveerlos al crear configs

4. **Backward compatibility**:
   - El archivo `src/lib/products.ts` sigue funcionando (wrapper)
   - Usa las nuevas functions de `features/products/queries` directamente

## ✅ Estado Actual

- ✅ Todos los tipos de TypeScript actualizados
- ✅ Todas las queries actualizadas
- ✅ Todas las actions actualizadas
- ✅ Vista de producto actualizada
- ✅ Sin errores de TypeScript
- ⏳ Pendiente: Ejecutar migraciones SQL en Supabase
- ⏳ Pendiente: Migrar datos existentes (si aplica)

## 🚀 Próximos Pasos

1. Ejecutar las migraciones SQL en Supabase
2. Migrar los datos existentes si hay productos/variants en producción
3. Probar la app completamente
4. Actualizar forms de creación/edición de variants
5. Actualizar forms de creación/edición de configuraciones
