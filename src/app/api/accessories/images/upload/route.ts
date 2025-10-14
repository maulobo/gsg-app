import { NextRequest, NextResponse } from 'next/server'
import { 
  uploadToR2, 
  processProductImage, 
  validateImageFile, 
  generateUniqueFileName, 
  fileToBuffer,
  deleteFromR2,
  extractKeyFromUrl
} from '@/lib/r2client'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/accessories/images/upload
 * Sube imágenes de accesorios a R2 y guarda en DB
 * 
 * - kind='cover' → Guarda en accessories.photo_url (imagen principal)
 * - kind='tech' → Guarda en accessory_media (fichas técnicas)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parsear FormData
    const formData = await request.formData()
    const file = formData.get('image') as File
    const accessoryCode = formData.get('accessoryCode') as string
    const kind = formData.get('kind') as 'cover' | 'tech' || 'cover'
    const altText = formData.get('altText') as string || ''

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo de imagen' },
        { status: 400 }
      )
    }

    if (!accessoryCode) {
      return NextResponse.json(
        { error: 'accessoryCode es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 1.5. Obtener accessory_id desde el código
    const { data: accessory, error: fetchError } = await supabase
      .from('accessories')
      .select('id')
      .eq('code', accessoryCode)
      .single()

    if (fetchError || !accessory) {
      return NextResponse.json(
        { error: 'Accesorio no encontrado' },
        { status: 404 }
      )
    }

    // 2. Validar archivo
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // 3. Procesar imagen
    const fileBuffer = await fileToBuffer(file)
    const { optimizedBuffer, contentType } = await processProductImage(fileBuffer, kind)

    // 4. Generar nombre único en carpeta accessories
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const folder = `accessories/${accessoryCode}`
    const fileName = `${folder}/${kind}/${timestamp}-${randomId}.webp`

    // 5. Subir a R2
    const imageUrl = await uploadToR2(fileName, optimizedBuffer, contentType)

    // 6. Guardar en base de datos según el tipo
    if (kind === 'cover') {
      // Para cover: actualizar photo_url en accessories
      const { error: updateError } = await supabase
        .from('accessories')
        .update({ photo_url: imageUrl })
        .eq('id', accessory.id)

      if (updateError) {
        console.error('Error actualizando photo_url:', updateError)
        // Rollback: eliminar de R2
        const key = extractKeyFromUrl(imageUrl)
        if (key) {
          try {
            await deleteFromR2(key)
          } catch (deleteError) {
            console.error('Error eliminando archivo de R2:', deleteError)
          }
        }
        
        return NextResponse.json(
          { error: 'Error guardando imagen en base de datos', details: updateError },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        url: imageUrl,
        message: 'Imagen principal actualizada'
      })
    } else {
      // Para gallery/tech: insertar en accessory_media
      const { data: mediaAsset, error: dbError } = await supabase
        .from('accessory_media')
        .insert({
          accessory_id: accessory.id,
          path: imageUrl,
          kind,
          alt_text: altText || null,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error guardando imagen en accessory_media:', dbError)
        // Rollback: eliminar de R2
        const key = extractKeyFromUrl(imageUrl)
        if (key) {
          try {
            await deleteFromR2(key)
          } catch (deleteError) {
            console.error('Error eliminando archivo de R2:', deleteError)
          }
        }
        
        return NextResponse.json(
          { error: 'Error guardando imagen en base de datos', details: dbError },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        url: imageUrl,
        mediaAsset: {
          id: mediaAsset.id,
          path: mediaAsset.path,
          kind: mediaAsset.kind,
          alt_text: mediaAsset.alt_text
        }
      })
    }

  } catch (error) {
    console.error('Error en upload de imagen de accesorio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

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

    // 1. Obtener datos del media asset
    const { data: mediaAsset, error: fetchError } = await supabase
      .from('accessory_media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (fetchError || !mediaAsset) {
      return NextResponse.json(
        { error: 'Media asset no encontrado' },
        { status: 404 }
      )
    }

    // 2. Eliminar de R2
    const key = extractKeyFromUrl(mediaAsset.path)
    if (key) {
      try {
        await deleteFromR2(key)
      } catch (r2Error) {
        console.error('Error eliminando de R2:', r2Error)
        // Continuar con eliminación de DB aunque falle R2
      }
    }

    // 3. Eliminar de base de datos
    const { error: deleteError } = await supabase
      .from('accessory_media')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Error eliminando de base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error eliminando imagen de accesorio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
