/**
 * generate-product-embeddings.ts
 * 
 * Script para generar embeddings de todos los productos
 * y guardarlos en la tabla product_embeddings
 * 
 * Uso:
 * npx tsx src/script/generate-product-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import {
  generateEmbedding,
  generateProductContent,
  generateVariantContent,
  generateConfigurationContent,
} from '../lib/embeddings'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Falta OPENAI_API_KEY en .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function main() {
  console.log('🚀 Generando embeddings de productos...\n')

  // Obtener todos los productos con relaciones
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      product_finishes(finish:finishes(*)),
      product_variants(
        *,
        variant_light_tones(light_tone:light_tones(*)),
        variant_configurations(*)
      )
    `)

  if (productsError) {
    console.error('❌ Error obteniendo productos:', productsError)
    process.exit(1)
  }

  if (!products || products.length === 0) {
    console.log('⚠️  No hay productos en la base de datos')
    return
  }

  console.log(`📦 Encontrados ${products.length} productos\n`)

  let totalEmbeddings = 0
  let errors = 0

  for (const product of products) {
    try {
      console.log(`\n📍 Procesando: ${product.name} (${product.code})`)

      // 1. Embedding del producto principal
      const productContent = generateProductContent(product)
      console.log(`   📝 Generando embedding del producto...`)
      const productEmbedding = await generateEmbedding(productContent)

      const { error: productError } = await supabase
        .from('product_embeddings')
        .upsert({
          product_id: product.id,
          variant_id: null,
          configuration_id: null,
          content: productContent,
          embedding: JSON.stringify(productEmbedding),
        })

      if (productError) throw productError
      totalEmbeddings++
      console.log(`   ✅ Embedding del producto guardado`)

      // 2. Embeddings de variantes
      if (product.product_variants && product.product_variants.length > 0) {
        console.log(`   📦 Procesando ${product.product_variants.length} variantes...`)

        for (const variant of product.product_variants) {
          // Embedding de la variante
          const variantContent = generateVariantContent(product, variant)
          const variantEmbedding = await generateEmbedding(variantContent)

          const { error: variantError } = await supabase
            .from('product_embeddings')
            .upsert({
              product_id: product.id,
              variant_id: variant.id,
              configuration_id: null,
              content: variantContent,
              embedding: JSON.stringify(variantEmbedding),
            })

          if (variantError) throw variantError
          totalEmbeddings++
          console.log(`      ✅ Variante: ${variant.name}`)

          // 3. Embeddings de configuraciones
          if (variant.variant_configurations && variant.variant_configurations.length > 0) {
            for (const config of variant.variant_configurations) {
              const configContent = generateConfigurationContent(product, variant, config)
              const configEmbedding = await generateEmbedding(configContent)

              const { error: configError } = await supabase
                .from('product_embeddings')
                .upsert({
                  product_id: product.id,
                  variant_id: variant.id,
                  configuration_id: config.id,
                  content: configContent,
                  embedding: JSON.stringify(configEmbedding),
                })

              if (configError) throw configError
              totalEmbeddings++
              console.log(`         ✅ Config: ${config.watt}W - ${config.lumens}lm`)
            }
          }
        }
      }

      // Pequeña pausa para no saturar la API de OpenAI
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (err: any) {
      console.error(`   ❌ Error procesando ${product.name}:`, err.message)
      errors++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Proceso completado')
  console.log(`   Total embeddings generados: ${totalEmbeddings}`)
  console.log(`   Productos procesados: ${products.length}`)
  console.log(`   Errores: ${errors}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
