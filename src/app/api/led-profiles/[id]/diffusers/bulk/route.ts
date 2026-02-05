import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type DiffuserRelation = {
  diffuser_id?: number
  tone?: string
  material: string
  notes: string
}

/**
 * PUT /api/led-profiles/[id]/diffusers/bulk
 * Replace all diffusers for a profile with a new set
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const profileId = parseInt(resolvedParams.id, 10)
    if (isNaN(profileId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { diffusers } = body as { diffusers: DiffuserRelation[] }

    if (!Array.isArray(diffusers)) {
      return NextResponse.json(
        { error: 'diffusers debe ser un array' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 1. Delete all existing diffusers for this profile
    const { error: deleteError } = await supabase
      .from('led_profile_diffusers')
      .delete()
      .eq('profile_id', profileId)

    if (deleteError) {
      console.error('Error deleting existing diffusers:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar difusores existentes' },
        { status: 500 }
      )
    }

    // 2. Insert new diffusers (only if there are any)
    if (diffusers.length > 0) {
      const newDiffusers = diffusers
        .filter(d => d.diffuser_id) // Only include if diffuser_id exists
        .map(d => ({
          profile_id: profileId,
          diffuser_id: d.diffuser_id!,
          notes: d.notes || null,
        }))

      if (newDiffusers.length > 0) {
        const { error: insertError } = await supabase
          .from('led_profile_diffusers')
          .insert(newDiffusers)

        if (insertError) {
          console.error('Error inserting new diffusers:', insertError)
          return NextResponse.json(
            { error: 'Error al agregar nuevos difusores' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      count: diffusers.length 
    }, { status: 200 })
  } catch (error) {
    console.error(`Error updating diffusers for LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al actualizar difusores' },
      { status: 500 }
    )
  }
}
