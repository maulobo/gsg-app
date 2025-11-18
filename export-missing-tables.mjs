import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Exportando schema de tablas faltantes...\n');

const missingTables = [
  'led_roll_models',
  'led_profile_models', 
  'featured_items',
  'videos',
  'search_logs',
  'media_uploads',
];

for (const table of missingTables) {
  console.log(`📦 Exportando ${table}...`);
  
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      continue;
    }
    
    console.log(`  ✅ ${data.length} registros (muestra)`);
    
    if (data.length > 0) {
      // Show structure
      console.log(`  📋 Columnas:`, Object.keys(data[0]).join(', '));
      
      // Export full data
      const { data: fullData } = await supabase.from(table).select('*');
      writeFileSync(
        `./supabase-export/${table}.json`,
        JSON.stringify(fullData, null, 2)
      );
      console.log(`  💾 Guardado: supabase-export/${table}.json`);
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
  }
  console.log();
}
