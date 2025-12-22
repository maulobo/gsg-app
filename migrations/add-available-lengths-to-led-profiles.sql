-- Agregar campo available_lengths a led_profiles
ALTER TABLE led_profiles 
ADD COLUMN IF NOT EXISTS available_lengths TEXT;

-- Comentario descriptivo
COMMENT ON COLUMN led_profiles.available_lengths IS 'Largos disponibles del perfil, ej: "1m, 2m, 3m o a medida"';
