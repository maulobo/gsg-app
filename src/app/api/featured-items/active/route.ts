import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/featured-items/active
 * Obtiene solo los items destacados ACTIVOS (para mostrar en el home público)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('featured_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(3) // Máximo 3 items activos

    if (error) {
      console.error('[Featured Items Active GET] Error:', error)
      return NextResponse.json(
        { error: 'Error al obtener items destacados activos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('[Featured Items Active GET] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
