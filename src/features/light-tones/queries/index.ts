/**
 * Light Tone queries
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { LightTone } from '@/types/database'

export async function getLightTones(): Promise<LightTone[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('light_tones')
    .select('*')
    .order('kelvin')

  if (error) {
    console.error('getLightTones error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getLightToneById(id: number): Promise<LightTone | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('light_tones')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getLightToneById error:', error)
    return null
  }

  return data
}
