import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getLedProfiles, createLedProfile } from '@/features/led-profiles/queries'
import type { LedProfileFormData } from '@/features/led-profiles/types'

export async function GET(request: NextRequest) {
  try {
    const profiles = await getLedProfiles()
    return NextResponse.json({ profiles }, { status: 200 })
  } catch (error) {
    console.error('Error fetching LED profiles:', error)
    return NextResponse.json(
      { error: 'Error al obtener los perfiles LED' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const profileData: LedProfileFormData = body

    // Validate required fields
    if (!profileData.name || !profileData.code || !profileData.material) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: name, code, material' },
        { status: 400 }
      )
    }

    const profile = await createLedProfile(profileData)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Error al crear el perfil LED' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Error creating LED profile:', error)
    return NextResponse.json(
      { error: 'Error al crear el perfil LED' },
      { status: 500 }
    )
  }
}
