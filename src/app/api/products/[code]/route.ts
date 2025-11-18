import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { deleteFromR2, extractKeyFromUrl } from '@/lib/r2client'

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

    // 1. Validar que el producto existe
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

    // 2. Obtener todas las imágenes del producto (de todas las variantes)
    const { data: mediaAssets, error: mediaError } = await supabase
      .from('media_assets')
      .select('id, path')
      .eq('product_id', existingProduct.id)

    // 3. Eliminar imágenes de R2
    if (mediaAssets && mediaAssets.length > 0) {
      for (const asset of mediaAssets) {
        const key = extractKeyFromUrl(asset.path)
        if (key) {
          try {
            await deleteFromR2(key)
          } catch (r2Error) {
            console.error(`Error eliminando imagen de R2: ${key}`, r2Error)
          }
        }
      }
    }

    // 4. Eliminar el producto de la base de datos
    // (las cascadas eliminarán: variants, configurations, media_assets, etc.)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('code', code)

    if (deleteError) {
      console.error('Error eliminando producto de DB:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el producto de la base de datos' },
        { status: 500 }
      )
    }

    console.log(`✅ Producto ${code} eliminado completamente (DB + R2)`)

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      deletedImages: mediaAssets?.length || 0,
    })
  } catch (error) {
    console.error('Error en DELETE /api/products/[code]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
