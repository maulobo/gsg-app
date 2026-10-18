import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2, fileToBuffer, deleteFromR2, extractKeyFromUrl } from '@/lib/r2client'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { titleFromFilename } from '@/features/download-pages/slug'

const MAX_PDF_BYTES = 10 * 1024 * 1024

/**
 * POST /api/download-pages/files/upload
 * Sube un PDF a R2 y lo agrega al final de la página
 *
 * multipart: file (PDF), slug, title?
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const slug = formData.get('slug') as string | null
    const title = ((formData.get('title') as string) || '').trim()

    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }
    if (!slug) {
      return NextResponse.json({ error: 'slug es requerido' }, { status: 400 })
    }

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPDF) {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'El PDF no debe superar 10MB' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: page, error: fetchError } = await supabase
      .from('download_pages')
      .select('id')
      .eq('slug', slug)
      .single()

    if (fetchError || !page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const key = `download-pages/${slug}/${timestamp}-${randomId}.pdf`
    const url = await uploadToR2(key, await fileToBuffer(file), 'application/pdf')

    const { count } = await supabase
      .from('download_files')
      .select('id', { count: 'exact', head: true })
      .eq('download_page_id', page.id)

    const { data: created, error: dbError } = await supabase
      .from('download_files')
      .insert({
        download_page_id: page.id,
        title: title || titleFromFilename(file.name) || 'Documento',
        path: url,
        size_bytes: file.size,
        display_order: count ?? 0,
      })
      .select()
      .single()

    if (dbError) {
      const uploadedKey = extractKeyFromUrl(url)
      if (uploadedKey) {
        try {
          await deleteFromR2(uploadedKey)
        } catch (e) {
          console.error('Error eliminando archivo de R2:', e)
        }
      }
      return NextResponse.json({ error: 'Error guardando archivo en base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: created })
  } catch (error) {
    console.error('Error en upload de descargable:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
