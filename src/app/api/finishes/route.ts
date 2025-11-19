import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: finishes, error } = await supabase
      .from('finishes')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching finishes:', error)
      return NextResponse.json(
        { error: 'Error al obtener los acabados' },
        { status: 500 }
      )
    }

    return NextResponse.json({ finishes })
  } catch (error) {
    console.error('Error in GET /api/finishes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
