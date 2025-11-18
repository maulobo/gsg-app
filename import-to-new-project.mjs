import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { readdir } from 'fs/promises';

console.log('🚀 Script de Importación a Nuevo Proyecto Supabase\n');
console.log('📋 PASO 1: Crear nuevo proyecto\n');
console.log('   1. Ir a: https://supabase.com/dashboard');
console.log('   2. Click en "New project"');
console.log('   3. Nombre sugerido: "gsg-dash-v2"');
console.log('   4. Password de DB: Alal1010!! (o la que prefieras)');
console.log('   5. Región: South America (São Paulo) o US East\n');

console.log('📋 PASO 2: Obtener las credenciales\n');
console.log('   1. En el nuevo proyecto, ir a Settings > API');
console.log('   2. Copiar:');
console.log('      - Project URL');
console.log('      - anon/public key');
console.log('      - service_role key\n');

const readline = await import('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('📝 Ingresá las credenciales del NUEVO proyecto:\n');

const newUrl = await question('Project URL (https://xxx.supabase.co): ');
const newAnonKey = await question('Anon Key: ');
const newServiceKey = await question('Service Role Key: ');

rl.close();

console.log('\n✅ Conectando al nuevo proyecto...\n');

const supabase = createClient(newUrl.trim(), newServiceKey.trim(), {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test connection
try {
  const { error } = await supabase.from('_test').select('*').limit(0);
  console.log('✅ Conexión establecida\n');
} catch (err) {
  console.log('⚠️  Conexión lista (tabla test no existe aún)\n');
}

console.log('📋 PASO 3: Ejecutar Schema en SQL Editor\n');
console.log('   1. Ir a: ' + newUrl.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '/sql/new'));
console.log('   2. Copiar y pegar el contenido de: supabase-export/00-schema.sql');
console.log('   3. Click en "Run"\n');

const proceed = await new Promise((resolve) => {
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl2.question('¿Ya ejecutaste el schema? (y/n): ', (answer) => {
    rl2.close();
    resolve(answer.toLowerCase() === 'y');
  });
});

if (!proceed) {
  console.log('\n⚠️  Ejecutá el schema primero y luego volvé a correr este script.');
  process.exit(0);
}

console.log('\n📦 Importando datos...\n');

// Import order (respecting foreign keys)
const importOrder = [
  'categories',
  'light_tones', 
  'finishes',
  'led_diffusers',
  'products',
  'led_profiles',
  'led_rolls',
  'accessories',
  'user_profiles',
];

for (const table of importOrder) {
  try {
    const jsonPath = `./supabase-export/${table}.json`;
    const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    if (data.length === 0) {
      console.log(`⏭️  ${table}: sin datos`);
      continue;
    }
    
    console.log(`📦 Importando ${table} (${data.length} registros)...`);
    
    const { error } = await supabase.from(table).insert(data);
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Importado exitosamente`);
    }
  } catch (err) {
    console.log(`  ⚠️  ${err.message}`);
  }
}

console.log('\n✅ Importación completa!\n');
console.log('📋 PASO 4: Actualizar .env.local\n');
console.log('Reemplazá las siguientes variables:\n');
console.log(`NEXT_PUBLIC_SUPABASE_URL=${newUrl}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${newAnonKey}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${newServiceKey}\n`);
console.log('📋 PASO 5: Ejecutar distribuidores\n');
console.log('Ahora sí podés ejecutar en el nuevo SQL Editor:');
console.log('   - src/script/distributors-schema.sql');
console.log('   - src/script/distributors-seed-data.sql\n');
console.log('🎉 ¡Todo listo! Reiniciá el dev server: pnpm dev\n');

process.exit(0);
