import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

// El slug NO se puede cambiar: está impreso en los QR
const updateSchema = z.object({
  title: z.string().trim().min(1, 'Falta el título'),
  description: z.string().nullish(),
  is_active: z.boolean(),
})

/**
 * GET /api/download-pages/[slug]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('download_pages')
      .select('*, download_files ( * )')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('GET /api/download-pages/[slug] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/download-pages/[slug]
 * Actualiza título, descripción y estado. Cualquier `slug` del body se ignora.
 *
 * Payload: { title, description, is_active }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    const { title, description, is_active } = parsed.data

    const supabase = createAdminSupabaseClient()
    const { data: updated, error } = await supabase
      .from('download_pages')
      .update({
        title,
        description: description?.trim() || null,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating download page:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('PUT /api/download-pages/[slug] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
