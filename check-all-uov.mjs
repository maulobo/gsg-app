import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUOV() {
  const { data, error } = await supabase
    .from('variant_configurations')
    .select(`
      id,
      sku,
      name,
      variant_id,
      watt,
      lumens
    `)
    .ilike('sku', 'UOV%')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Configuraciones con SKU que empieza con "UOV":`)
  console.table(data)
  
  // También mostrar la variante 54
  const { data: variant54 } = await supabase
    .from('variant_configurations')
    .select('*')
    .eq('variant_id', 54)
    
  console.log('\nConfiguraciones de la variante 54:')
  console.table(variant54)
}

checkUOV()
