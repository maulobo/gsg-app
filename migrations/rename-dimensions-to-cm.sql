-- Renombrar columnas de mm a cm en variant_configurations
ALTER TABLE variant_configurations 
  RENAME COLUMN length_mm TO length_cm;

ALTER TABLE variant_configurations 
  RENAME COLUMN width_mm TO width_cm;

-- Comentarios para documentar que ahora son centímetros
COMMENT ON COLUMN variant_configurations.length_cm IS 'Largo en centímetros';
COMMENT ON COLUMN variant_configurations.width_cm IS 'Ancho en centímetros';
