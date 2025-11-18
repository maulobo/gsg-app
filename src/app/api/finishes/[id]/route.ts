/**
 * API endpoint to update finish color
 * 
 * PUT /api/finishes/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const body = await request.json()
    const { hex_color } = body

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Validar formato hex (opcional pero recomendado)
    if (hex_color && !/^#[0-9A-Fa-f]{6}$/.test(hex_color)) {
      return NextResponse.json(
        { error: 'Color hexadecimal inválido. Formato: #RRGGBB' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('finishes')
      .update({ hex_color })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating finish:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error: any) {
    console.error('❌ Error en PUT /api/finishes/[id]:', error)
    return NextResponse.json(
      { 
        error: 'Error al actualizar el acabado',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
