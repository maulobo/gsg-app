# Migración: Agregar product_code a Featured Items

## Cambios Realizados

### 1. Base de Datos (Supabase)

Se agregó el campo `product_code` a la tabla `featured_items` para poder asociar items destacados con productos específicos.

**Ejecutar uno de estos scripts en Supabase SQL Editor:**

#### Opción A: Si la tabla NO existe aún
Ejecuta: `src/script/create-featured-items-simple.sql`

Este script crea la tabla completa con todos los campos, incluyendo `product_code`.

#### Opción B: Si la tabla YA existe
Ejecuta: `src/script/add-product-code-to-featured-items.sql`

Este script agrega solo la columna `product_code` a la tabla existente.

### 2. TypeScript Types (`src/types/database.ts`)

Actualizado el tipo `featured_items` para incluir `product_code`:

```typescript
featured_items: {
  Row: {
    id: number
    title: string
    product_code: string | null  // ✅ NUEVO
    image_url: string
    link_url: string | null
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }
  // ... Insert y Update también actualizados
}
```

### 3. Componente React (`FeaturedItemsManager.tsx`)

Se agregó el campo `product_code` al:
- ✅ Tipo TypeScript local
- ✅ Estado del formulario
- ✅ Campos de entrada/actualización modal
- ✅ Llamadas API (POST y PATCH)
- ✅ Visualización en la lista (muestra el código debajo del título)

### 4. Interfaz de Usuario

El formulario ahora incluye:
- Campo "Código del Producto" (opcional)
- Placeholder: "Ej: GSG-001"
- Descripción: "Opcional - Código del producto asociado"

La lista de items muestra:
- El código del producto en fuente monoespaciada
- Solo se muestra si existe un código asociado

## Cómo Usar

1. **Ejecutar migración SQL en Supabase**
   - Ve a tu proyecto en Supabase
   - Abre el SQL Editor
   - Copia y pega el contenido de uno de los scripts mencionados
   - Ejecuta el script

2. **Usar en la aplicación**
   - Ve a la sección "Items Destacados" en el admin
   - Al crear/editar un item, verás el nuevo campo "Código del Producto"
   - Es opcional, puedes dejarlo vacío
   - Si lo llenas, se mostrará en la lista de items

## Estructura de la Columna

```sql
product_code VARCHAR(100) NULL
```

- **Tipo**: VARCHAR(100)
- **Nullable**: Sí (opcional)
- **Propósito**: Almacenar el código del producto asociado (ej: "GSG-001", "PROD-123")
- **Validación**: Ninguna (por ahora, puede ser cualquier texto)

## API Actualizada

Los endpoints `/api/featured-items` ahora aceptan y devuelven el campo `product_code`:

```typescript
// POST /api/featured-items
{
  "title": "Producto Destacado",
  "product_code": "GSG-001",  // ✅ NUEVO (opcional)
  "image_url": "https://...",
  "link_url": "https://..."
}

// PATCH /api/featured-items
{
  "id": 1,
  "title": "Producto Actualizado",
  "product_code": "GSG-002",  // ✅ NUEVO (opcional)
  "image_url": "https://...",
  "link_url": "https://..."
}
```

## Próximos Pasos (Opcional)

Si quieres validar que el `product_code` exista en la tabla `products`:

1. Agregar una foreign key constraint:
```sql
ALTER TABLE featured_items
ADD CONSTRAINT fk_featured_items_product
FOREIGN KEY (product_code) 
REFERENCES products(code);
```

2. Crear un índice para búsquedas rápidas:
```sql
CREATE INDEX idx_featured_items_product_code 
ON featured_items(product_code) 
WHERE product_code IS NOT NULL;
```
