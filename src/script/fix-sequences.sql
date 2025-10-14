-- Fix sequences after migration
-- Run this in Supabase SQL Editor if you get "duplicate key" errors

-- Reset product_variants sequence
SELECT setval(
  'product_variants_id_seq', 
  COALESCE((SELECT MAX(id) FROM product_variants), 0) + 1, 
  false
);

-- Reset variant_configurations sequence
SELECT setval(
  'variant_configurations_id_seq', 
  COALESCE((SELECT MAX(id) FROM variant_configurations), 0) + 1, 
  false
);

-- Reset products sequence
SELECT setval(
  'products_id_seq', 
  COALESCE((SELECT MAX(id) FROM products), 0) + 1, 
  false
);

-- Reset media_assets sequence
SELECT setval(
  'media_assets_id_seq', 
  COALESCE((SELECT MAX(id) FROM media_assets), 0) + 1, 
  false
);

-- Reset categories sequence
SELECT setval(
  'categories_id_seq', 
  COALESCE((SELECT MAX(id) FROM categories), 0) + 1, 
  false
);

-- Reset finishes sequence
SELECT setval(
  'finishes_id_seq', 
  COALESCE((SELECT MAX(id) FROM finishes), 0) + 1, 
  false
);

-- Reset light_tones sequence
SELECT setval(
  'light_tones_id_seq', 
  COALESCE((SELECT MAX(id) FROM light_tones), 0) + 1, 
  false
);

-- Verify sequences
SELECT 
  'product_variants' as table_name,
  (SELECT MAX(id) FROM product_variants) as max_id,
  (SELECT last_value FROM product_variants_id_seq) as sequence_value
UNION ALL
SELECT 
  'variant_configurations',
  (SELECT MAX(id) FROM variant_configurations),
  (SELECT last_value FROM variant_configurations_id_seq)
UNION ALL
SELECT 
  'products',
  (SELECT MAX(id) FROM products),
  (SELECT last_value FROM products_id_seq)
UNION ALL
SELECT 
  'media_assets',
  (SELECT MAX(id) FROM media_assets),
  (SELECT last_value FROM media_assets_id_seq)
UNION ALL
SELECT 
  'categories',
  (SELECT MAX(id) FROM categories),
  (SELECT last_value FROM categories_id_seq)
UNION ALL
SELECT 
  'finishes',
  (SELECT MAX(id) FROM finishes),
  (SELECT last_value FROM finishes_id_seq)
UNION ALL
SELECT 
  'light_tones',
  (SELECT MAX(id) FROM light_tones),
  (SELECT last_value FROM light_tones_id_seq);
