-- Migration: Add 'name' column to variant_configurations table
-- Date: 2025-11-18
-- Description: Adds a name field to variant configurations to allow custom naming

ALTER TABLE variant_configurations
ADD COLUMN IF NOT EXISTS name TEXT;

-- Optional: Add a comment to the column
COMMENT ON COLUMN variant_configurations.name IS 'Custom name for the configuration (optional)';
