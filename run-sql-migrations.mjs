import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeSqlFile(filePath, description) {
  console.log(`\n🚀 ${description}...`);
  const sql = readFileSync(filePath, 'utf-8');
  
  // Split by semicolon but keep transaction blocks together
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_sql').select('*').limit(0);
        
        // If it's a schema command, we need a different approach
        if (statement.toLowerCase().includes('create table') || 
            statement.toLowerCase().includes('create index') ||
            statement.toLowerCase().includes('create trigger') ||
            statement.toLowerCase().includes('create function')) {
          console.log('⚠️  Schema statement detected, trying alternative method...');
          // These need to be executed via Supabase Management API or SQL editor
          console.log(statement.substring(0, 80) + '...');
        } else {
          console.error('❌ Error:', error.message);
        }
      } else {
        console.log('✅ Statement executed');
      }
    } catch (err) {
      console.error('❌ Exception:', err.message);
    }
  }
}

(async () => {
  try {
    console.log('📦 Ejecutando migraciones de distribuidores\n');
    
    // Try to use supabase-js query builder instead
    console.log('🚀 Creando tablas directamente...\n');
    
    // Create zones table
    const createZonesSQL = `
      CREATE TABLE IF NOT EXISTS distributor_zones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Create distributors table  
    const createDistributorsSQL = `
      CREATE TABLE IF NOT EXISTS distributors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        zone_id UUID NOT NULL REFERENCES distributor_zones(id) ON DELETE RESTRICT,
        name VARCHAR(200) NOT NULL,
        address VARCHAR(300),
        locality VARCHAR(100),
        province VARCHAR(100),
        postal_code VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(150),
        contact_person VARCHAR(150),
        notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    console.log('Creating via pg_dump would be better. Using Supabase SQL Editor is recommended.\n');
    console.log('📋 Please execute the following files manually in Supabase SQL Editor:');
    console.log('   1. src/script/distributors-schema.sql');
    console.log('   2. src/script/distributors-seed-data.sql\n');
    console.log('🌐 Access: https://supabase.com/dashboard/project/quhuhsjgejrxsvenviyv/sql/new');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
