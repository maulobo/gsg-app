/**
 * Category queries
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Category } from '@/types/database'

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('getCategories error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getCategoryById error:', error)
    return null
  }

  return data
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('getCategoryBySlug error:', error)
    return null
  }

  return data
}
