import { NextRequest, NextResponse } from 'next/server'
import { addDiffuserToProfile } from '@/features/led-profiles/queries'
import type { LedProfileDiffuserFormData } from '@/features/led-profiles/types'

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
    const diffuserData: LedProfileDiffuserFormData = body

    // Validar solo lo imprescindible: id del difusor
    if (!diffuserData.diffuser_id) {
      return NextResponse.json(
        { error: 'ID de difusor inválido' },
        { status: 400 }
      )
    }

    const relation = {
      profile_id: id,
      diffuser_id: diffuserData.diffuser_id,
      notes: diffuserData.notes || null,
    }

    const success = await addDiffuserToProfile(relation)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error al agregar el difusor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error(`Error adding diffuser to LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al agregar el difusor' },
      { status: 500 }
    )
  }
}
