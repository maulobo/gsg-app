import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));

// Conectar al VIEJO proyecto para extraer tablas faltantes
const oldSupabase = createClient(
  'https://quhuhsjgejrxsvenviyv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aHVoc2pnZWpyeHN2ZW52aXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc1Mjc0MSwiZXhwIjoyMDc1MzI4NzQxfQ.J-pEEjA9dWDlSsb5ULSAMcbT3T_yJ4kDZ__Mf6TYDxQ'
);

// Conectar al NUEVO proyecto
const newSupabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

const missingTables = [
  'variants',
  'led_roll_light_tones', 
  'featured_items',
  'search_logs'
];

(async () => {
  console.log('🔍 Buscando tablas faltantes en proyecto viejo...\n');
  
  for (const table of missingTables) {
    try {
      const { data, error } = await oldSupabase.from(table).select('*');
      
      if (error) {
        console.log(`⏭️  ${table}: no existe (${error.message})`);
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log(`⏭️  ${table}: sin datos`);
        continue;
      }
      
      console.log(`📦 ${table}: ${data.length} registros encontrados`);
      
      // Guardar JSON
      writeFileSync(
        `./supabase-export/${table}.json`,
        JSON.stringify(data, null, 2)
      );
      
      // Importar al nuevo proyecto
      const { error: insertError } = await newSupabase.from(table).insert(data);
      
      if (insertError) {
        console.log(`  ❌ Error importando: ${insertError.message}`);
      } else {
        console.log(`  ✅ Importado exitosamente`);
      }
      
    } catch (err) {
      console.log(`  ⚠️  ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✅ Proceso completado');
})();
