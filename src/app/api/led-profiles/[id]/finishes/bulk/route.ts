import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * PUT /api/led-profiles/[id]/finishes/bulk
 * Replace all finishes for a profile with a new set
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
    const { finish_ids } = body as { finish_ids: number[] }

    if (!Array.isArray(finish_ids)) {
      return NextResponse.json(
        { error: 'finish_ids debe ser un array' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 1. Delete all existing finishes for this profile
    const { error: deleteError } = await supabase
      .from('led_profile_finishes')
      .delete()
      .eq('profile_id', profileId)

    if (deleteError) {
      console.error('Error deleting existing finishes:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar acabados existentes' },
        { status: 500 }
      )
    }

    // 2. Insert new finishes (only if there are any)
    if (finish_ids.length > 0) {
      const newFinishes = finish_ids.map(finish_id => ({
        profile_id: profileId,
        finish_id,
      }))

      const { error: insertError } = await supabase
        .from('led_profile_finishes')
        .insert(newFinishes)

      if (insertError) {
        console.error('Error inserting new finishes:', insertError)
        return NextResponse.json(
          { error: 'Error al agregar nuevos acabados' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      count: finish_ids.length 
    }, { status: 200 })
  } catch (error) {
    console.error(`Error updating finishes for LED profile ${resolvedParams.id}:`, error)
    return NextResponse.json(
      { error: 'Error al actualizar acabados' },
      { status: 500 }
    )
  }
}
