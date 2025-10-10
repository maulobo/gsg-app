import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const resolvedParams = await params
    const { code } = resolvedParams
    const body = await request.json()

    const supabase = await createServerSupabaseClient()

    // Validar que el producto existe
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('code', code)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el producto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        name: body.name,
        description: body.description || null,
        is_featured: body.is_featured || false,
        // category_id se puede agregar después si se necesita
      })
      .eq('code', code)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando producto:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el producto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Error en PATCH /api/products/[code]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const resolvedParams = await params
    const { code } = resolvedParams

    const supabase = await createServerSupabaseClient()

    // Validar que el producto existe
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('code', code)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el producto (las cascadas deberían manejar las relaciones)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('code', code)

    if (deleteError) {
      console.error('Error eliminando producto:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el producto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/products/[code]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
