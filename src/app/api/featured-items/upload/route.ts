import { NextRequest, NextResponse } from 'next/server'
import {
  uploadToR2,
  processProductImage,
  validateImageFile,
  generateUniqueFileName,
  fileToBuffer,
} from '@/lib/r2client'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const altText = formData.get('altText') as string || 'Featured item'

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo de imagen' },
        { status: 400 }
      )
    }

    // Validar archivo
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Procesar imagen
    const fileBuffer = await fileToBuffer(file)
    const { optimizedBuffer, contentType } = await processProductImage(fileBuffer, 'cover')

    // Generar nombre único
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `featured/${timestamp}-${randomId}.webp`

    // Subir a R2
    const imageUrl = await uploadToR2(fileName, optimizedBuffer, contentType)

    return NextResponse.json({
      success: true,
      imageUrl,
    })
  } catch (error) {
    console.error('Error en upload de imagen featured:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
