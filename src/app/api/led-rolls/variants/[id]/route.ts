import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const variantId = parseInt(id, 10)
    if (isNaN(variantId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data: variant, error } = await supabase
      .from('led_rolls')
      .update(body)
      .eq('id', variantId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ variant }, { status: 200 })
  } catch (error) {
    const { id } = await params
    console.error(`Error in PUT /api/led-rolls/variants/${id}:`, error)
    return NextResponse.json(
      { error: 'Error al actualizar la variante LED' },
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
    const variantId = parseInt(id, 10)
    if (isNaN(variantId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('led_rolls')
      .update({ is_active: false })
      .eq('id', variantId)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const { id } = await params
    console.error(`Error in DELETE /api/led-rolls/variants/${id}:`, error)
    return NextResponse.json(
      { error: 'Error al eliminar la variante LED' },
      { status: 500 }
    )
  }
}
