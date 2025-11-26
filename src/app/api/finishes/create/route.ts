import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del acabado es requerido' },
        { status: 400 }
      )
    }

    // Generar slug desde el nombre
    const slug = name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/^-+|-+$/g, '') // Remover guiones al inicio/final

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('finishes')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un acabado con ese nombre', finish: existing },
        { status: 409 }
      )
    }

    // Crear el acabado usando admin client para evitar RLS
    const adminSupabase = createAdminSupabaseClient()
    const { data: finish, error } = await adminSupabase
      .from('finishes')
      .insert({
        name: name.trim(),
        slug,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating finish:', error)
      return NextResponse.json(
        { error: 'Error al crear el acabado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ finish }, { status: 201 })
  } catch (error) {
    console.error('Finish creation error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
