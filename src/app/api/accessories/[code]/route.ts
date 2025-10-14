import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { deleteFromR2, extractKeyFromUrl } from '@/lib/r2client'

/**
 * PATCH /api/accessories/[code]
 * Updates an accessory with N:N relations (light_tones, finishes)
 * 
 * Expected payload:
 * {
 *   accessory: AccessoryUpdate (name, description?, photo_url?, watt?, voltage_*, etc.)
 *   light_tone_ids?: number[]
 *   finish_ids?: number[]
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    console.log('PATCH /api/accessories/[code] payload:', JSON.stringify(body))

    const { accessory, light_tone_ids, finish_ids } = body

    if (!accessory) {
      return NextResponse.json({ error: 'Missing accessory data' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // 1. Buscar el accesorio por código
    const { data: existingAccessory, error: fetchError } = await supabase
      .from('accessories')
      .select('id')
      .eq('code', code)
      .single()

    if (fetchError || !existingAccessory) {
      return NextResponse.json(
        { error: 'Accesorio no encontrado' },
        { status: 404 }
      )
    }

    // 2. Actualizar el accesorio
    const { data: updatedAccessory, error: updateError } = await supabase
      .from('accessories')
      .update({
        name: accessory.name,
        description: accessory.description || null,
        photo_url: accessory.photo_url || null,
        watt: accessory.watt || null,
        voltage_label: accessory.voltage_label || null,
        voltage_min: accessory.voltage_min || null,
        voltage_max: accessory.voltage_max || null,
      })
      .eq('id', existingAccessory.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating accessory:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // 3. Actualizar relaciones N:N: accessory_light_tones
    if (light_tone_ids !== undefined && Array.isArray(light_tone_ids)) {
      // Eliminar relaciones existentes
      await supabase
        .from('accessory_light_tones')
        .delete()
        .eq('accessory_id', existingAccessory.id)

      // Insertar nuevas relaciones
      if (light_tone_ids.length > 0) {
        const toneRecords = light_tone_ids.map((toneId: number) => ({
          accessory_id: existingAccessory.id,
          light_tone_id: toneId,
        }))

        const { error: toneError } = await supabase
          .from('accessory_light_tones')
          .insert(toneRecords)

        if (toneError) {
          console.error('Error updating light tones:', toneError)
        }
      }
    }

    // 4. Actualizar relaciones N:N: accessory_finishes
    if (finish_ids !== undefined && Array.isArray(finish_ids)) {
      // Eliminar relaciones existentes
      await supabase
        .from('accessory_finishes')
        .delete()
        .eq('accessory_id', existingAccessory.id)

      // Insertar nuevas relaciones
      if (finish_ids.length > 0) {
        const finishRecords = finish_ids.map((finishId: number) => ({
          accessory_id: existingAccessory.id,
          finish_id: finishId,
        }))

        const { error: finishError } = await supabase
          .from('accessory_finishes')
          .insert(finishRecords)

        if (finishError) {
          console.error('Error updating finishes:', finishError)
        }
      }
    }

    console.log('Accessory updated successfully:', updatedAccessory.code)
    return NextResponse.json(updatedAccessory, { status: 200 })
  } catch (error: any) {
    console.error('PATCH /api/accessories/[code] error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createServerSupabaseClient()

    // 1. Buscar el accesorio
    const { data: accessory, error: fetchError } = await supabase
      .from('accessories')
      .select('id, photo_url')
      .eq('code', code)
      .single()

    if (fetchError || !accessory) {
      return NextResponse.json(
        { error: 'Accesorio no encontrado' },
        { status: 404 }
      )
    }

    let deletedImagesCount = 0

    // 2. Eliminar foto principal (photo_url) de R2
    if (accessory.photo_url) {
      const key = extractKeyFromUrl(accessory.photo_url)
      if (key) {
        try {
          await deleteFromR2(key)
          deletedImagesCount++
          console.log(`✅ Foto principal eliminada de R2: ${key}`)
        } catch (r2Error) {
          console.error(`❌ Error eliminando foto principal de R2: ${key}`, r2Error)
        }
      }
    }

    // 3. Obtener y eliminar imágenes de la galería (accessory_media)
    const { data: mediaAssets, error: mediaError } = await supabase
      .from('accessory_media')
      .select('id, path')
      .eq('accessory_id', accessory.id)

    if (mediaAssets && mediaAssets.length > 0) {
      console.log(`Eliminando ${mediaAssets.length} imágenes adicionales de R2...`)
      
      for (const asset of mediaAssets) {
        const key = extractKeyFromUrl(asset.path)
        if (key) {
          try {
            await deleteFromR2(key)
            deletedImagesCount++
            console.log(`✅ Imagen eliminada de R2: ${key}`)
          } catch (r2Error) {
            console.error(`❌ Error eliminando imagen de R2: ${key}`, r2Error)
          }
        }
      }
    }

    // 4. Eliminar el accesorio de la base de datos
    // (las cascadas eliminarán: accessory_light_tones, accessory_finishes, accessory_media)
    const { error: deleteError } = await supabase
      .from('accessories')
      .delete()
      .eq('id', accessory.id)

    if (deleteError) {
      console.error('Error deleting accessory from DB:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      )
    }

    console.log(`✅ Accesorio ${code} eliminado completamente (DB + R2)`)

    return NextResponse.json({ 
      success: true, 
      message: 'Accesorio eliminado exitosamente',
      deletedImages: deletedImagesCount
    }, { status: 200 })
  } catch (error: any) {
    console.error('DELETE /api/accessories/[code] error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
