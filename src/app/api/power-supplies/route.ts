import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { sanitizePowerSupply, sanitizeModels } from '@/features/power-supplies/sanitize'

/**
 * POST /api/power-supplies
 * Crea una fuente (familia) con sus modelos por voltaje
 *
 * Payload: { power_supply: PowerSupplyInput, models: PowerSupplyModelInput[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { power_supply, models } = body

    if (!power_supply?.code?.trim()) {
      return NextResponse.json({ error: 'Falta el código' }, { status: 400 })
    }
    if (!power_supply?.name?.trim()) {
      return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: created, error } = await supabase
      .from('power_supplies')
      .insert({ code: power_supply.code.trim(), ...sanitizePowerSupply(power_supply) })
      .select()
      .single()

    if (error) {
      console.error('Error creating power supply:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const modelRows = sanitizeModels(models, created.id)
    if (modelRows.length > 0) {
      const { error: modelsError } = await supabase.from('power_supply_models').insert(modelRows)
      if (modelsError) {
        console.error('Error creating power supply models:', modelsError)
        // Rollback para no dejar la familia sin modelos
        await supabase.from('power_supplies').delete().eq('id', created.id)
        return NextResponse.json({ error: modelsError.message }, { status: 400 })
      }
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/power-supplies error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
