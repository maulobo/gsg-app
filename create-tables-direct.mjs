import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  }
);

console.log('🚀 Creando tablas de distribuidores directamente...\n');

async function executeRawSQL(sql, description) {
  console.log(`📋 ${description}...`);
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;
    
    try {
      // Use Supabase's from() method with raw SQL workaround
      // We'll execute each statement using a custom approach
      const { data, error } = await supabase.rpc('exec', { 
        query: statement + ';' 
      });
      
      if (error) {
        console.log(`  ⚠️  Statement ${i + 1}: ${error.message}`);
      } else {
        console.log(`  ✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.log(`  ❌ Statement ${i + 1}: ${err.message}`);
    }
  }
}

// Since we can't execute raw SQL, let's use the Supabase client directly
// to create tables by inserting into pg_catalog (won't work due to permissions)

// ALTERNATIVE: Create a SQL file that user can copy-paste
console.log('⚠️  No es posible ejecutar SQL directamente sin acceso al dashboard.\n');
console.log('📋 SOLUCIÓN: Recuperar acceso al dashboard\n');

console.log('Probá estos pasos:\n');
console.log('1️⃣  Ir a: https://supabase.com/dashboard');
console.log('2️⃣  Hacer "Sign out" si estás logueado');
console.log('3️⃣  Hacer "Forgot password" con estos emails:\n');
console.log('    ✉️  scstudio.cloud@gmail.com');
console.log('    ✉️  maurolobo.ml@gmail.com');
console.log('    ✉️  Cualquier otro email que hayas usado\n');
console.log('4️⃣  Revisar el inbox y spam de ambos emails\n');

console.log('\n💡 ALTERNATIVA: Ejecutar en el SQL Editor\n');
console.log('Si recuperás acceso al dashboard con CUALQUIER email:');
console.log('   https://supabase.com/dashboard/project/quhuhsjgejrxsvenviyv/sql/new\n');
console.log('Y ejecutar:');
console.log('   📄 src/script/distributors-schema.sql');
console.log('   📄 src/script/distributors-seed-data.sql\n');

// Try to find who has access by checking existing tables
console.log('\n🔍 Verificando tablas existentes (para confirmar que el proyecto funciona)...\n');

const testQueries = [
  { name: 'Products', table: 'products' },
  { name: 'LED Profiles', table: 'led_profiles' },
  { name: 'LED Rolls', table: 'led_rolls' },
  { name: 'Accessories', table: 'accessories' },
];

for (const query of testQueries) {
  try {
    const { count, error } = await supabase
      .from(query.table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${query.name}: ${error.message}`);
    } else {
      console.log(`✅ ${query.name}: ${count} registros`);
    }
  } catch (err) {
    console.log(`❌ ${query.name}: ${err.message}`);
  }
}

console.log('\n✅ El proyecto está activo y funcionando.');
console.log('⚠️  Solo necesitás recuperar acceso al dashboard para ejecutar los SQLs.\n');
