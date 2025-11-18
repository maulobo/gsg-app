-- =============================================
-- SCHEMA COMPLETO - GSG Dashboard
-- =============================================
-- Todas las tablas, relaciones, índices, triggers y RLS policies
-- Base de datos completa para migración
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- TABLA: categories
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: variants
-- =============================================
CREATE TABLE IF NOT EXISTS variants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: light_tones
-- =============================================
CREATE TABLE IF NOT EXISTS light_tones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color_code TEXT,
  kelvin_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: finishes
-- =============================================
CREATE TABLE IF NOT EXISTS finishes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: wts
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  variant_id INTEGER REFERENCES variants(id) ON DELETE SET NULL,
  light_tone_id INTEGER REFERENCES light_tones(id) ON DELETE SET NULL,
  finish_id INTEGER REFERENCES finishes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  technical_specs JSONB,
  images TEXT[],
  videos TEXT[],
  pdfs TEXT[],
  stock INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: led_diffusers
-- =============================================
CREATE TABLE IF NOT EXISTS led_diffusers (
  id SERIAL PRIMARY KEY,
  light_tone_id INTEGER NOT NULL REFERENCES light_tones(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(light_tone_id, material)
);

-- =============================================
-- TABLA: led_profiles
-- =============================================
CREATE TABLE IF NOT EXISTS led_profiles (
  id SERIAL PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  diffuser_id INTEGER REFERENCES led_diffusers(id) ON DELETE SET NULL,
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  length DECIMAL(10,2),
  images TEXT[],
  videos TEXT[],
  pdfs TEXT[],
  technical_specs JSONB,
  stock INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: led_rolls
-- =============================================
CREATE TABLE IF NOT EXISTS led_rolls (
  id SERIAL PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  watts_per_meter DECIMAL(10,2),
  lumens_per_meter INTEGER,
  cri INTEGER,
  ip_rating TEXT,
  voltage INTEGER,
  cut_length DECIMAL(10,2),
  width DECIMAL(10,2),
  images TEXT[],
  videos TEXT[],
  pdfs TEXT[],
  technical_specs JSONB,
  stock INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: led_roll_light_tones (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS led_roll_light_tones (
  id SERIAL PRIMARY KEY,
  led_roll_id INTEGER NOT NULL REFERENCES led_rolls(id) ON DELETE CASCADE,
  light_tone_id INTEGER NOT NULL REFERENCES light_tones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(led_roll_id, light_tone_id)
);

-- =============================================
-- TABLA: accessories
-- =============================================
CREATE TABLE IF NOT EXISTS accessories (
  id SERIAL PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  images TEXT[],
  videos TEXT[],
  pdfs TEXT[],
  technical_specs JSONB,
  stock INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: user_profiles
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: distributor_zones
-- =============================================
CREATE TABLE IF NOT EXISTS distributor_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: distributors
-- =============================================
CREATE TABLE IF NOT EXISTS distributors (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES distributor_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  google_maps_url TEXT,
  email TEXT,
  website TEXT,
  contact_person TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDICES PARA OPTIMIZACIÓN
-- =============================================

-- Products indices
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_id ON products(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_light_tone_id ON products(light_tone_id);
CREATE INDEX IF NOT EXISTS idx_products_finish_id ON products(finish_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

-- LED Profiles indices
CREATE INDEX IF NOT EXISTS idx_led_profiles_diffuser_id ON led_profiles(diffuser_id);
CREATE INDEX IF NOT EXISTS idx_led_profiles_featured ON led_profiles(featured);
CREATE INDEX IF NOT EXISTS idx_led_profiles_active ON led_profiles(active);
CREATE INDEX IF NOT EXISTS idx_led_profiles_model ON led_profiles(model);

-- LED Rolls indices
CREATE INDEX IF NOT EXISTS idx_led_rolls_featured ON led_rolls(featured);
CREATE INDEX IF NOT EXISTS idx_led_rolls_active ON led_rolls(active);
CREATE INDEX IF NOT EXISTS idx_led_rolls_model ON led_rolls(model);

-- LED Roll Light Tones indices
CREATE INDEX IF NOT EXISTS idx_led_roll_light_tones_roll_id ON led_roll_light_tones(led_roll_id);
CREATE INDEX IF NOT EXISTS idx_led_roll_light_tones_tone_id ON led_roll_light_tones(light_tone_id);

-- Accessories indices
CREATE INDEX IF NOT EXISTS idx_accessories_featured ON accessories(featured);
CREATE INDEX IF NOT EXISTS idx_accessories_active ON accessories(active);
CREATE INDEX IF NOT EXISTS idx_accessories_category ON accessories(category);

-- Distributors indices
CREATE INDEX IF NOT EXISTS idx_distributors_zone_id ON distributors(zone_id);
CREATE INDEX IF NOT EXISTS idx_distributors_active ON distributors(active);
CREATE INDEX IF NOT EXISTS idx_distributors_locality ON distributors(locality);

-- LED Diffusers indices
CREATE INDEX IF NOT EXISTS idx_led_diffusers_light_tone_id ON led_diffusers(light_tone_id);

-- =============================================
-- FUNCIÓN: update_updated_at_column
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS PARA updated_at
-- =============================================

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at 
  BEFORE UPDATE ON variants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_light_tones_updated_at 
  BEFORE UPDATE ON light_tones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finishes_updated_at 
  BEFORE UPDATE ON finishes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_led_profiles_updated_at 
  BEFORE UPDATE ON led_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_led_rolls_updated_at 
  BEFORE UPDATE ON led_rolls 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessories_updated_at 
  BEFORE UPDATE ON accessories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributor_zones_updated_at 
  BEFORE UPDATE ON distributor_zones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributors_updated_at 
  BEFORE UPDATE ON distributors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_led_diffusers_updated_at 
  BEFORE UPDATE ON led_diffusers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES: distributor_zones
-- =============================================
INSERT INTO distributor_zones (name, display_order) VALUES
  ('GBA OESTE', 1),
  ('GBA SUR', 2),
  ('MENDOZA', 3),
  ('NEUQUÉN', 4)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- RLS (Row Level Security) - OPCIONAL
-- =============================================
-- Descomentar si querés habilitar RLS

-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE led_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE led_rolls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users only" ON products FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable delete for authenticated users only" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE categories IS 'Categorías de productos (ej: Perfiles, Tiras LED, etc)';
COMMENT ON TABLE variants IS 'Variantes de productos';
COMMENT ON TABLE light_tones IS 'Tonos de luz disponibles (cálido, frío, RGB, etc)';
COMMENT ON TABLE finishes IS 'Acabados/terminaciones de productos';
COMMENT ON TABLE products IS 'Productos principales del catálogo';
COMMENT ON TABLE led_profiles IS 'Perfiles LED con especificaciones técnicas';
COMMENT ON TABLE led_diffusers IS 'Difusores para perfiles LED (tono + material)';
COMMENT ON TABLE led_rolls IS 'Tiras/rollos LED con múltiples tonos de luz';
COMMENT ON TABLE led_roll_light_tones IS 'Relación muchos a muchos entre rollos LED y tonos de luz';
COMMENT ON TABLE accessories IS 'Accesorios y complementos';
COMMENT ON TABLE distributor_zones IS 'Zonas geográficas de distribución';
COMMENT ON TABLE distributors IS 'Distribuidores autorizados por zona';
COMMENT ON TABLE user_profiles IS 'Perfiles de usuarios del sistema';

-- =============================================
-- VERIFICACIÓN
-- =============================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE 'Total de tablas creadas: %', table_count;
END $$;

-- =============================================
-- FIN DEL SCHEMA
-- =============================================
-- Siguiente paso: Importar datos desde supabase-export/*.sql
-- =============================================
