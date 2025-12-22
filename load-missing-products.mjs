import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
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

// Mapeo de códigos del JSON a códigos reales de la DB
const CODE_MAPPING = {
  'SAT-CCT': 'SAT-CCT', // Este es nuevo, se mantiene
  'BATTI': 'BAT',       // Batti se mapea a BAT
  'QUADRA': 'QDR',
  'URANO': 'URA-C',
  'UOV': 'URA-OV',
  'HEXA': 'HEX',
  'PANAL': 'PAB',
  'SNAKE': 'SNK',
  'SNAKE FREE': 'SFR',
  'SATURNO XL': 'SXL'
}

// Productos específicos a cargar
const PRODUCTS_TO_LOAD = ['SAT-CCT', 'BATTI']

async function loadMissingProducts() {
  try {
    // 1. Leer el archivo JSON local
    const jsonPath = path.join(process.cwd(), 'src/lib/prod.json')
    const fileContent = fs.readFileSync(jsonPath, 'utf-8')
    const allProducts = JSON.parse(fileContent)

    // 2. Filtrar solo los productos que queremos cargar
    const productsToProcess = allProducts.filter(p => PRODUCTS_TO_LOAD.includes(p.product.code))

    console.log(`🚀 Iniciando carga de ${productsToProcess.length} productos...`)

    // 3. Obtener IDs de categorías, acabados y tonos de luz para referencias
    const { data: categories } = await supabase.from('categories').select('id, slug')
    const { data: finishes } = await supabase.from('finishes').select('id, slug')
    const { data: lightTones } = await supabase.from('light_tones').select('id, slug')

    if (!categories || !finishes || !lightTones) {
      throw new Error('Error cargando datos de referencia (categorías, acabados, tonos)')
    }

    // Mapa rápido para buscar IDs
    const getCategoryId = (slug) => categories.find(c => c.slug === slug)?.id
    const getFinishId = (slug) => finishes.find(f => f.slug === slug)?.id
    const getLightToneId = (slug) => lightTones.find(t => t.slug === slug)?.id

    for (const item of productsToProcess) {
      const { product, variants, addons } = item
      
      // Determinar el código final a usar
      const finalCode = CODE_MAPPING[product.code] || product.code
      console.log(`\n📦 Procesando: ${product.name} (${finalCode})`)

      // A. Crear Producto
      const categoryId = getCategoryId(product.category)
      if (!categoryId) {
        console.error(`❌ Categoría no encontrada: ${product.category}`)
        continue
      }

      const { data: newProduct, error: prodError } = await supabase
        .from('products')
        .upsert({
          code: finalCode,
          name: product.name,
          description: product.description,
          category_id: categoryId,
          is_featured: product.is_featured || false
        }, { onConflict: 'code' })
        .select()
        .single()

      if (prodError) {
        console.error(`❌ Error creando producto ${finalCode}:`, prodError.message)
        continue
      }
      console.log(`✅ Producto creado/actualizado: ${newProduct.name}`)

      // B. Asociar Acabados
      if (product.finishes && product.finishes.length > 0) {
        const finishLinks = product.finishes
          .map(slug => ({ product_id: newProduct.id, finish_id: getFinishId(slug) }))
          .filter(link => link.finish_id) // Filtrar nulos

        if (finishLinks.length > 0) {
          await supabase.from('product_finishes').upsert(finishLinks, { onConflict: 'product_id, finish_id' })
          console.log(`   🎨 ${finishLinks.length} acabados asociados`)
        }
      }

      // C. Crear Variantes
      for (const variant of variants) {
        const { data: newVariant, error: varError } = await supabase
          .from('product_variants')
          .upsert({
            product_id: newProduct.id,
            variant_code: variant.variant_code,
            name: variant.name,
            includes_led: variant.includes_led,
            includes_driver: variant.includes_driver || false,
            cantidad: 1
          }, { onConflict: 'variant_code' })
          .select()
          .single()

        if (varError) {
          console.error(`   ❌ Error creando variante ${variant.variant_code}:`, varError.message)
          continue
        }
        console.log(`   🔹 Variante creada: ${newVariant.name}`)

        // C.1 Asociar Tonos de Luz a la Variante
        if (variant.light_tones && variant.light_tones.length > 0) {
          const toneLinks = variant.light_tones
            .map(slug => ({ variant_id: newVariant.id, light_tone_id: getLightToneId(slug) }))
            .filter(link => link.light_tone_id)

          if (toneLinks.length > 0) {
            await supabase.from('variant_light_tones').upsert(toneLinks, { onConflict: 'variant_id, light_tone_id' })
          }
        }

        // C.2 Crear Configuraciones
        if (variant.configurations && variant.configurations.length > 0) {
          const configs = variant.configurations.map(c => ({
            variant_id: newVariant.id,
            sku: c.sku,
            watt: c.watt,
            lumens: c.lumens,
            voltage: c.voltage,
            diameter_description: c.diameter_description,
            specs: c.specs || {}
          }))

          const { error: configError } = await supabase
            .from('variant_configurations')
            .upsert(configs, { onConflict: 'sku' })

          if (configError) {
            console.error(`      ❌ Error en configuraciones:`, configError.message)
          } else {
            console.log(`      ⚙️ ${configs.length} configuraciones cargadas`)
          }
        }
      }

      // D. Crear Addons
      if (addons && addons.length > 0) {
        const addonsData = addons.map(addon => ({
          product_id: newProduct.id,
          code: addon.code,
          name: addon.name,
          description: addon.description,
          category: addon.category,
          specs: addon.specs || {},
          is_active: true
        }))

        const { error: addonError } = await supabase
          .from('product_addons')
          .upsert(addonsData, { onConflict: 'code' })

        if (addonError) {
          console.error(`   ❌ Error creando addons:`, addonError.message)
        } else {
          console.log(`   🔌 ${addonsData.length} addons creados`)
        }
      }
    }

    console.log('\n✨ Carga completada exitosamente')

  } catch (error) {
    console.error('Error fatal:', error)
  }
}

loadMissingProducts()
