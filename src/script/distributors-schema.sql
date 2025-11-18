-- =============================================
-- DISTRIBUIDORES SCHEMA
-- =============================================
-- Tablas para gestionar distribuidores y sus zonas geográficas
-- Author: SmartEngineer
-- Date: 2025-11-14
-- =============================================

-- 1. Tabla de zonas de distribución
CREATE TABLE IF NOT EXISTS distributor_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 'GBA OESTE', 'GBA SUR', 'MENDOZA', etc.
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de distribuidores
CREATE TABLE IF NOT EXISTS distributors (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES distributor_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL, -- Localidad/Ciudad
  phone TEXT,
  google_maps_url TEXT,
  email TEXT,
  website TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true, -- Para deshabilitar sin eliminar
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_distributors_zone_id ON distributors(zone_id);
CREATE INDEX IF NOT EXISTS idx_distributors_active ON distributors(active);
CREATE INDEX IF NOT EXISTS idx_distributors_locality ON distributors(locality);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_distributor_zones_updated_at 
  BEFORE UPDATE ON distributor_zones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributors_updated_at 
  BEFORE UPDATE ON distributors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS (Row Level Security) - Ajustar según tus políticas
ALTER TABLE distributor_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública (para el front público)
CREATE POLICY "Zonas son públicas para lectura"
  ON distributor_zones FOR SELECT
  USING (true);

CREATE POLICY "Distribuidores activos son públicos para lectura"
  ON distributors FOR SELECT
  USING (active = true);

-- Política: Solo autenticados pueden modificar (ajustar según roles)
CREATE POLICY "Solo autenticados pueden crear zonas"
  ON distributor_zones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden actualizar zonas"
  ON distributor_zones FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden eliminar zonas"
  ON distributor_zones FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden crear distribuidores"
  ON distributors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden actualizar distribuidores"
  ON distributors FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden eliminar distribuidores"
  ON distributors FOR DELETE
  USING (auth.role() = 'authenticated');

-- 6. Datos iniciales de zonas
INSERT INTO distributor_zones (name, display_order) VALUES
  ('GBA OESTE', 1),
  ('GBA SUR', 2),
  ('MENDOZA', 3),
  ('NEUQUEN', 4)
ON CONFLICT (name) DO NOTHING;

-- 7. Comentarios en las tablas
COMMENT ON TABLE distributor_zones IS 'Zonas geográficas de distribución (GBA OESTE, GBA SUR, etc.)';
COMMENT ON TABLE distributors IS 'Distribuidores autorizados por zona geográfica';
COMMENT ON COLUMN distributors.active IS 'Permite deshabilitar sin eliminar físicamente';
COMMENT ON COLUMN distributors.google_maps_url IS 'URL directa a Google Maps con la ubicación';
