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

/**
 * POST /api/power-supplies/images/upload
 * Sube archivos de fuentes a R2 y guarda en DB
 *
 * - kind='cover'     → power_supplies.photo_url (imagen principal, reemplaza la anterior)
 * - kind='gallery'   → power_supply_media (imagen adicional)
 * - kind='tech'      → power_supply_media (imagen técnica, ej. diagrama DIP)
 * - kind='datasheet' → power_supply_media (ficha técnica PDF)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const code = formData.get('powerSupplyCode') as string
    const kind = ((formData.get('kind') as string) || 'cover') as 'cover' | 'gallery' | 'tech' | 'datasheet'
    const altText = (formData.get('altText') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }
    if (!code) {
      return NextResponse.json({ error: 'powerSupplyCode es requerido' }, { status: 400 })
    }
    if (!['cover', 'gallery', 'tech', 'datasheet'].includes(kind)) {
      return NextResponse.json({ error: 'kind inválido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: ps, error: fetchError } = await supabase
      .from('power_supplies')
      .select('id, photo_url')
      .eq('code', code)
      .single()

    if (fetchError || !ps) {
      return NextResponse.json({ error: 'Fuente no encontrada' }, { status: 404 })
    }

    const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const folder = `power-supplies/${code}`

    let buffer: Buffer
    let contentType: string
    let fileName: string

    if (isPDF) {
      if (kind !== 'datasheet') {
        return NextResponse.json({ error: 'Solo se aceptan PDF como ficha técnica' }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'El PDF no debe superar 10MB' }, { status: 400 })
      }
      buffer = await fileToBuffer(file)
      contentType = 'application/pdf'
      fileName = `${folder}/${kind}/${timestamp}-${randomId}.pdf`
    } else {
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      const processed = await processProductImage(
        await fileToBuffer(file),
        kind === 'cover' ? 'gallery' : kind === 'tech' ? 'tech' : 'gallery'
      )
      buffer = processed.optimizedBuffer
      contentType = processed.contentType
      fileName = `${folder}/${kind}/${timestamp}-${randomId}.webp`
    }

    const url = await uploadToR2(fileName, buffer, contentType)

    const rollback = async () => {
      const key = extractKeyFromUrl(url)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch (e) {
          console.error('Error eliminando archivo de R2:', e)
        }
      }
    }

    if (kind === 'cover') {
      const { error: updateError } = await supabase.from('power_supplies').update({ photo_url: url }).eq('id', ps.id)
      if (updateError) {
        await rollback()
        return NextResponse.json({ error: 'Error guardando imagen en base de datos' }, { status: 500 })
      }
      // Borrar la portada anterior de R2
      const oldKey = ps.photo_url ? extractKeyFromUrl(ps.photo_url) : null
      if (oldKey) {
        try {
          await deleteFromR2(oldKey)
        } catch (e) {
          console.error('Error eliminando portada anterior de R2:', e)
        }
      }
      return NextResponse.json({ success: true, url })
    }

    const { count } = await supabase
      .from('power_supply_media')
      .select('id', { count: 'exact', head: true })
      .eq('power_supply_id', ps.id)

    const { data: media, error: dbError } = await supabase
      .from('power_supply_media')
      .insert({
        power_supply_id: ps.id,
        path: url,
        kind,
        alt_text: altText || null,
        display_order: count ?? 0,
      })
      .select()
      .single()

    if (dbError) {
      await rollback()
      return NextResponse.json({ error: 'Error guardando archivo en base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url, media })
  } catch (error) {
    console.error('Error en upload de fuente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/power-supplies/images/upload?mediaId=123
 */
export async function DELETE(request: NextRequest) {
  try {
    const mediaId = new URL(request.url).searchParams.get('mediaId')
    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId es requerido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: media, error: fetchError } = await supabase
      .from('power_supply_media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    const key = extractKeyFromUrl(media.path)
    if (key) {
      try {
        await deleteFromR2(key)
      } catch (r2Error) {
        console.error('Error eliminando de R2:', r2Error)
      }
    }

    const { error: deleteError } = await supabase.from('power_supply_media').delete().eq('id', mediaId)
    if (deleteError) {
      return NextResponse.json({ error: 'Error eliminando de base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando archivo de fuente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
