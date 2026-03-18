import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    if (!body.family_id || !body.code || !body.watts_per_meter || !body.voltage) {
      return NextResponse.json(
        { error: 'family_id, código, potencia y voltaje son requeridos' },
        { status: 400 }
      )
    }

    const { data: variant, error } = await supabase
      .from('led_rolls')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ variant }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/led-rolls/variants:', error)
    return NextResponse.json(
      { error: 'Error al crear la variante LED' },
      { status: 500 }
    )
  }
}
