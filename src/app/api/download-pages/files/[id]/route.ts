import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { deleteFromR2, extractKeyFromUrl } from '@/lib/r2client'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const patchSchema = z.object({
  title: z.string().trim().min(1, 'El título no puede quedar vacío').optional(),
  display_order: z.number().int().min(0).optional(),
})

/**
 * PATCH /api/download-pages/files/[id]
 * Payload: { title?, display_order? }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { data: updated, error } = await supabase
      .from('download_files')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('PATCH /api/download-pages/files/[id] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/download-pages/files/[id]
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    const { data: file, error: fetchError } = await supabase
      .from('download_files')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    const key = extractKeyFromUrl(file.path)
    if (key) {
      try {
        await deleteFromR2(key)
      } catch (r2Error) {
        console.error('Error eliminando de R2:', r2Error)
      }
    }

    const { error: deleteError } = await supabase.from('download_files').delete().eq('id', id)
    if (deleteError) {
      return NextResponse.json({ error: 'Error eliminando de base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando descargable:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
