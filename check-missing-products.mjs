import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role para asegurar acceso total

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMissingProducts() {
  try {
    // 1. Leer el archivo JSON local
    const jsonPath = path.join(process.cwd(), 'src/lib/prod.json')
    const fileContent = fs.readFileSync(jsonPath, 'utf-8')
    const localProductsData = JSON.parse(fileContent)

    // Extraer códigos y nombres del JSON
    const localProducts = localProductsData.map(item => ({
      code: item.product.code,
      name: item.product.name
    }))

    console.log(`📦 Productos encontrados en prod.json: ${localProducts.length}`)

    // 2. Obtener productos existentes en Supabase
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('code, name')

    if (error) {
      throw new Error(`Error consultando Supabase: ${error.message}`)
    }

    console.log(`🗄️  Productos existentes en Supabase: ${dbProducts.length}`)

    // Crear un Set de códigos existentes para búsqueda rápida
    const existingCodes = new Set(dbProducts.map(p => p.code))

    // 3. Comparar y encontrar faltantes
    const missingProducts = localProducts.filter(p => !existingCodes.has(p.code))

    // 4. Reportar resultados
    console.log('\n---------------------------------------------------')
    console.log('🔍 REPORTE DE PRODUCTOS FALTANTES')
    console.log('---------------------------------------------------')

    if (missingProducts.length === 0) {
      console.log('✅ ¡Todo al día! Todos los productos del JSON ya están en la base de datos.')
    } else {
      console.log(`⚠️  Se encontraron ${missingProducts.length} productos que NO están en la base de datos:\n`)
      missingProducts.forEach(p => {
        console.log(`❌ [${p.code}] ${p.name}`)
      })
    }
    console.log('---------------------------------------------------\n')

  } catch (error) {
    console.error('Error ejecutando el script:', error)
  }
}

checkMissingProducts()
