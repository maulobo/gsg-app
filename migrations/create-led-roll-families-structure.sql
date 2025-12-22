-- Migración: Estructura normalizada para LED Rolls
-- Crea familias de LED rolls y mantiene variantes específicas

-- 1. Crear tabla de familias de LED rolls (modelos)
CREATE TABLE IF NOT EXISTS led_roll_families (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, -- ej: "COB 5 w/m", "SMD 9,6 w/m"
  description TEXT,
  
  -- Características generales compartidas por todas las variantes
  led_type TEXT, -- ej: "COB", "2835", "5050"
  adhesive TEXT, -- ej: "3M Original"
  roll_length_m DECIMAL(10,2), -- ej: 5
  dimmable BOOLEAN DEFAULT true,
  leds_per_meter INTEGER, -- puede ser NULL si varía por variante
  cri INTEGER, -- ej: 80, 90
  pcb_width_mm DECIMAL(10,2), -- ej: 8, 10, 30
  warranty_years INTEGER DEFAULT 3,
  
  -- Notas técnicas
  technical_note TEXT, -- ej: "Permite el corte cada 10 mm"
  cut_note TEXT, -- ej: "Permite alimentar 25m sin caída"
  general_note TEXT, -- ej: "La silicona aumenta la temperatura color"
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modificar tabla led_rolls para que sea de variantes
-- Primero renombrar la tabla actual si tiene datos
ALTER TABLE IF EXISTS led_rolls RENAME TO led_rolls_old;

-- Crear nueva tabla led_rolls como variantes
CREATE TABLE IF NOT EXISTS led_rolls (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES led_roll_families(id) ON DELETE CASCADE,
  
  -- Identificación única de la variante
  code TEXT NOT NULL UNIQUE, -- ej: "LED-COB-05W-CAL", "LED-09W-FRI"
  name TEXT, -- Nombre descriptivo opcional
  
  -- Características específicas de esta variante
  watts_per_meter DECIMAL(10,2) NOT NULL, -- ej: 5, 9.6, 14.4
  lumens_per_meter INTEGER, -- puede ser NULL
  kelvin INTEGER, -- Temperatura de color: 2700, 3000, 4000, 6000
  tone_label TEXT, -- ej: "3000K", "RGB", "RGB+3000K", "3K-6K"
  voltage INTEGER NOT NULL, -- ej: 12, 24
  ip_rating INTEGER DEFAULT 20, -- ej: 20, 65, 67
  
  -- Específicos que pueden variar
  leds_per_meter_variant INTEGER, -- Si es diferente del family
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de medios para familias (fotos del modelo)
CREATE TABLE IF NOT EXISTS led_roll_family_media (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES led_roll_families(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cover', 'gallery', 'tech', 'video')),
  alt_text TEXT,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de medios para variantes específicas (opcional)
CREATE TABLE IF NOT EXISTS led_roll_media (
  id SERIAL PRIMARY KEY,
  roll_id INTEGER NOT NULL REFERENCES led_rolls(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cover', 'detail', 'application')),
  alt_text TEXT,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_led_roll_families_active ON led_roll_families(is_active);
CREATE INDEX IF NOT EXISTS idx_led_roll_families_featured ON led_roll_families(featured);
CREATE INDEX IF NOT EXISTS idx_led_rolls_family_id ON led_rolls(family_id);
CREATE INDEX IF NOT EXISTS idx_led_rolls_code ON led_rolls(code);
CREATE INDEX IF NOT EXISTS idx_led_rolls_active ON led_rolls(is_active);
CREATE INDEX IF NOT EXISTS idx_led_roll_family_media_family ON led_roll_family_media(family_id);
CREATE INDEX IF NOT EXISTS idx_led_roll_media_roll ON led_roll_media(roll_id);

-- 6. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_led_roll_families_updated_at
  BEFORE UPDATE ON led_roll_families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_led_rolls_updated_at
  BEFORE UPDATE ON led_rolls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Comentarios para documentación
COMMENT ON TABLE led_roll_families IS 'Familias/modelos de tiras LED con características compartidas';
COMMENT ON TABLE led_rolls IS 'Variantes específicas de tiras LED con código único';
COMMENT ON COLUMN led_roll_families.led_type IS 'Tipo de LED: COB, 2835, 5050, etc.';
COMMENT ON COLUMN led_rolls.code IS 'Código único de la variante (SKU)';
COMMENT ON COLUMN led_rolls.tone_label IS 'Etiqueta de tono: 3000K, RGB, RGB+3000K, etc.';
COMMENT ON COLUMN led_rolls.kelvin IS 'Temperatura de color en Kelvin (si es monocromático)';

-- 8. Row Level Security (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE led_roll_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_roll_family_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_roll_media ENABLE ROW LEVEL SECURITY;

-- Políticas para led_roll_families
-- Lectura pública
CREATE POLICY "led_roll_families_select_public" ON led_roll_families
  FOR SELECT USING (true);

-- Solo service_role puede insertar/actualizar/borrar
CREATE POLICY "led_roll_families_insert_service_role" ON led_roll_families
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_roll_families_update_service_role" ON led_roll_families
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_roll_families_delete_service_role" ON led_roll_families
  FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- Políticas para led_rolls
-- Lectura pública
CREATE POLICY "led_rolls_select_public" ON led_rolls
  FOR SELECT USING (true);

-- Solo service_role puede insertar/actualizar/borrar
CREATE POLICY "led_rolls_insert_service_role" ON led_rolls
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_rolls_update_service_role" ON led_rolls
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_rolls_delete_service_role" ON led_rolls
  FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- Políticas para led_roll_family_media
-- Lectura pública
CREATE POLICY "led_roll_family_media_select_public" ON led_roll_family_media
  FOR SELECT USING (true);

-- Solo service_role puede insertar/actualizar/borrar
CREATE POLICY "led_roll_family_media_insert_service_role" ON led_roll_family_media
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_roll_family_media_update_service_role" ON led_roll_family_media
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_roll_family_media_delete_service_role" ON led_roll_family_media
  FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- Políticas para led_roll_media
-- Lectura pública
CREATE POLICY "led_roll_media_select_public" ON led_roll_media
  FOR SELECT USING (true);

-- Solo service_role puede insertar/actualizar/borrar
CREATE POLICY "led_roll_media_insert_service_role" ON led_roll_media
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_roll_media_update_service_role" ON led_roll_media
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "led_roll_media_delete_service_role" ON led_roll_media
  FOR DELETE USING (auth.jwt()->>'role' = 'service_role');
