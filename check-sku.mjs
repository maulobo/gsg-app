import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSKU() {
  const sku = 'UOV-S01-XXX-XX'
  
  const { data, error } = await supabase
    .from('variant_configurations')
    .select(`
      id,
      sku,
      name,
      variant_id,
      variant:product_variants(
        id,
        name,
        variant_code,
        product:products(code, name)
      )
    `)
    .eq('sku', sku)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Configuraciones con SKU "${sku}":`)
  console.log(JSON.stringify(data, null, 2))
}

checkSKU()
