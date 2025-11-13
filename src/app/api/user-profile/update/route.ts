// =====================================================
// API ROUTE: Update User Profile
// POST /api/user-profile/update
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { upsertUserProfile } from '@/features/user-profile/queries'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // Obtener los datos del body
    const body = await req.json()
    
    // Validaciones básicas
    if (!body) {
      return NextResponse.json(
        { error: 'Datos de perfil requeridos' },
        { status: 400 }
      )
    }

    // Actualizar el perfil
    const result = await upsertUserProfile(user.id, body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      profile: result.data
    })

  } catch (error: any) {
    console.error('Error in update user profile API:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
