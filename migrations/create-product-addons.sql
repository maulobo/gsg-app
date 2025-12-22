-- Migración: Tabla de addons/complementos específicos por producto
-- Estos son accesorios que solo aplican a productos específicos (dimmers, tensores, etc.)

CREATE TABLE IF NOT EXISTS product_addons (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Identificación
  code TEXT NOT NULL UNIQUE, -- ej: "SAT-DIM-LLA", "QDR-EXT-TEN"
  name TEXT NOT NULL, -- ej: "Dimmer Llavero", "Tensor Extra"
  description TEXT,
  
  -- Categorización
  category TEXT NOT NULL, -- "control", "installation", "accessory"
  
  -- Especificaciones (JSON flexible)
  specs JSONB DEFAULT '{}', -- { "alcance": "10 m", "tipo": "rf", "app": "SmartLife", etc. }
  
  -- Comercial
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  
  -- Display
  display_order INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX idx_product_addons_code ON product_addons(code);
CREATE INDEX idx_product_addons_category ON product_addons(category);
CREATE INDEX idx_product_addons_active ON product_addons(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_product_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_addons_updated_at
  BEFORE UPDATE ON product_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_product_addons_updated_at();

-- RLS Policies
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública (solo addons activos)
CREATE POLICY "product_addons_select_public"
  ON product_addons
  FOR SELECT
  USING (is_active = true);

-- Política: Service role puede insertar
CREATE POLICY "product_addons_insert_service_role"
  ON product_addons
  FOR INSERT
  WITH CHECK (true);

-- Política: Service role puede actualizar
CREATE POLICY "product_addons_update_service_role"
  ON product_addons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Service role puede eliminar
CREATE POLICY "product_addons_delete_service_role"
  ON product_addons
  FOR DELETE
  USING (true);

-- Comentarios
COMMENT ON TABLE product_addons IS 'Accesorios/complementos específicos de cada producto (dimmers, tensores, etc.)';
COMMENT ON COLUMN product_addons.specs IS 'Especificaciones técnicas en formato JSON flexible';
COMMENT ON COLUMN product_addons.category IS 'Categoría: control, installation, accessory';
