import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { isValidSlug } from '@/features/download-pages/slug'

const createSchema = z.object({
  slug: z.string().trim().refine(isValidSlug, 'La dirección solo puede tener minúsculas, números y guiones'),
  title: z.string().trim().min(1, 'Falta el título'),
  description: z.string().nullish(),
  is_active: z.boolean().optional(),
})

/**
 * GET /api/download-pages
 * Lista todas las páginas de descargas con sus PDFs
 */
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('download_pages')
      .select('*, download_files ( * )')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('GET /api/download-pages error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/download-pages
 * Crea una página de descargas
 *
 * Payload: { slug, title, description?, is_active? }
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    const { slug, title, description, is_active } = parsed.data

    const supabase = createAdminSupabaseClient()
    const { data: created, error } = await supabase
      .from('download_pages')
      .insert({
        slug,
        title,
        description: description?.trim() || null,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Esa dirección ya existe' }, { status: 409 })
      }
      console.error('Error creating download page:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/download-pages error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
