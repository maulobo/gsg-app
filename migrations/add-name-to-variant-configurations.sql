-- Migration: Add name column to variant_configurations table
-- Date: 2025-11-25
-- Description: Adds a name field to store configuration names

ALTER TABLE variant_configurations 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing records to populate name from SKU
-- Example: URA-C14-XXX-XX -> URA C14
UPDATE variant_configurations
SET name = SPLIT_PART(sku, '-', 1) || ' ' || SPLIT_PART(sku, '-', 2)
WHERE name IS NULL AND sku IS NOT NULL;
