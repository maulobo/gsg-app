-- Migración: Cambiar length_mm y width_mm de numeric a text
-- Permite valores como "40x40", "30-60", etc.

-- 1. Cambiar el tipo de columna length_mm
ALTER TABLE variant_configurations 
  ALTER COLUMN length_mm TYPE TEXT USING length_mm::TEXT;

-- 2. Cambiar el tipo de columna width_mm
ALTER TABLE variant_configurations 
  ALTER COLUMN width_mm TYPE TEXT USING width_mm::TEXT;

-- 3. Verificar el cambio
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'variant_configurations' 
-- AND column_name IN ('length_mm', 'width_mm');
