import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: families, error } = await supabase
      .from('led_roll_families')
      .select(`
        *,
        variants:led_rolls(count),
        media:led_roll_family_media(path, kind)
      `)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ families }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/led-rolls/families:', error)
    return NextResponse.json(
      { error: 'Error al obtener las familias LED' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const { data: family, error } = await supabase
      .from('led_roll_families')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ family }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/led-rolls/families:', error)
    return NextResponse.json(
      { error: 'Error al crear la familia LED' },
      { status: 500 }
    )
  }
}
