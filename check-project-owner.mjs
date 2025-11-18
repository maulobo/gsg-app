import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(readFileSync('.env.local'));

const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando información del proyecto Supabase...\n');

// Extract project ref
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];
console.log(`📦 Project Reference: ${projectRef}`);
console.log(`🌐 URL: ${SUPABASE_URL}\n`);

// Try to get project settings via Management API
async function checkProjectInfo() {
  console.log('🔑 Intentando obtener información con Service Role Key...\n');
  
  // Try to query auth.users to see if we can get owner info
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_auth`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // Try Supabase Management API
  console.log('\n🔐 Intentando Management API...\n');
  
  const managementEndpoints = [
    `https://api.supabase.com/v1/projects/${projectRef}`,
    `https://api.supabase.com/v1/projects/${projectRef}/settings`,
  ];
  
  for (const endpoint of managementEndpoints) {
    try {
      console.log(`Trying: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
        }
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('  Data:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log(`  Error: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`  Exception: ${error.message}`);
    }
    console.log();
  }
  
  // Try to decode JWT to get project info
  console.log('🔓 Decodificando JWT del Service Role Key...\n');
  
  try {
    const parts = SERVICE_KEY.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('JWT Payload:');
      console.log(JSON.stringify(payload, null, 2));
      
      if (payload.iss) {
        console.log(`\n✅ Issuer (probablemente la URL del proyecto): ${payload.iss}`);
      }
      if (payload.ref) {
        console.log(`✅ Project Ref: ${payload.ref}`);
      }
      if (payload.role) {
        console.log(`✅ Role: ${payload.role}`);
      }
    }
  } catch (error) {
    console.log('Error decodificando JWT:', error.message);
  }
  
  // Check if we can query any system tables
  console.log('\n\n📊 Intentando consultar tablas del sistema...\n');
  
  const queries = [
    { name: 'Auth Users Count', table: 'auth.users', select: 'count' },
    { name: 'Storage Buckets', table: 'storage.buckets', select: '*' },
    { name: 'Public Schema Tables', table: 'information_schema.tables', select: 'table_name', filter: 'table_schema=eq.public' },
  ];
  
  for (const query of queries) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${query.table}?select=${query.select}`;
      if (query.filter) url += `&${query.filter}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        }
      });
      
      console.log(`${query.name}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Data:`, data);
      } else {
        const text = await response.text();
        console.log(`  ❌ Error: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
    console.log();
  }
}

checkProjectInfo().catch(console.error);
