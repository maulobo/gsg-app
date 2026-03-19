import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const familyId = parseInt(id, 10)
    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Fetch family
    const { data: family, error: familyError } = await supabase
      .from('led_roll_families')
      .select('*')
      .eq('id', familyId)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 })
    }

    // Fetch variants
    const { data: variants } = await supabase
      .from('led_rolls')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('code', { ascending: true })

    // Fetch media
    const { data: media } = await supabase
      .from('led_roll_family_media')
      .select('*')
      .eq('family_id', familyId)
      .order('display_order', { ascending: true })

    return NextResponse.json({
      family: {
        ...family,
        variants: variants || [],
        media: media || [],
      }
    }, { status: 200 })
  } catch (error) {
    const { id } = await params
    console.error(`Error in GET /api/led-rolls/families/${id}:`, error)
    return NextResponse.json(
      { error: 'Error al obtener la familia LED' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const familyId = parseInt(id, 10)
    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const body = await request.json()

    const { data: family, error } = await supabase
      .from('led_roll_families')
      .update(body)
      .eq('id', familyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ family }, { status: 200 })
  } catch (error) {
    const { id } = await params
    console.error(`Error in PUT /api/led-rolls/families/${id}:`, error)
    return NextResponse.json(
      { error: 'Error al actualizar la familia LED' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const familyId = parseInt(id, 10)
    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from('led_roll_families')
      .update({ is_active: false })
      .eq('id', familyId)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const { id } = await params
    console.error(`Error in DELETE /api/led-rolls/families/${id}:`, error)
    return NextResponse.json(
      { error: 'Error al eliminar la familia LED' },
      { status: 500 }
    )
  }
}
