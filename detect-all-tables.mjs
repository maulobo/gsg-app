import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Detectando TODAS las tablas del schema actual...\n');

// Query to get all tables
const getAllTables = async () => {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');
  
  if (error) {
    // Try alternative method using RPC or direct query
    console.log('Intentando método alternativo...\n');
    
    // List of potential tables based on your codebase
    const potentialTables = [
      'categories',
      'variants', 
      'light_tones',
      'finishes',
      'products',
      'led_diffusers',
      'led_profiles',
      'led_rolls',
      'led_roll_light_tones',
      'led_roll_models',
      'led_profile_models',
      'accessories',
      'user_profiles',
      'distributor_zones',
      'distributors',
      'featured_items',
      'videos',
      'search_logs',
      'media_uploads',
      'storage.buckets',
    ];
    
    console.log('Verificando tablas existentes:\n');
    const existingTables = [];
    
    for (const table of potentialTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push(table);
          console.log(`✅ ${table}`);
        }
      } catch (err) {
        // Table doesn't exist
      }
    }
    
    console.log(`\n📊 Total de tablas encontradas: ${existingTables.length}\n`);
    console.log('Tablas:', existingTables.join(', '));
    
    return existingTables;
  }
  
  return data.map(t => t.table_name);
};

getAllTables().catch(console.error);
