# 📦 Script de Migración de Productos GSG → Supabase

Este script convierte tu archivo `gsg.products.json` en un archivo SQL compatible con tu esquema de Supabase.

## 🗄️ Esquema de Supabase

El script genera INSERTs para las siguientes tablas:

```
categories
  ├─ id, slug, name

finishes
  ├─ id, slug, name

light_tones
  ├─ id, slug, name, kelvin

products
  ├─ id, code, name, category_id, description, is_featured
  └─ product_variants
      ├─ id, product_id, variant_code, name
      ├─ includes_led, includes_driver, cantidad
      ├─ product_configurations
      │   ├─ variant_id, sku
      │   ├─ voltage_min, voltage_max, voltage_label
      │   ├─ watt, lumens, length_mm, width_mm
      │   └─ diameter_description, specs
      ├─ product_variant_finishes (N:N con finishes)
      ├─ product_variant_light_tones (N:N con light_tones)
      └─ media_assets
          ├─ product_id, variant_id, path
          └─ kind (cover | gallery), alt_text
```

## 📋 Estructura esperada de `gsg.products.json`

```json
[
  {
    "code": "PROD-001",
    "nombre": "Lámpara LED",
    "descripcion": "Descripción del producto",
    "categoria": "Lámparas",
    "modelos": [
      {
        "id": "PROD-001-V1",
        "subnombre": "Variante Básica",
        "foto_portada": "https://...",
        "fotos_producto": "https://...",
        "caracteristicasTecnicas": {
          "watt": [10, 15, 20],
          "volt": "110-220",
          "tono": ["cálida", "fría"],
          "kelvin": [3000, 6000],
          "lumen": [800, 1200],
          "acabado": ["aluminio", "blanco mate"],
          "cantidad": 1,
          "incluyeLed": true,
          "incluyeEquipo": false,
          "diametro": [100, 150],
          "largo": [200],
          "ancho": [50],
          "dimension": []
        }
      }
    ]
  }
]
```

## 🚀 Uso

### 1. Preparar el archivo JSON

Coloca tu archivo `gsg.products.json` en la **raíz del proyecto**:

```bash
/Users/maurolobo/SmartCloud/gsg-dash/app-gsg/
  ├── gsg.products.json  ← Aquí
  ├── src/
  ├── package.json
  └── ...
```

### 2. Ejecutar el script

```bash
# Con ts-node
npx ts-node src/script/migra.ts

# O con Node.js (si tienes tsx)
npx tsx src/script/migra.ts
```

### 3. Verificar el output

Se genera el archivo `out.sql` en la raíz:

```bash
✅ Migración completada!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Archivo generado: /path/to/out.sql
📦 Categorías: 5
🎨 Acabados: 12
💡 Tonos de luz: 4
📦 Productos: 25
🔧 Variantes: 48
📄 Total de statements SQL: 520
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Importar a Supabase

1. Abre **Supabase SQL Editor**
2. *(Opcional)* Si quieres limpiar datos anteriores:
   ```sql
   TRUNCATE TABLE 
     media_assets,
     product_configurations,
     product_variant_finishes,
     product_variant_light_tones,
     product_variants,
     products,
     categories,
     finishes,
     light_tones
   RESTART IDENTITY CASCADE;
   ```
3. Copia todo el contenido de `out.sql`
4. Pégalo en el SQL Editor
5. Click en **Run** ▶️

## 🔧 Funcionalidades del script

### ✅ Limpieza automática de datos
- Normaliza strings (trim, espacios múltiples, caracteres especiales)
- Parsea arrays en diferentes formatos: `[1,2,3]`, `"1/2/3"`, `"1 x 2 x 3"`
- Corrige JSON malformado con comillas raras
- Mapea nombres de tonos a formato estándar

### ✅ Generación inteligente
- Crea categorías/acabados/tonos automáticamente (no duplica)
- Genera slugs automáticos para SEO
- Crea múltiples configuraciones si hay arrays de specs
- Maneja voltajes en diferentes formatos: `"110-220"`, `"110/220"`, etc.

### ✅ Validación
- Filtra valores inválidos (NaN, null, undefined)
- Convierte tipos correctamente (int, numeric, text[])
- Escapa comillas en strings SQL
- Maneja campos opcionales

## 📊 Ejemplo de conversión

**Input JSON:**
```json
{
  "code": "SPOT-001",
  "nombre": "Spot Empotrable",
  "categoria": "Spots",
  "modelos": [{
    "subnombre": "10W",
    "caracteristicasTecnicas": {
      "watt": [10, 15],
      "volt": "110-220",
      "tono": ["cálida", "fría"],
      "acabado": ["blanco mate"]
    }
  }]
}
```

**Output SQL:**
```sql
INSERT INTO categories(id, slug, name) VALUES (1, 'spots', 'Spots');
INSERT INTO finishes(id, slug, name) VALUES (1, 'blanco-mate', 'blanco mate');
INSERT INTO light_tones(id, slug, name) VALUES (1, 'calida', 'cálida');
INSERT INTO light_tones(id, slug, name) VALUES (2, 'fria', 'fría');

INSERT INTO products(id, code, name, category_id, description, is_featured) 
VALUES (1, 'SPOT-001', 'Spot Empotrable', 1, NULL, false);

INSERT INTO product_variants(id, product_id, variant_code, name, includes_led, includes_driver, cantidad)
VALUES (1, 1, 'SPOT-001-v1', '10W', false, false, 1);

INSERT INTO product_configurations(variant_id, sku, voltage_min, voltage_max, voltage_label, watt, lumens, ...)
VALUES (1, 'SPOT-001-v1-cfg1', 110, 220, '110-220', 10, NULL, ...);

INSERT INTO product_configurations(variant_id, sku, voltage_min, voltage_max, voltage_label, watt, lumens, ...)
VALUES (1, 'SPOT-001-v1-cfg2', 110, 220, '110-220', 15, NULL, ...);

INSERT INTO product_variant_finishes(variant_id, finish_id) VALUES (1, 1);
INSERT INTO product_variant_light_tones(variant_id, light_tone_id) VALUES (1, 1);
INSERT INTO product_variant_light_tones(variant_id, light_tone_id) VALUES (1, 2);
```

## ⚠️ Consideraciones

### Arrays de specs
Si un modelo tiene múltiples valores (ej: `watt: [10, 15, 20]`), el script crea **múltiples configuraciones** (una por cada valor).

### Imágenes
Las URLs de `foto_portada` y `fotos_producto` se guardan directamente. Si usas R2, actualiza las URLs después de subir las imágenes.

### IDs
El script genera IDs secuenciales. Si ya tienes datos en Supabase, considera:
- Usar `TRUNCATE ... RESTART IDENTITY` para reiniciar secuencias
- O modificar el script para usar IDs más altos

## 🐛 Troubleshooting

### Error: "Cannot find module 'ts-node'"
```bash
npm install -D ts-node
```

### Error: "Cannot find module './gsg.products.json'"
Asegúrate de que `gsg.products.json` esté en la raíz del proyecto, no en `src/`.

### Error: "duplicate key value violates unique constraint"
Ya existen datos en Supabase. Haz TRUNCATE o modifica los IDs del script.

### Datos incorrectos en Supabase
Revisa `out.sql` antes de ejecutarlo. Puedes editarlo manualmente si necesitas correcciones.

## 📝 Logs

El script muestra estadísticas al finalizar:
- **Categorías**: Cuántas categorías únicas se crearon
- **Acabados**: Cuántos acabados únicos se crearon
- **Tonos**: Cuántos tonos de luz únicos se crearon
- **Productos**: Cuántos productos base se crearon
- **Variantes**: Cuántas variantes totales se crearon

## 🔄 Actualizaciones

Si necesitas volver a ejecutar el script:

1. **Opción A: Limpiar todo**
   ```sql
   TRUNCATE TABLE products CASCADE;
   ```

2. **Opción B: Agregar solo nuevos productos**
   - Modifica el script para detectar productos existentes
   - O filtra el JSON para incluir solo productos nuevos

---

**Autor**: Script generado para GSG Dashboard  
**Versión**: 1.0  
**Última actualización**: Octubre 2025
