import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/featured-items
 * Obtiene TODOS los items destacados (activos e inactivos)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('featured_items')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Featured Items GET] Error:', error)
      return NextResponse.json(
        { error: 'Error al obtener items destacados' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('[Featured Items GET] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/featured-items
 * Crea un nuevo item destacado
 */
export async function POST(request: NextRequest) {
  try {
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
    const { title, image_url, link_url, display_order } = body

    if (!title || !image_url) {
      return NextResponse.json(
        { error: 'title e image_url son requeridos' },
        { status: 400 }
      )
    }

    // Verificar cuántos items activos hay
    const { count } = await supabase
      .from('featured_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'Ya hay 3 items destacados activos. Desactiva uno primero.' },
        { status: 400 }
      )
    }

    // Calcular display_order automáticamente si no se proporciona
    let finalDisplayOrder = display_order
    if (!finalDisplayOrder) {
      const { data: lastItem } = await supabase
        .from('featured_items')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      finalDisplayOrder = lastItem ? lastItem.display_order + 1 : 1
      if (finalDisplayOrder > 3) finalDisplayOrder = 3
    }

    const { data, error } = await supabase
      .from('featured_items')
      .insert({
        title,
        image_url,
        link_url: link_url || null,
        display_order: finalDisplayOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[Featured Items POST] Error:', error)
      return NextResponse.json(
        { error: 'Error al crear item destacado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: `"${title}" agregado a destacados`,
    })
  } catch (error) {
    console.error('[Featured Items POST] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/featured-items
 * Actualiza un item destacado
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('featured_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Featured Items PATCH] Error:', error)

      if (error.message?.includes('más de 3')) {
        return NextResponse.json(
          { error: 'No se pueden tener más de 3 items destacados activos' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Error al actualizar item destacado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Item actualizado',
    })
  } catch (error) {
    console.error('[Featured Items PATCH] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/featured-items?id=1
 * Elimina un item destacado
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { error } = await supabase.from('featured_items').delete().eq('id', id)

    if (error) {
      console.error('[Featured Items DELETE] Error:', error)
      return NextResponse.json(
        { error: 'Error al eliminar item destacado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Item eliminado',
    })
  } catch (error) {
    console.error('[Featured Items DELETE] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
