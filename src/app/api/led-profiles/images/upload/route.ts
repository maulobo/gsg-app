import { NextRequest, NextResponse } from 'next/server'
import { 
  uploadToR2, 
  processProductImage, 
  validateImageFile, 
  fileToBuffer,
  deleteFromR2,
  extractKeyFromUrl
} from '@/lib/r2client'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Generar nombre único para archivos de LED profiles
function generateLedProfileFileName(originalName: string, profileCode: string, kind: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  
  // Preservar extensión original para PDFs
  const isPDF = originalName.toLowerCase().endsWith('.pdf')
  const extension = isPDF ? 'pdf' : 'webp'
  
  return `led-profiles/${profileCode}/${kind}/${timestamp}-${randomId}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [LED Profile Upload] Iniciando upload...')
    
    // 1. Parsear FormData
    const formData = await request.formData()
    const file = formData.get('image') as File
    const profileId = formData.get('profileId') as string
    const profileCode = formData.get('profileCode') as string
    const kind = formData.get('kind') as 'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec' || 'gallery'
    const altText = formData.get('altText') as string || ''

    console.log(`📄 Archivo: ${file?.name}, Tipo: ${file?.type}, Tamaño: ${file?.size} bytes`)
    console.log(`📋 Profile ID: ${profileId}, Code: ${profileCode}, Kind: ${kind}`)

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo de imagen' },
        { status: 400 }
      )
    }

    if (!profileId || !profileCode) {
      return NextResponse.json(
        { error: 'profileId y profileCode son requeridos' },
        { status: 400 }
      )
    }

    // 2. Validar archivo
    const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    
    if (!isPDF) {
      // Solo validar imágenes si no es PDF
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    } else {
      // Validar tamaño de PDF (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El PDF no debe superar 10MB' },
          { status: 400 }
        )
      }
    }

    // 3. Procesar archivo según el tipo
    const fileBuffer = await fileToBuffer(file)
    let optimizedBuffer: Buffer
    let contentType: string

    if (isPDF) {
      // Para PDFs, no procesamos, solo subimos tal cual
      optimizedBuffer = fileBuffer
      contentType = 'application/pdf'
    } else {
      // Para imágenes, optimizamos
      const imageType = kind === 'tech' ? 'tech' : 'cover'
      const processed = await processProductImage(fileBuffer, imageType, file.type)
      optimizedBuffer = processed.optimizedBuffer
      contentType = processed.contentType
    }

    // 4. Generar nombre único
    const fileName = generateLedProfileFileName(file.name, profileCode, kind)
    console.log(`📝 Nombre de archivo generado: ${fileName}`)

    // 5. Subir a R2
    console.log(`☁️  Subiendo a R2...`)
    const imageUrl = await uploadToR2(fileName, optimizedBuffer, contentType)
    console.log(`✅ Archivo subido a R2: ${imageUrl}`)

    // 6. Guardar en base de datos
    const supabase = await createServerSupabaseClient()
    
    const mediaData = {
      profile_id: parseInt(profileId),
      path: imageUrl,
      kind,
      alt_text: altText || null,
    }

    console.log(`💾 Guardando en DB:`, mediaData)
    
    const { data: mediaAsset, error: dbError } = await supabase
      .from('led_profile_media')
      .insert(mediaData)
      .select()
      .single()

    // 7. Rollback en caso de error de DB
    if (dbError) {
      console.error('❌ Error guardando imagen en DB:', dbError)
      // Intentar eliminar la imagen de R2
      const key = extractKeyFromUrl(imageUrl)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch (deleteError) {
          console.error('Error eliminando imagen de R2 en rollback:', deleteError)
        }
      }
      
      return NextResponse.json(
        { error: 'Error guardando imagen en base de datos' },
        { status: 500 }
      )
    }

    console.log(`✅ Upload completado exitosamente!`)
    
    return NextResponse.json({
      success: true,
      media: mediaAsset,
      url: imageUrl
    })

  } catch (error) {
    console.error('❌ Error subiendo imagen:', error)
    return NextResponse.json(
      { error: 'Error interno al procesar la imagen' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar imagen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json(
        { error: 'mediaId es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 1. Obtener info de la imagen
    const { data: media, error: fetchError } = await supabase
      .from('led_profile_media')
      .select('path')
      .eq('id', parseInt(mediaId))
      .single()

    if (fetchError || !media) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // 2. Eliminar de R2
    const key = extractKeyFromUrl(media.path)
    if (key) {
      try {
        await deleteFromR2(key)
      } catch (r2Error) {
        console.error('Error eliminando de R2:', r2Error)
        // Continuar con la eliminación de DB aunque falle R2
      }
    }

    // 3. Eliminar de DB
    const { error: deleteError } = await supabase
      .from('led_profile_media')
      .delete()
      .eq('id', parseInt(mediaId))

    if (deleteError) {
      console.error('Error eliminando de DB:', deleteError)
      return NextResponse.json(
        { error: 'Error eliminando imagen de base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    })

  } catch (error) {
    console.error('Error eliminando imagen:', error)
    return NextResponse.json(
      { error: 'Error interno al eliminar la imagen' },
      { status: 500 }
    )
  }
}
