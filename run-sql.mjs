import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node run-sql.mjs <path-to-sql-file>');
  process.exit(1);
}

const sql = readFileSync(sqlFile, 'utf-8');

// Split by semicolon and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s !== '');

console.log(`📝 Ejecutando ${statements.length} statements desde ${sqlFile}...\n`);

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  console.log(`[${i+1}/${statements.length}] Ejecutando...`);
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
  
  if (error) {
    console.error(`❌ Error en statement ${i+1}:`, error.message);
    console.error('Statement:', statement.substring(0, 100) + '...');
  } else {
    console.log(`✅ OK`);
  }
}

console.log('\n✨ Proceso completado');
