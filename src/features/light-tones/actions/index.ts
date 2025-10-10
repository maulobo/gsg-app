/**
 * Light Tone mutations (Server Actions)
 */

'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { LightToneInsert, LightToneUpdate } from '@/types/database'

export async function createLightTone(data: LightToneInsert) {
  const supabase = await createServerSupabaseClient()

  const { data: lightTone, error } = await supabase
    .from('light_tones')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/light-tones')
  return { data: lightTone }
}

export async function updateLightTone(id: number, data: LightToneUpdate) {
  const supabase = await createServerSupabaseClient()

  const { data: lightTone, error } = await supabase
    .from('light_tones')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/light-tones')
  return { data: lightTone }
}

export async function deleteLightTone(id: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('light_tones')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/light-tones')
  return { success: true }
}
