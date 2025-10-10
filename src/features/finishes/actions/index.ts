/**
 * Finish mutations (Server Actions)
 */

'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { FinishInsert, FinishUpdate } from '@/types/database'

export async function createFinish(data: FinishInsert) {
  const supabase = await createServerSupabaseClient()

  const { data: finish, error } = await supabase
    .from('finishes')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/finishes')
  return { data: finish }
}

export async function updateFinish(id: number, data: FinishUpdate) {
  const supabase = await createServerSupabaseClient()

  const { data: finish, error } = await supabase
    .from('finishes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/finishes')
  return { data: finish }
}

export async function deleteFinish(id: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('finishes')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/finishes')
  return { success: true }
}
