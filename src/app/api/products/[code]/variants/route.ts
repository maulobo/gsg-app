import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type RouteParams = {
  code: string
}

/**
 * POST /api/products/[code]/variants
 * Crea una nueva variante para el producto
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { code } = await context.params
    const supabase = await createServerSupabaseClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, name, variant_code, includes_led, includes_driver, light_tone_ids, configurations } = body

    console.log('[Variant Create] Creando variante:', {
      code,
      product_id,
      name,
      variant_code,
      includes_led,
      includes_driver,
      light_tone_ids,
      configurationsCount: configurations?.length || 0,
    })

    // 1. Verificar que el producto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('code', code)
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      console.error('[Variant Create] Producto no encontrado:', productError)
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // 2. Crear la variante
    const { data: variant, error: createError } = await supabase
      .from('product_variants')
      .insert({
        product_id,
        name,
        variant_code,
        includes_led: includes_led || false,
        includes_driver: includes_driver || false,
      })
      .select()
      .single()

    if (createError || !variant) {
      console.error('[Variant Create] Error al crear variante:', createError)
      return NextResponse.json(
        { error: 'Error al crear la variante' },
        { status: 500 }
      )
    }

    // 3. Insertar tonos de luz
    if (light_tone_ids && Array.isArray(light_tone_ids) && light_tone_ids.length > 0) {
      const tonesToInsert = light_tone_ids.map((toneId) => ({
        variant_id: variant.id,
        light_tone_id: toneId,
      }))

      const { error: insertTonesError } = await supabase
        .from('variant_light_tones')
        .insert(tonesToInsert)

      if (insertTonesError) {
        console.error('[Variant Create] Error al insertar tonos:', insertTonesError)
        // No retornamos error aquí, la variante ya fue creada
      }
    }

    // 4. Insertar configuraciones
    if (configurations && Array.isArray(configurations) && configurations.length > 0) {
      const configsToInsert = configurations.map((config: any) => ({
        variant_id: variant.id,
        sku: config.sku,
        watt: config.watt,
        lumens: config.lumens,
        voltage: config.voltage,
        diameter_description: config.diameter_description,
        length_mm: config.length_mm,
        width_mm: config.width_mm,
        specs: config.specs,
      }))

      const { error: insertConfigError } = await supabase
        .from('variant_configurations')
        .insert(configsToInsert)

      if (insertConfigError) {
        console.error('[Variant Create] Error al insertar configuraciones:', insertConfigError)
        // No retornamos error aquí, la variante ya fue creada
      }
    }

    console.log('[Variant Create] Variante creada exitosamente:', variant.id)

    return NextResponse.json({
      success: true,
      message: 'Variante creada exitosamente',
      variant,
    })
  } catch (error) {
    console.error('[Variant Create] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error al crear la variante' },
      { status: 500 }
    )
  }
}
