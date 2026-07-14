# Alabastro Catalog Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load the 7 Alabastro products (Aura, Vela, Cala, Eclipse, Sena, Lira, Orbita) from `newdat/catalogo_alabastro_estructurado.json` into the existing generic product schema (`products` / `product_variants` / `variant_configurations` / `product_finishes` / `variant_light_tones`), under a new `alabastro` category.

**Architecture:** Single idempotent SQL migration file, run the same way as `migrations/add-new-accessories-from-excel.sql` (via `node run-sql.mjs <file>` or the Supabase SQL editor). No schema changes, no new tables, no new API endpoints, no new frontend components — everything renders through the existing generic products admin/public pages.

**Tech Stack:** PostgreSQL (Supabase), plain SQL migration file.

## Global Constraints

- No new tables or columns — reuse `categories`, `products`, `product_variants`, `variant_configurations`, `product_finishes`, `finishes`, `variant_light_tones`, `light_tones` exactly as they exist today (see `FULL_SCHEMA.sql`).
- Reuse existing `finishes` rows: `bronce` (id 62), `negro` (id 41), `blanco` (id 42) — do not create new finishes.
- Reuse existing `light_tones` row: `cálida` (id 24, maps to 3000K) — do not create new light tones.
- `variant_configurations.watt` and `.lumens` are `NOT NULL` — every row must have both. `lumens` is an **estimate** at ~90 lm/W (median of existing catalog LED configs) except Aura, which uses external E27 lamps with no fixed wattage — Aura gets `watt = 120` (its rated "60W x 2" max) and `lumens = 0` as an explicit placeholder.
- All inserts must be idempotent (`ON CONFLICT ... DO UPDATE` / `DO NOTHING`) keyed on the natural unique columns (`products.code`, `product_variants.variant_code`, `variant_configurations.sku`, and composite PKs for join tables) so the script can be re-run safely.
- Media assets are explicitly out of scope — no `media_assets` rows in this migration; images will be uploaded later via the admin panel.

---

### Task 1: Write and verify the Alabastro migration SQL

**Files:**
- Create: `migrations/add-alabastro-products.sql`

**Interfaces:**
- Consumes: existing tables `categories`, `products`, `product_variants`, `variant_configurations`, `product_finishes`, `finishes`, `variant_light_tones`, `light_tones` (schema in `FULL_SCHEMA.sql`).
- Produces: 1 new category row (`alabastro`), 7 `products` rows, 16 `product_variants` rows, 16 `variant_configurations` rows, `product_finishes` links, `variant_light_tones` links — all addressable by `products.code` (`AUR`, `VEL`, `CAL`, `ECL`, `SEN`, `LIR`, `ORB`) for any later task (e.g. image upload) to reference.

- [ ] **Step 1: Write the migration file**

Create `migrations/add-alabastro-products.sql` with this exact content:

```sql
-- =============================================
-- MIGRACIÓN: Catálogo Alabastro 2026
-- Generado desde newdat/catalogo_alabastro_estructurado.json
-- Reutiliza el sistema genérico de productos (products/product_variants/variant_configurations)
-- =============================================

-- 1. Categoría nueva
INSERT INTO public.categories (slug, name)
VALUES ('alabastro', 'Alabastro')
ON CONFLICT (slug) DO NOTHING;

-- 2. Productos
INSERT INTO public.products (code, name, category_id, description, is_featured)
VALUES
  ('AUR', 'Aura', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'Aura combina la belleza del alabastro natural con una estructura metálica en bronce cepillado. Diseñado para utilizar dos lámparas E27 no incluidas, genera una iluminación cálida y envolvente que resalta las vetas únicas de cada pieza, convirtiéndola en un objeto de iluminación irrepetible.', false),
  ('VEL', 'Vela', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'Su diseño tubular proyecta una luz cálida y uniforme que resalta las vetas naturales del alabastro, convirtiendo cada pieza en un elemento único e irrepetible. Disponible en versiones de 600 y 800 mm. Una pieza atemporal que aporta sofisticación a proyectos residenciales y de hospitalidad.', false),
  ('CAL', 'Cala', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'La combinación entre alabastro natural y metal da origen a una pieza de presencia escultórica y elegancia atemporal. Su luz cálida realza las vetas propias de la piedra, transformando cada luminaria en una pieza única. Diseñada para integrarse con naturalidad en proyectos de arquitectura de alta gama.', false),
  ('ECL', 'Eclipse', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'Su forma circular en alabastro natural proyecta una luz cálida y envolvente, resaltando las vetas únicas de la piedra. El centro metálico aporta contraste y equilibrio, disponible en terminación bronce cepillado o negro. Disponible en diámetros de 200 y 300 mm.', false),
  ('SEN', 'Sena', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'Su diseño tubular en alabastro natural emite una luz cálida y uniforme, resaltando las vetas propias de la piedra. Disponible en largos de 320 y 570 mm, con terminación negro o bronce. Una pieza sutil y elegante, ideal para sumar verticalidad y calidez al espacio.', false),
  ('LIR', 'Lira', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'Lira combina la textura única del alabastro natural con una estructura metálica de líneas simples. Su luz cálida y envolvente realza la materialidad de la piedra, creando una presencia suave y sofisticada para espacios residenciales, hotelería y ambientaciones de alto nivel.', false),
  ('ORB', 'Orbita', (SELECT id FROM public.categories WHERE slug = 'alabastro'),
   'Orbita combina la calidez del alabastro natural con una forma circular de presencia escultórica. Su luz suave y envolvente resalta las vetas únicas de la piedra, creando una atmósfera elegante y sofisticada. Ideal para comedores, livings, hoteles y espacios de alto nivel.', false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description;

-- 3. Variantes (una por SKU del JSON)
INSERT INTO public.product_variants (product_id, variant_code, name, includes_led, includes_driver, cantidad)
VALUES
  ((SELECT id FROM public.products WHERE code = 'AUR'), 'aur-br', 'Aura Bronce cepillado', false, false, 2),

  ((SELECT id FROM public.products WHERE code = 'VEL'), 'vel-600-cal-br', 'Vela 600mm Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'VEL'), 'vel-800-cal-br', 'Vela 800mm Bronce cepillado', true, true, 1),

  ((SELECT id FROM public.products WHERE code = 'CAL'), 'cal-500-cal-br', 'Cala Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'CAL'), 'cal-500-cal-ng', 'Cala Negro', true, true, 1),

  ((SELECT id FROM public.products WHERE code = 'ECL'), 'ecl-200-cal-br', 'Eclipse 200mm Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'ECL'), 'ecl-300-cal-br', 'Eclipse 300mm Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'ECL'), 'ecl-200-cal-ng', 'Eclipse 200mm Negro', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'ECL'), 'ecl-300-cal-ng', 'Eclipse 300mm Negro', true, true, 1),

  ((SELECT id FROM public.products WHERE code = 'SEN'), 'sen-320-cal-br', 'Sena 320mm Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'SEN'), 'sen-570-cal-br', 'Sena 570mm Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'SEN'), 'sen-320-cal-ng', 'Sena 320mm Negro', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'SEN'), 'sen-570-cal-ng', 'Sena 570mm Negro', true, true, 1),

  ((SELECT id FROM public.products WHERE code = 'LIR'), 'lir-320-cal-br', 'Lira Bronce cepillado', true, true, 1),
  ((SELECT id FROM public.products WHERE code = 'LIR'), 'lir-320-cal-ng', 'Lira Negro', true, true, 1),

  ((SELECT id FROM public.products WHERE code = 'ORB'), 'orb-600-cal-bl', 'Orbita Florón blanco', true, true, 1)
ON CONFLICT (variant_code) DO UPDATE SET
  name = EXCLUDED.name,
  includes_led = EXCLUDED.includes_led,
  includes_driver = EXCLUDED.includes_driver,
  cantidad = EXCLUDED.cantidad;

-- 4. Configuraciones técnicas (una por variante)
INSERT INTO public.variant_configurations (variant_id, sku, watt, lumens, diameter_description, length_mm, width_mm, voltage, specs)
VALUES
  ((SELECT id FROM public.product_variants WHERE variant_code = 'aur-br'), 'AUR-BR', 120, 0, NULL, 500, 100, 220,
   '{"material":"Alabastro natural + metal","portalamparas":"2 x E27","potencia_maxima":"60 W x 2","temperatura_color":"Según lámpara utilizada","cri":"Según lámpara utilizada","fuente_de_luz":"Lámparas E27 no incluidas","profundidad_mm":60,"lumens_estimado":false}'::jsonb),

  ((SELECT id FROM public.product_variants WHERE variant_code = 'vel-600-cal-br'), 'VEL-600-CAL-BR', 10, 900, '60mm', 600, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'vel-800-cal-br'), 'VEL-800-CAL-BR', 12, 1080, '60mm', 800, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),

  ((SELECT id FROM public.product_variants WHERE variant_code = 'cal-500-cal-br'), 'CAL-500-CAL-BR', 12, 1080, NULL, 500, 100, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","profundidad_mm":50,"lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'cal-500-cal-ng'), 'CAL-500-CAL-NG', 12, 1080, NULL, 500, 100, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","profundidad_mm":50,"lumens_estimado":true}'::jsonb),

  ((SELECT id FROM public.product_variants WHERE variant_code = 'ecl-200-cal-br'), 'ECL-200-CAL-BR', 12, 1080, '200mm', NULL, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'ecl-300-cal-br'), 'ECL-300-CAL-BR', 12, 1080, '300mm', NULL, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'ecl-200-cal-ng'), 'ECL-200-CAL-NG', 12, 1080, '200mm', NULL, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'ecl-300-cal-ng'), 'ECL-300-CAL-NG', 12, 1080, '300mm', NULL, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),

  ((SELECT id FROM public.product_variants WHERE variant_code = 'sen-320-cal-br'), 'SEN-320-CAL-BR', 8, 720, '60mm', 320, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'sen-570-cal-br'), 'SEN-570-CAL-BR', 10, 900, '60mm', 570, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'sen-320-cal-ng'), 'SEN-320-CAL-NG', 8, 720, '60mm', 320, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'sen-570-cal-ng'), 'SEN-570-CAL-NG', 10, 900, '60mm', 570, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),

  ((SELECT id FROM public.product_variants WHERE variant_code = 'lir-320-cal-br'), 'LIR-320-CAL-BR', 8, 720, '60mm', 320, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),
  ((SELECT id FROM public.product_variants WHERE variant_code = 'lir-320-cal-ng'), 'LIR-320-CAL-NG', 8, 720, '60mm', 320, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","lumens_estimado":true}'::jsonb),

  ((SELECT id FROM public.product_variants WHERE variant_code = 'orb-600-cal-bl'), 'ORB-600-CAL-BL', 60, 5400, '600mm', 1500, NULL, 220,
   '{"material":"Alabastro natural + metal","fuente_de_luz":"LED integrado","seccion_mm":60,"altura_maxima_mm":1500,"lumens_estimado":true}'::jsonb)
ON CONFLICT (sku) DO UPDATE SET
  watt = EXCLUDED.watt,
  lumens = EXCLUDED.lumens,
  diameter_description = EXCLUDED.diameter_description,
  length_mm = EXCLUDED.length_mm,
  width_mm = EXCLUDED.width_mm,
  voltage = EXCLUDED.voltage,
  specs = EXCLUDED.specs;

-- 5. Acabados por producto (product_finishes)
INSERT INTO public.product_finishes (product_id, finish_id)
SELECT p.id, f.id FROM public.products p, public.finishes f
WHERE (p.code, f.slug) IN (
  ('AUR', 'bronce'),
  ('VEL', 'bronce'),
  ('CAL', 'bronce'), ('CAL', 'negro'),
  ('ECL', 'bronce'), ('ECL', 'negro'),
  ('SEN', 'bronce'), ('SEN', 'negro'),
  ('LIR', 'bronce'), ('LIR', 'negro'),
  ('ORB', 'blanco')
)
ON CONFLICT (product_id, finish_id) DO NOTHING;

-- 6. Tono de luz por variante (variant_light_tones) — todas menos Aura (sin LED integrado)
INSERT INTO public.variant_light_tones (variant_id, light_tone_id)
SELECT pv.id, (SELECT id FROM public.light_tones WHERE slug = 'cálida')
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE p.code IN ('VEL', 'CAL', 'ECL', 'SEN', 'LIR', 'ORB')
ON CONFLICT (variant_id, light_tone_id) DO NOTHING;

-- =============================================
-- Total: 1 categoría, 7 productos, 16 variantes, 16 configuraciones
-- =============================================
```

- [ ] **Step 2: Sanity-check the SQL statement count**

Run: `grep -c ";$" migrations/add-alabastro-products.sql`
Expected: a number greater than 0 (rough smoke check the file was written and isn't empty/truncated — exact count isn't meaningful since statements span multiple lines).

Then confirm variant/config counts line up 1:1 (16 each):
Run: `grep -c "^  ((SELECT id FROM public.product_variants" migrations/add-alabastro-products.sql`
Expected: `16`

- [ ] **Step 3: Apply the migration against the database**

This writes to the shared Supabase database — confirm with the user before running. Then run it the same way `add-new-accessories-from-excel.sql` was applied in this repo (check `apply-migrations.mjs` / `run-sql.mjs` / `apply-migrations.sh` for the exact working invocation, since these scripts try multiple connection strategies):

Run: `node run-sql.mjs migrations/add-alabastro-products.sql`
Expected: each statement logs success, no errors. If `run-sql.mjs`'s `exec_sql` RPC isn't available in this project, fall back to `node apply-migrations.mjs migrations/add-alabastro-products.sql` or paste the file into the Supabase SQL editor.

- [ ] **Step 4: Verify the data landed correctly**

Run this verification query (via `node run-sql.mjs` with a temp file, `psql`, or the Supabase SQL editor):

```sql
SELECT p.code, p.name, c.slug AS category,
       count(distinct pv.id) AS variants,
       count(distinct vc.id) AS configs,
       count(distinct pf.finish_id) AS finishes
FROM public.products p
JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.product_variants pv ON pv.product_id = p.id
LEFT JOIN public.variant_configurations vc ON vc.variant_id = pv.id
LEFT JOIN public.product_finishes pf ON pf.product_id = p.id
WHERE p.code IN ('AUR','VEL','CAL','ECL','SEN','LIR','ORB')
GROUP BY p.code, p.name, c.slug
ORDER BY p.code;
```

Expected: 7 rows, `category = 'alabastro'` for all, `variants`/`configs` counts matching (AUR:1, VEL:2, CAL:2, ECL:4, SEN:4, LIR:2, ORB:1), `finishes` matching (AUR:1, VEL:1, CAL:2, ECL:2, SEN:2, LIR:2, ORB:1).

- [ ] **Step 5: Commit**

```bash
git add migrations/add-alabastro-products.sql
git commit -m "feat: load Alabastro catalog products into generic product schema"
```

---

## Post-plan follow-up (not part of this plan)

- Images: once the user sends photos, upload them via the admin product edit UI (same flow as accessories) — creates `media_assets` rows, no SQL needed.
- `lumens_estimado: true` in `specs` flags every LED-integrated config's lumens as an estimate; Aura's `lumens = 0` is an explicit "no data" placeholder — both can be corrected later from the admin panel once real photometric data is available.
