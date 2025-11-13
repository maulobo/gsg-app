import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 3) {
      return NextResponse.json({ 
        data: [],
        message: 'Escribe al menos 3 caracteres para buscar' 
      })
    }

    const supabase = await createServerSupabaseClient()

    // Buscar productos cuyo código contenga la query (case insensitive)
    const { data, error } = await supabase
      .from('products')
      .select('code, name')
      .ilike('code', `%${query}%`)
      .order('code')
      .limit(10)

    if (error) {
      console.error('Error searching product codes:', error)
      return NextResponse.json(
        { error: 'Error al buscar códigos de productos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in search-codes API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
