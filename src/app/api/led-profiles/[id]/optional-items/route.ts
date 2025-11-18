import { NextRequest, NextResponse } from 'next/server'
import { addOptionalItemToProfile } from '@/features/led-profiles/queries'

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
    const { accessory_id, qty_per_m } = body

    if (!accessory_id || !qty_per_m || qty_per_m <= 0) {
      return NextResponse.json(
        { error: 'Datos inválidos para el accesorio opcional' },
        { status: 400 }
      )
    }

    const relation = {
      profile_id: id,
      accessory_id,
      qty_per_m,
    }

    const success = await addOptionalItemToProfile(relation)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error al agregar el accesorio opcional' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error(`Error adding optional item to LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al agregar el accesorio opcional' },
      { status: 500 }
    )
  }
}
