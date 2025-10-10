import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type RouteParams = {
  code: string
  variantId: string
}

/**
 * PATCH /api/products/[code]/variants/[variantId]
 * Actualiza una variante y sus relaciones
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { code, variantId } = await context.params
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
    const { name, variant_code, includes_led, includes_driver, light_tone_ids, configurations } = body

    console.log('[Variant Update] Actualizando variante:', {
      code,
      variantId,
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
      .eq('product_code', code)
      .single()

    if (productError || !product) {
      console.error('[Variant Update] Producto no encontrado:', productError)
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // 2. Actualizar datos básicos de la variante
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({
        name,
        variant_code,
        includes_led,
        includes_driver,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId)
      .eq('product_id', product.id)

    if (updateError) {
      console.error('[Variant Update] Error al actualizar variante:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la variante' },
        { status: 500 }
      )
    }

    // 3. Actualizar tonos de luz (borrar y recrear)
    if (light_tone_ids && Array.isArray(light_tone_ids)) {
      // Eliminar tonos actuales
      const { error: deleteTonesError } = await supabase
        .from('variant_light_tones')
        .delete()
        .eq('variant_id', variantId)

      if (deleteTonesError) {
        console.error('[Variant Update] Error al eliminar tonos:', deleteTonesError)
      }

      // Insertar nuevos tonos
      if (light_tone_ids.length > 0) {
        const tonesToInsert = light_tone_ids.map((toneId) => ({
          variant_id: parseInt(variantId),
          light_tone_id: toneId,
        }))

        const { error: insertTonesError } = await supabase
          .from('variant_light_tones')
          .insert(tonesToInsert)

        if (insertTonesError) {
          console.error('[Variant Update] Error al insertar tonos:', insertTonesError)
          return NextResponse.json(
            { error: 'Error al actualizar los tonos de luz' },
            { status: 500 }
          )
        }
      }
    }

    // 4. Actualizar configuraciones (borrar y recrear)
    if (configurations && Array.isArray(configurations)) {
      // Eliminar configuraciones actuales
      const { error: deleteConfigError } = await supabase
        .from('variant_configurations')
        .delete()
        .eq('variant_id', variantId)

      if (deleteConfigError) {
        console.error('[Variant Update] Error al eliminar configuraciones:', deleteConfigError)
      }

      // Insertar nuevas configuraciones
      if (configurations.length > 0) {
        const configsToInsert = configurations.map((config) => ({
          variant_id: parseInt(variantId),
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
          console.error('[Variant Update] Error al insertar configuraciones:', insertConfigError)
          return NextResponse.json(
            { error: 'Error al actualizar las configuraciones' },
            { status: 500 }
          )
        }
      }
    }

    console.log('[Variant Update] Variante actualizada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Variante actualizada exitosamente',
    })
  } catch (error) {
    console.error('[Variant Update] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la variante' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[code]/variants/[variantId]
 * Elimina una variante (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { code, variantId } = await context.params
    const supabase = await createServerSupabaseClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('[Variant Delete] Eliminando variante:', { code, variantId })

    // Verificar que el producto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('product_code', code)
      .single()

    if (productError || !product) {
      console.error('[Variant Delete] Producto no encontrado:', productError)
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Soft delete: marcar como eliminado
    const { error: deleteError } = await supabase
      .from('product_variants')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId)
      .eq('product_id', product.id)

    if (deleteError) {
      console.error('[Variant Delete] Error al eliminar variante:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar la variante' },
        { status: 500 }
      )
    }

    console.log('[Variant Delete] Variante eliminada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Variante eliminada exitosamente',
    })
  } catch (error) {
    console.error('[Variant Delete] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la variante' },
      { status: 500 }
    )
  }
}
