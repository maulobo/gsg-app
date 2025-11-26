import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkVariantCode() {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, name, variant_code')
    .eq('id', 13)
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Variante ID 13:')
  console.log(`  Nombre: ${data.name}`)
  console.log(`  Código: ${data.variant_code}`)
}

checkVariantCode()
