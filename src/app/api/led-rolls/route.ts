import { NextRequest, NextResponse } from 'next/server'
import { createLedRoll, getLedRolls } from '@/features/led-rolls/queries'

export async function GET() {
  try {
    const rolls = await getLedRolls()
    return NextResponse.json({ rolls }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/led-rolls:', error)
    return NextResponse.json(
      { error: 'Error al obtener los rollos LED' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validación básica
    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Código y nombre son requeridos' },
        { status: 400 }
      )
    }

    const roll = await createLedRoll(body)

    if (!roll) {
      return NextResponse.json(
        { error: 'Error al crear el rollo LED' },
        { status: 500 }
      )
    }

    return NextResponse.json({ roll }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/led-rolls:', error)
    return NextResponse.json(
      { error: 'Error al crear el rollo LED' },
      { status: 500 }
    )
  }
}
