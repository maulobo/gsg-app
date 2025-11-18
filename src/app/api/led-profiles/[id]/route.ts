import { NextRequest, NextResponse } from 'next/server'
import { getLedProfileById, updateLedProfile, deleteLedProfile } from '@/features/led-profiles/queries'
import type { LedProfileFormData } from '@/features/led-profiles/types'

export async function GET(
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

    const profile = await getLedProfileById(id)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil LED no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al obtener el perfil LED' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const updateData: Partial<LedProfileFormData> = body

    const profile = await updateLedProfile(id, updateData)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Error al actualizar el perfil LED' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, { status: 200 })
  } catch (error) {
    console.error(`Error updating LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al actualizar el perfil LED' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const success = await deleteLedProfile(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error al eliminar el perfil LED' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al eliminar el perfil LED' },
      { status: 500 }
    )
  }
}
