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

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear FormData
    const formData = await request.formData()
    const file = formData.get('image') as File
    const productId = formData.get('productId') as string
    const productCode = formData.get('productCode') as string
    const variantId = formData.get('variantId') as string || null
    const kind = formData.get('kind') as 'cover' | 'tech' || 'cover'
    const altText = formData.get('altText') as string || ''

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo de imagen' },
        { status: 400 }
      )
    }

    if (!productId || !productCode) {
      return NextResponse.json(
        { error: 'productId y productCode son requeridos' },
        { status: 400 }
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

    // 4. Generar nombre único
    const fileName = generateUniqueFileName(file.name, productCode, kind)

    // 5. Subir a R2
    const imageUrl = await uploadToR2(fileName, optimizedBuffer, contentType)

    // 6. Guardar en base de datos
    const supabase = await createServerSupabaseClient()
    
    const mediaData = {
      product_id: parseInt(productId),
      variant_id: variantId ? parseInt(variantId) : null,
      path: imageUrl,
      kind,
      alt_text: altText || null,
    }

    const { data: mediaAsset, error: dbError } = await supabase
      .from('media_assets')
      .insert(mediaData)
      .select()
      .single()

    // 7. Rollback en caso de error de DB
    if (dbError) {
      console.error('Error guardando imagen en DB:', dbError)
      // Intentar eliminar la imagen de R2
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
      imageUrl,
      mediaAsset: {
        id: mediaAsset.id,
        path: mediaAsset.path,
        kind: mediaAsset.kind,
        alt_text: mediaAsset.alt_text
      }
    })

  } catch (error) {
    console.error('Error en upload de imagen:', error)
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
      .from('media_assets')
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
      .from('media_assets')
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
    console.error('Error eliminando imagen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}