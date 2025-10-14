import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/accessories
 * Creates a new accessory with N:N relations (light_tones, finishes)
 * 
 * Expected payload:
 * {
 *   accessory: AccessoryInsert (code, name, description?, photo_url?, watt?, voltage_*, etc.)
 *   light_tone_ids?: number[]
 *   finish_ids?: number[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/accessories payload:', JSON.stringify(body))

    // Extract accessory data and relation arrays
    const { accessory, light_tone_ids, finish_ids } = body

    // Validate required fields
    if (!accessory || !accessory.code || typeof accessory.code !== 'string' || accessory.code.trim() === '') {
      console.error('Missing required field `code` in request body')
      return NextResponse.json({ error: 'Missing required field: code' }, { status: 400 })
    }

    if (!accessory.name || typeof accessory.name !== 'string' || accessory.name.trim() === '') {
      console.error('Missing required field `name` in request body')
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // 1. Create the accessory
    const cleanCode = accessory.code.trim()
    const cleanName = accessory.name.trim()

    const { data: createdAccessory, error: accessoryError } = await supabase
      .from('accessories')
      .insert({
        code: cleanCode,
        name: cleanName,
        description: accessory.description || null,
        photo_url: accessory.photo_url || null,
        watt: accessory.watt || null,
        voltage_label: accessory.voltage_label || null,
        voltage_min: accessory.voltage_min || null,
        voltage_max: accessory.voltage_max || null,
      })
      .select()
      .single()

    if (accessoryError) {
      console.error('Error creating accessory:', accessoryError)
      return NextResponse.json(
        { error: accessoryError.message },
        { status: 400 }
      )
    }

    // 2. Insert N:N relations: accessory_light_tones
    if (light_tone_ids && Array.isArray(light_tone_ids) && light_tone_ids.length > 0) {
      const toneRecords = light_tone_ids.map((toneId: number) => ({
        accessory_id: createdAccessory.id,
        light_tone_id: toneId,
      }))

      const { error: toneError } = await supabase
        .from('accessory_light_tones')
        .insert(toneRecords)

      if (toneError) {
        console.error('Error inserting light tones:', toneError)
        // Continue anyway - relation is optional
      }
    }

    // 3. Insert N:N relations: accessory_finishes
    if (finish_ids && Array.isArray(finish_ids) && finish_ids.length > 0) {
      const finishRecords = finish_ids.map((finishId: number) => ({
        accessory_id: createdAccessory.id,
        finish_id: finishId,
      }))

      const { error: finishError } = await supabase
        .from('accessory_finishes')
        .insert(finishRecords)

      if (finishError) {
        console.error('Error inserting finishes:', finishError)
        // Continue anyway - relation is optional
      }
    }

    console.log('Accessory created successfully:', createdAccessory.code)
    return NextResponse.json(createdAccessory, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/accessories error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
