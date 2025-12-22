import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('code, name')
      .order('code')

    if (error) {
      console.error('Error fetching products:', error)
      return
    }

    console.log('📋 Productos en la Base de Datos:')
    console.log('--------------------------------')
    products.forEach(p => {
      console.log(`Code: "${p.code}" | Name: "${p.name}"`)
    })
    console.log('--------------------------------')
    console.log(`Total: ${products.length}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

listProducts()
