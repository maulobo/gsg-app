import { NextRequest, NextResponse } from 'next/server'
import { createLedRollModel } from '@/features/led-rolls/queries'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validación básica
    if (!body.sku || !body.watt_per_m || !body.leds_per_m || !body.color_mode) {
      return NextResponse.json(
        { error: 'SKU, potencia, LEDs/m y modo de color son requeridos' },
        { status: 400 }
      )
    }

    // Validación de color_mode
    if (body.color_mode === 'mono' && !body.light_tone_ids && !body.light_tone_id) {
      return NextResponse.json(
        { error: 'light_tone_ids (array) o light_tone_id es requerido para modo monocromático' },
        { status: 400 }
      )
    }

    if (body.color_mode === 'cct' && (!body.cct_min_k || !body.cct_max_k)) {
      return NextResponse.json(
        { error: 'cct_min_k y cct_max_k son requeridos para modo CCT' },
        { status: 400 }
      )
    }

    const modelData = {
      ...body,
      roll_id: id,
    }

    const model = await createLedRollModel(modelData)

    if (!model) {
      return NextResponse.json(
        { error: 'Error al crear el modelo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ model }, { status: 201 })
  } catch (error) {
    console.error(`Error in POST /api/led-rolls/${resolvedParams.id}/models:`, error)
    return NextResponse.json(
      { error: 'Error al crear el modelo' },
      { status: 500 }
    )
  }
}
