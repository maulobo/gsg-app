import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { deleteFromR2, extractKeyFromUrl } from '@/lib/r2client'
import { sanitizePowerSupply, sanitizeModels } from '@/features/power-supplies/sanitize'

/**
 * PATCH /api/power-supplies/[code]
 * Actualiza la familia y reemplaza su lista de modelos
 *
 * Payload: { power_supply: PowerSupplyInput, models?: PowerSupplyModelInput[] }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const { power_supply, models } = await request.json()

    if (!power_supply?.name?.trim()) {
      return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: existing, error: fetchError } = await supabase
      .from('power_supplies')
      .select('id')
      .eq('code', code)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Fuente no encontrada' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('power_supplies')
      .update(sanitizePowerSupply(power_supply))
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating power supply:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    if (Array.isArray(models)) {
      const { error: deleteError } = await supabase
        .from('power_supply_models')
        .delete()
        .eq('power_supply_id', existing.id)
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }

      const modelRows = sanitizeModels(models, existing.id)
      if (modelRows.length > 0) {
        const { error: insertError } = await supabase.from('power_supply_models').insert(modelRows)
        if (insertError) {
          console.error('Error replacing power supply models:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('PATCH /api/power-supplies/[code] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/power-supplies/[code]
 * Elimina la fuente, sus modelos/media (cascade) y los archivos en R2
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const supabase = createAdminSupabaseClient()

    const { data: existing, error: fetchError } = await supabase
      .from('power_supplies')
      .select('id, photo_url, power_supply_media ( path )')
      .eq('code', code)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Fuente no encontrada' }, { status: 404 })
    }

    const paths = [existing.photo_url, ...(existing.power_supply_media || []).map((m: any) => m.path)].filter(
      Boolean
    ) as string[]

    const { error: deleteError } = await supabase.from('power_supplies').delete().eq('id', existing.id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    for (const path of paths) {
      const key = extractKeyFromUrl(path)
      if (!key) continue
      try {
        await deleteFromR2(key)
      } catch (r2Error) {
        console.error('Error eliminando de R2:', r2Error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/power-supplies/[code] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
