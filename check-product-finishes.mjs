import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProductFinishes() {
  // Verificar el producto SNK
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      code,
      name,
      product_finishes (
        finish_id,
        finish:finishes (
          id,
          name,
          slug
        )
      )
    `)
    .eq('code', 'SNK')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Producto:', product.name, '(', product.code, ')')
  console.log('ID:', product.id)
  console.log('\nFinishes asignados:', product.product_finishes)
  
  // Ver todos los finishes disponibles
  const { data: allFinishes } = await supabase
    .from('finishes')
    .select('*')
    .order('name')
  
  console.log('\n\nFinishes disponibles en total:')
  console.table(allFinishes)
}

checkProductFinishes()
