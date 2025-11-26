import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProducts() {
  // Ver los últimos productos creados
  const { data: products, error } = await supabase
    .from('products')
    .select('id, code, name')
    .order('id', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Últimos 10 productos:')
  console.table(products)

  // Ver el máximo ID
  const maxId = products && products.length > 0 ? products[0].id : 0
  console.log('\nMáximo ID en la tabla:', maxId)

  // Verificar la secuencia
  const { data: seqData, error: seqError } = await supabase.rpc('check_sequence', {})
  
  if (!seqError && seqData) {
    console.log('Valor actual de la secuencia:', seqData)
  }
}

checkProducts()
