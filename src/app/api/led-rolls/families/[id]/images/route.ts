import { NextRequest, NextResponse } from 'next/server'
import {
  uploadToR2,
  processProductImage,
  validateImageFile,
  fileToBuffer,
  deleteFromR2,
  extractKeyFromUrl,
} from '@/lib/r2client'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const familyId = parseInt(id, 10)
    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const kind = (formData.get('kind') as string) || 'cover'
    const altText = (formData.get('altText') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    // Validate and process file
    const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const folder = `led-rolls/family-${familyId}/${kind}`

    let optimizedBuffer: Buffer
    let contentType: string
    let fileName: string

    if (isPDF) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'El PDF no debe superar 10MB' }, { status: 400 })
      }
      optimizedBuffer = await fileToBuffer(file)
      contentType = 'application/pdf'
      fileName = `${folder}/${timestamp}-${randomId}.pdf`
    } else {
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      const fileBuffer = await fileToBuffer(file)
      const processed = await processProductImage(fileBuffer, kind === 'tech' ? 'tech' : 'cover')
      optimizedBuffer = processed.optimizedBuffer
      contentType = processed.contentType
      fileName = `${folder}/${timestamp}-${randomId}.webp`
    }

    // Upload to R2
    const imageUrl = await uploadToR2(fileName, optimizedBuffer, contentType)

    const supabase = createAdminSupabaseClient()

    // For cover and tech kinds, replace existing media of the same kind
    if (kind === 'cover' || kind === 'tech') {
      const { data: existing } = await supabase
        .from('led_roll_family_media')
        .select('id, path')
        .eq('family_id', familyId)
        .eq('kind', kind)

      if (existing && existing.length > 0) {
        // Delete old files from R2
        for (const old of existing) {
          const key = extractKeyFromUrl(old.path)
          if (key) {
            try {
              await deleteFromR2(key)
            } catch {
              // continue even if R2 delete fails
            }
          }
        }
        // Delete old records from DB
        await supabase
          .from('led_roll_family_media')
          .delete()
          .eq('family_id', familyId)
          .eq('kind', kind)
      }
    }

    // Insert new media record
    const { data: media, error: dbError } = await supabase
      .from('led_roll_family_media')
      .insert({
        family_id: familyId,
        path: imageUrl,
        kind: kind as 'cover' | 'gallery' | 'tech' | 'video',
        alt_text: altText || null,
      })
      .select()
      .single()

    if (dbError) {
      // Rollback R2 upload
      const key = extractKeyFromUrl(imageUrl)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch {
          // ignore
        }
      }
      return NextResponse.json(
        { error: 'Error guardando imagen en base de datos', details: dbError },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, media, url: imageUrl }, { status: 201 })
  } catch (error) {
    console.error('Error uploading family image:', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const familyId = parseInt(id, 10)
    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId es requerido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: media, error: fetchError } = await supabase
      .from('led_roll_family_media')
      .select('path')
      .eq('id', parseInt(mediaId))
      .eq('family_id', familyId)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
    }

    // Delete from R2
    const key = extractKeyFromUrl(media.path)
    if (key) {
      try {
        await deleteFromR2(key)
      } catch {
        // continue
      }
    }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from('led_roll_family_media')
      .delete()
      .eq('id', parseInt(mediaId))

    if (deleteError) {
      return NextResponse.json({ error: 'Error eliminando imagen' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting family image:', error)
    return NextResponse.json({ error: 'Error al eliminar la imagen' }, { status: 500 })
  }
}
