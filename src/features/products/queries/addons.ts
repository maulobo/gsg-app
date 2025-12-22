/**
 * Product Addons - Database Queries
 * Funciones para manejar addons/complementos específicos de productos
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'

export type ProductAddon = {
  id: number
  product_id: number
  code: string
  name: string
  description: string | null
  category: 'control' | 'installation' | 'accessory' | 'driver'
  specs: Record<string, any>
  price: number | null
  stock_quantity: number
  display_order: number
  is_active: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

/**
 * Obtener todos los addons de un producto
 */
export async function getProductAddons(productId: number): Promise<ProductAddon[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('product_addons')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching product addons:', error)
    return []
  }
  
  return data as ProductAddon[]
}

/**
 * Crear un addon
 */
export async function createProductAddon(addon: Omit<ProductAddon, 'id' | 'created_at' | 'updated_at'>): Promise<ProductAddon | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('product_addons')
    .insert(addon)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating product addon:', error)
    return null
  }
  
  return data
}

/**
 * Actualizar un addon
 */
export async function updateProductAddon(
  id: number,
  updates: Partial<Omit<ProductAddon, 'id' | 'created_at' | 'updated_at'>>
): Promise<ProductAddon | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('product_addons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating product addon:', error)
    return null
  }
  
  return data
}

/**
 * Eliminar un addon (soft delete)
 */
export async function deleteProductAddon(id: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('product_addons')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting product addon:', error)
    return false
  }
  
  return true
}
