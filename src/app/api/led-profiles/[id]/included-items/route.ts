import { NextRequest, NextResponse } from 'next/server'
import { addIncludedItemToProfile } from '@/features/led-profiles/queries'

export async function POST(
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
    const { accessory_id, qty_per_m } = body

    if (!accessory_id || !qty_per_m || qty_per_m <= 0) {
      return NextResponse.json(
        { error: 'Datos inválidos para el accesorio incluido' },
        { status: 400 }
      )
    }

    const relation = {
      profile_id: id,
      accessory_id,
      qty_per_m,
    }

    const success = await addIncludedItemToProfile(relation)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error al agregar el accesorio incluido' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error(`Error adding included item to LED profile ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Error al agregar el accesorio incluido' },
      { status: 500 }
    )
  }
}
