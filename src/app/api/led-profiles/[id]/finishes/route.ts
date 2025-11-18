import { NextRequest, NextResponse } from 'next/server'
import { addFinishToProfile } from '@/features/led-profiles/queries'

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
    const { finish_id } = body

    if (!finish_id) {
      return NextResponse.json(
        { error: 'finish_id es requerido' },
        { status: 400 }
      )
    }

    const relation = {
      profile_id: id,
      finish_id,
    }

    const success = await addFinishToProfile(relation)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error al agregar el acabado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error(`Error adding finish to LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al agregar el acabado' },
      { status: 500 }
    )
  }
}
