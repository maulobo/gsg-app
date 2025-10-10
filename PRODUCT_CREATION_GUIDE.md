# Sistema de Creación de Productos

## 🎯 Descripción General

Sistema completo para crear y gestionar productos con todas sus relaciones usando Hero UI. El sistema incluye:

- ✅ Formulario multi-paso con tabs
- ✅ Creación de productos con categorías y acabados
- ✅ Gestión de variantes con tonos de luz
- ✅ Configuraciones técnicas para cada variante
- ✅ Validación y preview antes de guardar
- ✅ Lista de productos con búsqueda

## 📁 Estructura de Archivos Creados

### Componentes
```
src/components/products/
├── ProductCreationForm.tsx    # Formulario principal con tabs
└── ProductList.tsx             # Lista de productos con tabla
```

### Páginas
```
src/app/(admin)/products/
├── page.tsx                    # Lista de todos los productos
├── new/page.tsx                # Crear nuevo producto
└── [code]/page.tsx             # Ver detalle de producto
```

### API
```
src/app/api/products/
└── create/route.ts             # Endpoint para crear producto completo
```

## 🗄️ Schema Actualizado (Cambios Importantes)

### ❌ Eliminado
- `variant_finishes` - Los acabados ahora están a nivel de **producto**, no de variante
- `includes_led` e `includes_driver` en `variant_configurations` - Ahora están en `product_variants`

### ✅ Actualizado
- **`product_finishes`** - Tabla nueva para relacionar productos con acabados
- **`product_variants.includes_led/driver`** - Ahora son opcionales (nullable)
- **`variant_configurations`** - Ya no tiene `includes_led/driver`

### Nueva Estructura

```
Producto (products)
├── Categoría (category_id)
├── Acabados (product_finishes → finishes)
├── Media Assets (media_assets)
└── Variantes (product_variants)
    ├── includes_led (boolean)
    ├── includes_driver (boolean)
    ├── Tonos de Luz (variant_light_tones → light_tones)
    └── Configuraciones (variant_configurations)
        ├── SKU
        ├── Watt / Lumens
        ├── Voltage
        ├── Dimensiones
        └── Specs (jsonb)
```

## 🚀 Cómo Usar

### 1. Acceder al Sistema

```
http://localhost:3000/products          # Ver lista de productos
http://localhost:3000/products/new      # Crear nuevo producto
http://localhost:3000/products/bur      # Ver producto por código
```

### 2. Crear un Producto (Paso a Paso)

#### **Paso 1: Información Básica**
- Código del producto (ej: `BUR`)
- Nombre (ej: "Buro Directo")
- Categoría (seleccionar de lista)
- Descripción (textarea)
- Acabados disponibles (multi-select)
- ¿Es destacado? (switch)

#### **Paso 2: Variantes**
Para cada variante:
1. **Código de variante** (ej: `BUR-D`)
2. **Nombre** (ej: "Buro Directo")
3. **Checkboxes**:
   - ✓ Incluye LED
   - ✓ Incluye Driver
4. **Tonos de luz** (multi-select con Kelvin)
5. **Configuraciones** (agregar múltiples):
   - SKU (ej: `BUR-D-30W-3K`)
   - Watt (requerido)
   - Lumens (requerido)
   - Voltage (opcional)
   - Diámetro descripción (opcional)
   - Dimensiones (largo/ancho en mm)

#### **Paso 3: Revisar y Guardar**
- Ver resumen completo
- Confirmar y crear

### 3. Ver Productos

La lista muestra:
- Código
- Nombre
- Categoría (chip)
- Estado (destacado/normal)
- Acciones (ver/editar)

### 4. Ver Detalle de Producto

Muestra:
- Nombre y categoría
- Imagen de portada (si existe)
- **Acabados disponibles** (a nivel de producto)
- **Variantes**:
  - Código de variante
  - Badges de LED/Driver
  - Tonos de luz
  - **Configuraciones**:
    - SKU
    - Especificaciones técnicas (W/lm/V)
    - Dimensiones
    - Diámetro

## 📊 Ejemplo Completo

```typescript
// Crear producto "Buro"
{
  product: {
    code: "BUR",
    name: "Buro Directo",
    category_id: 4, // Colgantes
    description: "Luminaria colgante moderna",
    is_featured: true,
    finish_ids: [1, 2, 3] // Blanco, Negro, Aluminio
  },
  variants: [
    {
      variant_code: "BUR-D",
      name: "Buro Directo",
      includes_led: true,
      includes_driver: true,
      light_tone_ids: [1, 2], // 3000K, 4000K
      configurations: [
        {
          sku: "BUR-D-30W-3K",
          watt: 30,
          lumens: 3000,
          voltage: 220,
          diameter_description: "120mm",
          length_mm: 600,
          width_mm: 40,
          specs: {}
        },
        {
          sku: "BUR-D-50W-3K",
          watt: 50,
          lumens: 5000,
          voltage: 220,
          diameter_description: "150mm",
          length_mm: 800,
          width_mm: 50,
          specs: {}
        }
      ]
    }
  ]
}
```

## 🎨 Componentes Hero UI Usados

- **Tabs** - Navegación entre pasos
- **Card/CardHeader/CardBody** - Contenedores
- **Input** - Campos de texto
- **Textarea** - Descripciones
- **Select/SelectItem** - Selectores (categorías, acabados, tonos)
- **Switch** - Destacado, LED, Driver
- **Button** - Acciones (siguiente, agregar, guardar)
- **Chip** - Estados y etiquetas
- **Table** - Lista de productos

## 🔄 Flujo de Datos

```
1. Usuario completa formulario
   ↓
2. Click "Crear Producto"
   ↓
3. POST a /api/products/create
   ↓
4. Backend crea en orden:
   - products (insert)
   - product_finishes (insert multiple)
   - product_variants (insert)
   - variant_light_tones (insert multiple)
   - variant_configurations (insert multiple)
   ↓
5. Redirect a /products/[code]
   ↓
6. Mostrar producto completo con todas las relaciones
```

## 🧪 Testing

### Datos de Prueba Requeridos

Antes de crear productos, asegúrate de tener:

```sql
-- Categorías
INSERT INTO categories (slug, name) VALUES 
  ('colgantes', 'Colgantes'),
  ('embutidos', 'Embutidos'),
  ('apliques', 'Apliques');

-- Acabados
INSERT INTO finishes (slug, name) VALUES
  ('white', 'Blanco'),
  ('black', 'Negro'),
  ('aluminum', 'Aluminio'),
  ('chrome', 'Cromado');

-- Tonos de Luz
INSERT INTO light_tones (slug, name, kelvin) VALUES
  ('warm', 'Cálida', 3000),
  ('neutral', 'Neutra', 4000),
  ('cold', 'Fría', 6500);
```

## 📝 Próximos Pasos

- [ ] Agregar upload de imágenes (media_assets)
- [ ] Crear formulario de edición
- [ ] Agregar búsqueda y filtros en lista
- [ ] Implementar paginación
- [ ] Agregar duplicación de productos
- [ ] Validación con Zod
- [ ] Manejo de errores mejorado
- [ ] Loading states
- [ ] Confirmaciones antes de eliminar

## 🐛 Solución de Problemas

### Error: "Category_id is required"
- Asegúrate de seleccionar una categoría antes de avanzar

### Error: "Watt and Lumens are required"
- Las configuraciones DEBEN tener watt y lumens (son campos obligatorios en DB)

### No se muestran acabados/tonos
- Verifica que existan datos en las tablas `finishes` y `light_tones`

### Error al crear producto
- Revisa la consola del servidor
- Verifica que todas las foreign keys existan
- Asegúrate de que el código del producto sea único

## 📚 Documentación Relacionada

- `HEROUI_README.md` - Guía de Hero UI
- `SCHEMA_MIGRATION_SUMMARY.md` - Cambios del schema
- `FEATURES_STRUCTURE.md` - Arquitectura de features
