import { NextRequest, NextResponse } from 'next/server'
import { getLedRollById, updateLedRoll, deleteLedRoll } from '@/features/led-rolls/queries'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const roll = await getLedRollById(id)

    if (!roll) {
      return NextResponse.json(
        { error: 'Rollo LED no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ roll }, { status: 200 })
  } catch (error) {
    console.error(`Error in GET /api/led-rolls/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Error al obtener el rollo LED' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const roll = await updateLedRoll(id, body)

    if (!roll) {
      return NextResponse.json(
        { error: 'Error al actualizar el rollo LED' },
        { status: 500 }
      )
    }

    return NextResponse.json({ roll }, { status: 200 })
  } catch (error) {
    console.error(`Error in PUT /api/led-rolls/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Error al actualizar el rollo LED' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const success = await deleteLedRoll(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Error al eliminar el rollo LED' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error in DELETE /api/led-rolls/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Error al eliminar el rollo LED' },
      { status: 500 }
    )
  }
}
