/**
 * API para guardar feedback del usuario sobre búsquedas
 * 
 * POST /api/search/feedback
 * Body: { 
 *   searchLogId: number, 
 *   feedback: 'helpful' | 'not_helpful',
 *   clickedProductId?: number 
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { searchLogId, feedback, clickedProductId } = await request.json()

    // Validaciones
    if (!searchLogId || typeof searchLogId !== 'number') {
      return NextResponse.json(
        { error: 'searchLogId es requerido y debe ser un número' },
        { status: 400 }
      )
    }

    if (!feedback || !['helpful', 'not_helpful'].includes(feedback)) {
      return NextResponse.json(
        { error: 'feedback debe ser "helpful" o "not_helpful"' },
        { status: 400 }
      )
    }

    // Actualizar el log con el feedback
    const updateData: any = {
      user_feedback: feedback,
      feedback_at: new Date().toISOString()
    }

    if (clickedProductId) {
      updateData.user_clicked_product_id = clickedProductId
    }

    const { error } = await supabase
      .from('search_logs')
      .update(updateData)
      .eq('id', searchLogId)

    if (error) {
      console.error('Error guardando feedback:', error)
      throw error
    }

    console.log(`✅ Feedback guardado: ${feedback} para búsqueda #${searchLogId}`)

    return NextResponse.json({
      success: true,
      message: 'Feedback guardado correctamente'
    })

  } catch (error: any) {
    console.error('❌ Error en feedback:', error)
    return NextResponse.json(
      { 
        error: 'Error al guardar feedback',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
