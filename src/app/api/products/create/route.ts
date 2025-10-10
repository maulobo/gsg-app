import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type VariantData = {
  variant_code: string
  name: string
  includes_led: boolean
  includes_driver: boolean
  light_tone_ids: number[]
  configurations: {
    sku: string
    watt: number
    lumens: number
    voltage?: number
    diameter_description?: string
    length_mm?: number
    width_mm?: number
    specs?: Record<string, any>
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product, variants } = body

    const supabase = await createServerSupabaseClient()

    // 1. Create product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        code: product.code,
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        is_featured: product.is_featured,
      })
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // 2. Create product_finishes relationships (if any)
    if (product.finish_ids && product.finish_ids.length > 0) {
      const finishInserts = product.finish_ids.map((finish_id: number) => ({
        product_id: newProduct.id,
        finish_id,
      }))

      const { error: finishError } = await supabase
        .from('product_finishes')
        .insert(finishInserts)

      if (finishError) {
        console.error('Error creating product finishes:', finishError)
        // Don't fail, just log
      }
    }

    // 3. Create variants with all their relations
    const createdVariants = []
    
    for (const variant of variants as VariantData[]) {
      // 3.1 Create variant
      const { data: newVariant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: newProduct.id,
          variant_code: variant.variant_code,
          name: variant.name,
          includes_led: variant.includes_led,
          includes_driver: variant.includes_driver,
        })
        .select()
        .single()

      if (variantError) {
        console.error('Error creating variant:', variantError)
        continue
      }

      // Store created variant for response
      createdVariants.push(newVariant)

      // 3.2 Create variant_light_tones relationships
      if (variant.light_tone_ids && variant.light_tone_ids.length > 0) {
        const toneInserts = variant.light_tone_ids.map((light_tone_id: number) => ({
          variant_id: newVariant.id,
          light_tone_id,
        }))

        const { error: toneError } = await supabase
          .from('variant_light_tones')
          .insert(toneInserts)

        if (toneError) {
          console.error('Error creating variant light tones:', toneError)
        }
      }

      // 3.3 Create configurations for this variant
      if (variant.configurations && variant.configurations.length > 0) {
        const configInserts = variant.configurations.map((config) => ({
          variant_id: newVariant.id,
          sku: config.sku,
          watt: config.watt,
          lumens: config.lumens,
          voltage: config.voltage,
          diameter_description: config.diameter_description,
          length_mm: config.length_mm,
          width_mm: config.width_mm,
          specs: config.specs || {},
        }))

        const { error: configError } = await supabase
          .from('variant_configurations')
          .insert(configInserts)

        if (configError) {
          console.error('Error creating configurations:', configError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      product: newProduct,
      variants: createdVariants,
    })
  } catch (error) {
    console.error('Error in product creation:', error)
    return NextResponse.json(
      { error: 'Error al crear el producto' },
      { status: 500 }
    )
  }
}
