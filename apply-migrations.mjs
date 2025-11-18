import pg from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment
const envConfig = dotenv.parse(readFileSync('.env.local'));

// Extract project ref from URL
const projectRef = envConfig.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];

// Build connection string for direct DB connection
// Try multiple connection formats
const connectionConfigs = [
  {
    name: 'Direct Connection (IPv6)',
    connectionString: `postgresql://postgres:Alal1010!!@db.${projectRef}.supabase.co:5432/postgres`,
  },
  {
    name: 'Pooler Connection',
    connectionString: `postgresql://postgres.${projectRef}:Alal1010!!@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  },
  {
    name: 'Alternative Pooler',
    connectionString: `postgresql://postgres.${projectRef}:Alal1010!!@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  }
];

async function tryConnection(config) {
  const client = new Client({ connectionString: config.connectionString });
  
  try {
    console.log(`\n🔌 Trying: ${config.name}...`);
    await client.connect();
    console.log('✅ Connected!');
    return client;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function executeSqlFile(client, filePath, description) {
  console.log(`\n🚀 ${description}...`);
  const sql = readFileSync(filePath, 'utf-8');
  
  try {
    await client.query(sql);
    console.log('✅ Success!');
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

(async () => {
  let client = null;
  
  // Try each connection config
  for (const config of connectionConfigs) {
    client = await tryConnection(config);
    if (client) break;
  }
  
  if (!client) {
    console.log('\n❌ No se pudo conectar a la base de datos.');
    console.log('\n📋 Por favor ejecuta los SQL manualmente en:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\nArchivos:');
    console.log('   1. src/script/distributors-schema.sql');
    console.log('   2. src/script/distributors-seed-data.sql');
    process.exit(1);
  }
  
  try {
    // Execute schema
    const schemaSuccess = await executeSqlFile(
      client,
      'src/script/distributors-schema.sql',
      'Aplicando schema de distribuidores'
    );
    
    if (!schemaSuccess) {
      throw new Error('Error aplicando schema');
    }
    
    // Execute seed data
    const seedSuccess = await executeSqlFile(
      client,
      'src/script/distributors-seed-data.sql',
      'Insertando datos iniciales'
    );
    
    if (!seedSuccess) {
      throw new Error('Error insertando datos');
    }
    
    console.log('\n🎉 Migraciones completadas exitosamente!');
    
    // Verify
    const result = await client.query('SELECT COUNT(*) FROM distributors');
    console.log(`\n✅ Distribuidores creados: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
