import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));

const oldSupabase = createClient(
  'https://quhuhsjgejrxsvenviyv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aHVoc2pnZWpyeHN2ZW52aXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc1Mjc0MSwiZXhwIjoyMDc1MzI4NzQxfQ.CMjxXXMNgM7bG16iiBA93H1rtFcGmJS0noD2fH45xdc'
);

const newSupabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

const allTables = [
  // Primero las básicas sin FK
  'categories',
  'finishes',
  'light_tones',
  'led_diffusers',
  'accessories',
  'led_profiles',
  'led_rolls',
  'products',
  
  // Luego las que dependen de las anteriores
  'product_variants',
  'led_roll_models',
  'featured_items',
  
  // Junction tables y relaciones
  'product_finishes',
  'variant_light_tones',
  'variant_configurations',
  'accessory_finishes',
  'accessory_light_tones',
  'accessory_media',
  'led_profile_diffusers',
  'led_profile_finishes',
  'led_profile_included_items',
  'led_profile_optional_items',
  'led_profile_parts',
  'led_profile_media',
  'led_roll_media',
  'media_assets',
  'search_logs',
  'user_profiles',
];

async function migrateTable(tableName) {
  try {
    console.log(`\n📦 ${tableName}...`);
    
    const { data, error } = await oldSupabase.from(tableName).select('*');
    
    if (error) {
      console.log(`  ⏭️  No existe o sin acceso`);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`  ⏭️  Sin datos`);
      return;
    }
    
    console.log(`  📊 ${data.length} registros encontrados`);
    
    // Guardar backup
    writeFileSync(
      `./supabase-export/${tableName}.json`,
      JSON.stringify(data, null, 2)
    );
    
    // Importar
    const { error: insertError } = await newSupabase
      .from(tableName)
      .upsert(data, { onConflict: 'id' });
    
    if (insertError) {
      console.log(`  ❌ Error: ${insertError.message}`);
    } else {
      console.log(`  ✅ Migrado exitosamente`);
    }
    
  } catch (err) {
    console.log(`  ⚠️  ${err.message}`);
  }
}

(async () => {
  console.log('🚀 Iniciando migración completa de TODAS las tablas...\n');
  console.log('=' .repeat(60));
  
  for (const table of allTables) {
    await migrateTable(table);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Migración completa finalizada!');
  console.log('\n📁 Backups guardados en: ./supabase-export/\n');
})();
