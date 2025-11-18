-- ============================================
-- LED Roll Model Light Tones - Migration
-- ============================================
-- Crear tabla de relación N:N entre modelos de LED rolls y tonos de luz
-- Esto permite que un modelo tenga múltiples tonos (ej: 3000K, 4000K, 6000K)

-- 1. Crear tabla de relación N:N
CREATE TABLE IF NOT EXISTS led_roll_model_light_tones (
  model_id BIGINT NOT NULL REFERENCES led_roll_models(id) ON DELETE CASCADE,
  light_tone_id BIGINT NOT NULL REFERENCES light_tones(id) ON DELETE CASCADE,
  PRIMARY KEY (model_id, light_tone_id)
);

-- 2. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_led_roll_model_light_tones_model_id 
  ON led_roll_model_light_tones(model_id);

CREATE INDEX IF NOT EXISTS idx_led_roll_model_light_tones_light_tone_id 
  ON led_roll_model_light_tones(light_tone_id);

-- 3. Comentarios para documentación
COMMENT ON TABLE led_roll_model_light_tones IS 
  'Relación N:N entre modelos de rollos LED y tonos de luz. Permite múltiples tonos por modelo.';

COMMENT ON COLUMN led_roll_model_light_tones.model_id IS 
  'ID del modelo de rollo LED';

COMMENT ON COLUMN led_roll_model_light_tones.light_tone_id IS 
  'ID del tono de luz (light_tones)';

-- 4. Migrar datos existentes (si hay modelos con light_tone_id)
-- Esto tomará los modelos existentes que tienen light_tone_id y los migrará a la nueva tabla
INSERT INTO led_roll_model_light_tones (model_id, light_tone_id)
SELECT id, light_tone_id 
FROM led_roll_models 
WHERE light_tone_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. OPCIONAL: Si quieres deprecar el campo light_tone_id en led_roll_models
-- Descomenta estas líneas después de verificar que la migración funcionó:
-- ALTER TABLE led_roll_models DROP COLUMN IF EXISTS light_tone_id;

-- 6. Verificación
DO $$
BEGIN
  RAISE NOTICE 'Migración completada. Revisa los datos:';
  RAISE NOTICE 'Total de relaciones creadas: %', (SELECT COUNT(*) FROM led_roll_model_light_tones);
END $$;
