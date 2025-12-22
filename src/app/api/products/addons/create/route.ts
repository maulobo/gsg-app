import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { productId, addons } = await request.json()

    if (!productId || !Array.isArray(addons) || addons.length === 0) {
      return NextResponse.json(
        { error: 'productId y addons son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Preparar los addons para inserción
    const addonsToInsert = addons.map((addon, index) => ({
      product_id: productId,
      code: addon.code,
      name: addon.name,
      description: addon.description || null,
      category: addon.category,
      specs: addon.specs || {},
      stock_quantity: addon.stock_quantity || 0,
      display_order: index + 1,
      is_active: true,
      featured: false,
    }))

    const { data, error } = await supabase
      .from('product_addons')
      .insert(addonsToInsert)
      .select()

    if (error) {
      console.error('Error al crear addons:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ addons: data }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/products/addons/create:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
