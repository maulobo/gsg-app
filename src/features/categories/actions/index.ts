/**
 * Category mutations (Server Actions)
 */

'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { CategoryInsert, CategoryUpdate } from '@/types/database'

/**
 * Create a new category
 */
export async function createCategory(data: CategoryInsert) {
  const supabase = await createServerSupabaseClient()

  const { data: category, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('createCategory error:', error)
    return { error: error.message }
  }

  revalidatePath('/categories')
  return { data: category }
}

/**
 * Update an existing category
 */
export async function updateCategory(id: number, data: CategoryUpdate) {
  const supabase = await createServerSupabaseClient()

  const { data: category, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateCategory error:', error)
    return { error: error.message }
  }

  revalidatePath('/categories')
  return { data: category }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteCategory error:', error)
    return { error: error.message }
  }

  revalidatePath('/categories')
  return { success: true }
}
