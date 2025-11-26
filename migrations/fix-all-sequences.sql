-- Migration: Fix all table sequences
-- Date: 2025-11-25
-- Description: Resets sequences to prevent duplicate key errors

-- Reset products sequence
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Reset product_variants sequence
SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));

-- Reset variant_configurations sequence
SELECT setval('variant_configurations_id_seq', (SELECT MAX(id) FROM variant_configurations));

-- Verify all sequences
SELECT 'products_id_seq' as sequence, last_value FROM products_id_seq
UNION ALL
SELECT 'product_variants_id_seq', last_value FROM product_variants_id_seq
UNION ALL
SELECT 'variant_configurations_id_seq', last_value FROM variant_configurations_id_seq;
