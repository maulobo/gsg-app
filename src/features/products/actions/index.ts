/**
 * Product mutations (Server Actions)
 * These can be called from Client Components via form actions or transitions
 */

'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ProductInsert, ProductUpdate } from '@/types/database'

/**
 * Create a new product
 */
export async function createProduct(data: ProductInsert) {
  const supabase = await createServerSupabaseClient()

  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('createProduct error:', error)
    return { error: error.message }
  }

  revalidatePath('/products')
  return { data: product }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: number, data: ProductUpdate) {
  const supabase = await createServerSupabaseClient()

  const { data: product, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateProduct error:', error)
    return { error: error.message }
  }

  revalidatePath('/products')
  revalidatePath(`/products/${product.code}`)
  return { data: product }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteProduct error:', error)
    return { error: error.message }
  }

  revalidatePath('/products')
  redirect('/products')
}

/**
 * Toggle product featured status
 */
export async function toggleProductFeatured(id: number, isFeatured: boolean) {
  const supabase = await createServerSupabaseClient()

  const { data: product, error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('toggleProductFeatured error:', error)
    return { error: error.message }
  }

  revalidatePath('/products')
  return { data: product }
}
