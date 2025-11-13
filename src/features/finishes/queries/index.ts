/**
 * Finish queries
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Finish } from '@/types/database'

/**
 * Get all finishes
 */
export async function getFinishes(): Promise<Finish[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('finishes')
    .select('*')
    .order('name')

  if (error) {
    console.error('getFinishes error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Get finish by ID
 */
export async function getFinishById(id: number): Promise<Finish | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('finishes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getFinishById error:', error)
    return null
  }

  return data
}

/**
 * Update finish
 */
export async function updateFinish(id: number, updates: Partial<Finish>): Promise<Finish> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('finishes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateFinish error:', error)
    throw new Error(error.message)
  }

  return data
}
