import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

// Create export directory
const exportDir = './supabase-export';
mkdirSync(exportDir, { recursive: true });

console.log('🚀 Iniciando exportación completa de Supabase...\n');

// List of all tables to export
const tables = [
  'categories',
  'variants',
  'light_tones',
  'finishes',
  'products',
  'led_profiles',
  'led_diffusers',
  'led_rolls',
  'led_roll_light_tones',
  'accessories',
  'user_profiles',
];

async function exportTableData(tableName) {
  console.log(`📦 Exportando ${tableName}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      return null;
    }
    
    console.log(`  ✅ ${data.length} registros exportados`);
    
    // Save as JSON
    writeFileSync(
      `${exportDir}/${tableName}.json`,
      JSON.stringify(data, null, 2)
    );
    
    // Generate INSERT SQL
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      const insertStatements = data.map(row => {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        }).join(', ');
        
        return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
      }).join('\n');
      
      writeFileSync(
        `${exportDir}/${tableName}.sql`,
        insertStatements
      );
    }
    
    return data;
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return null;
  }
}

async function generateSchema() {
  console.log('\n📋 Generando schema completo...\n');
  
  // We need to reconstruct schema from the types
  const schemaSQL = `
-- =============================================
-- SCHEMA COMPLETO - Exportado automáticamente
-- =============================================
-- Generado: ${new Date().toISOString()}
-- Proyecto: ${envConfig.NEXT_PUBLIC_SUPABASE_URL}
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variants
CREATE TABLE IF NOT EXISTS variants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Light Tones
CREATE TABLE IF NOT EXISTS light_tones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color_code TEXT,
  kelvin_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finishes
CREATE TABLE IF NOT EXISTS finishes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
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

-- LED Diffusers
CREATE TABLE IF NOT EXISTS led_diffusers (
  id SERIAL PRIMARY KEY,
  light_tone_id INTEGER REFERENCES light_tones(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(light_tone_id, material)
);

-- LED Profiles
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

-- LED Rolls
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

-- LED Roll Light Tones (Junction Table)
CREATE TABLE IF NOT EXISTS led_roll_light_tones (
  id SERIAL PRIMARY KEY,
  led_roll_id INTEGER NOT NULL REFERENCES led_rolls(id) ON DELETE CASCADE,
  light_tone_id INTEGER NOT NULL REFERENCES light_tones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(led_roll_id, light_tone_id)
);

-- Accessories
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

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distributor Zones
CREATE TABLE IF NOT EXISTS distributor_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distributors
CREATE TABLE IF NOT EXISTS distributors (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES distributor_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  phone TEXT,
  google_maps_url TEXT,
  email TEXT,
  website TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_id ON products(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_light_tone_id ON products(light_tone_id);
CREATE INDEX IF NOT EXISTS idx_products_finish_id ON products(finish_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_led_profiles_diffuser_id ON led_profiles(diffuser_id);
CREATE INDEX IF NOT EXISTS idx_led_profiles_featured ON led_profiles(featured);
CREATE INDEX IF NOT EXISTS idx_led_rolls_featured ON led_rolls(featured);
CREATE INDEX IF NOT EXISTS idx_accessories_featured ON accessories(featured);
CREATE INDEX IF NOT EXISTS idx_distributors_zone_id ON distributors(zone_id);
CREATE INDEX IF NOT EXISTS idx_distributors_active ON distributors(active);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_light_tones_updated_at BEFORE UPDATE ON light_tones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finishes_updated_at BEFORE UPDATE ON finishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_led_profiles_updated_at BEFORE UPDATE ON led_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_led_rolls_updated_at BEFORE UPDATE ON led_rolls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accessories_updated_at BEFORE UPDATE ON accessories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributor_zones_updated_at BEFORE UPDATE ON distributor_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

  writeFileSync(`${exportDir}/00-schema.sql`, schemaSQL);
  console.log('  ✅ Schema guardado en: supabase-export/00-schema.sql');
}

async function main() {
  // Generate schema first
  await generateSchema();
  
  console.log('\n📦 Exportando datos de todas las tablas...\n');
  
  // Export all tables
  for (const table of tables) {
    await exportTableData(table);
  }
  
  console.log('\n✅ Exportación completa!\n');
  console.log('📁 Archivos generados en: ./supabase-export/\n');
  console.log('📋 Próximos pasos:\n');
  console.log('1️⃣  Crear nuevo proyecto en https://supabase.com/dashboard');
  console.log('2️⃣  Ir al SQL Editor del nuevo proyecto');
  console.log('3️⃣  Ejecutar: supabase-export/00-schema.sql');
  console.log('4️⃣  Ejecutar cada archivo .sql de datos en orden');
  console.log('5️⃣  Actualizar .env.local con las nuevas keys\n');
  console.log('💡 O ejecutar: node import-to-new-project.mjs (próximo script)\n');
}

main().catch(console.error);
