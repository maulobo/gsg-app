import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars if available (for local testing)
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ping() {
  console.log('Pinging Supabase to prevent pause...');
  
  // Simple query to wake up the database
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error pinging database:', error);
    process.exit(1);
  }

  console.log('Ping successful. Database is active.');
}

ping();
