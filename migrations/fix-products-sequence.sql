-- Migration: Fix products table sequence
-- Date: 2025-11-25
-- Description: Resets the products_id_seq to the maximum ID in the table

-- Reset the sequence to the maximum ID + 1
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Verify the sequence
SELECT last_value FROM products_id_seq;
