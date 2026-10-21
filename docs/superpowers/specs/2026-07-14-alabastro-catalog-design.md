# Catálogo Alabastro — carga de productos (2026-07-14)

## Contexto

Se agrega la nueva línea "Alabastro" (7 productos: Aura, Vela, Cala, Eclipse, Sena, Lira, Orbita) descrita en
`newdat/catalogo_alabastro_estructurado.json`. La decisión es **reutilizar el sistema genérico de productos**
(`products` / `product_variants` / `variant_configurations` / `product_finishes` / `media_assets`) que ya usan
productos como Buro, Quadra, Saturno XL — no se crean tablas nuevas ni endpoints nuevos.

## Categoría

Insert en `categories`: slug `alabastro`, name `Alabastro`. Es una categoría nueva y separada de
`pared`/`colgantes` (decisión explícita del usuario), y aparece automáticamente en nav/admin porque las
categorías se leen dinámicamente de la tabla (no hay listas hardcodeadas en el front).

## Productos (`products`)

Un row por producto del JSON: `code` (ej. `AUR`, `VEL`, `CAL`, `ECL`, `SEN`, `LIR`, `ORB`), `name`,
`category_id` = id de `alabastro`, `description` = texto del JSON, `is_featured = false`.

## Variantes (`product_variants`)

Cada SKU del JSON (`variantes[]`) se mapea 1:1 a un `product_variant`:
- `variant_code` = sku en minúsculas
- `name` = nombre de producto + terminación/tamaño
- `includes_led = true` para todos excepto **Aura**, que usa lámparas E27 no incluidas → `includes_led = false`
- `cantidad = 1`, excepto Aura `cantidad = 2` (dos portalámparas E27)
- `includes_driver`: true para los que usan LED integrado, null/false para Aura

## Configuración técnica (`variant_configurations`)

Un config por variante (el JSON no tiene sub-variantes de watt/lumen dentro de un mismo SKU):
- `sku` = mismo SKU de la variante
- `watt` = valor del JSON
- `lumens` = **estimado** con ratio ~90 lm/W (mediana observada en configuraciones LED existentes del catálogo,
  que varía 53–160 lm/W). Mapeo usado: 8W→720, 10W→900, 12W→1080, 60W→5400. Queda marcado como estimación a
  revisar/ajustar manualmente después. **Aura** no tiene watt fijo (depende de la lámpara que ponga el cliente)
  → `lumens = 0`, pendiente de completar a mano.
- `voltage = 220`
- `length_mm` / `width_mm` o `diameter_description` según las dimensiones del JSON (alto, diámetro)
- `specs` (jsonb): resto de la ficha técnica sin columna propia — `material`, `cri`, `fuente_de_luz`,
  `portalamparas`, `potencia_maxima`, `altura_maxima`, `seccion`, etc.

## Acabados (`product_finishes`)

Se linkean a finishes ya existentes, sin crear nuevos:
- `bronce` → id 62
- `negro` → id 41
- `blanco` → id 42 (Orbita, "Florón blanco")

## Tono de luz (`variant_light_tones`)

3000K del JSON → `cálida` (id 24), para las variantes con LED integrado. Aura no tiene tono fijo → se omite.

## Imágenes (`media_assets`)

El JSON no trae imágenes. Se dejan sin `media_assets` por ahora; el usuario las va a mandar después y se
suben manualmente desde el panel admin (mismo flujo que accesorios).

## Implementación

Un script de migración SQL `migrations/add-alabastro-products.sql` con los INSERT correspondientes, siguiendo
el mismo patrón que `migrations/add-new-accessories-from-excel.sql`. No requiere cambios de schema (no hay
columnas nuevas, no hay tablas nuevas), no requiere endpoints nuevos ni componentes de front nuevos — todo pasa
por las páginas/API genéricas de `products` que ya existen y funcionan para el resto del catálogo.

## Fuera de alcance

- Imágenes/media (pendiente, el usuario las manda después).
- Corrección fina de `lumens` estimados (queda como placeholder razonable, ajustable después vía admin).
