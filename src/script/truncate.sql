-- ⚠️  CUIDADO: Esto ELIMINA TODOS los productos y catálogos
-- Solo ejecuta si quieres empezar de cero

-- Desactivar triggers y constraints temporalmente
SET session_replication_role = replica;

-- Eliminar TODOS los registros de TODAS las tablas relacionadas
DELETE FROM media_assets;
DELETE FROM product_configurations;
DELETE FROM product_variant_finishes;
DELETE FROM product_variant_light_tones;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM finishes;
DELETE FROM light_tones;

-- Reiniciar las secuencias de IDs
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE finishes_id_seq RESTART WITH 1;
ALTER SEQUENCE light_tones_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE product_variants_id_seq RESTART WITH 1;
ALTER SEQUENCE product_configurations_id_seq RESTART WITH 1;
ALTER SEQUENCE media_assets_id_seq RESTART WITH 1;

-- Reactivar triggers y constraints
SET session_replication_role = DEFAULT;

-- ✅ Ahora puedes ejecutar out.sql
