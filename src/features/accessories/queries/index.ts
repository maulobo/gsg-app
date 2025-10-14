import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { AccessoryWithRefs, AccessoryListItem } from '../types'

/**
 * Get all accessories with basic info (for lists)
 */
export async function getAccessories(): Promise<AccessoryListItem[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('accessories')
    .select(
      `
      id,
      code,
      name,
      photo_url,
      watt,
      voltage_label,
      created_at,
      accessory_light_tones ( light_tone:light_tones ( id, name ) ),
      accessory_finishes ( finish:finishes ( id, name ) )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAccessories error:', error)
    throw new Error(error.message)
  }

  return (data ?? []).map((a: any) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    photo_url: a.photo_url,
    watt: a.watt,
    voltage_label: a.voltage_label,
    light_tones: (a.accessory_light_tones || []).map((rel: any) => rel.light_tone),
    finishes: (a.accessory_finishes || []).map((rel: any) => rel.finish),
    created_at: a.created_at,
  }))
}

/**
 * Get a single accessory by code with all relations
 */
export async function getAccessoryByCode(code: string): Promise<AccessoryWithRefs | null> {
  if (!code) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('accessories')
    .select(`
      id,
      code,
      name,
      description,
      photo_url,
      watt,
      voltage_label,
      voltage_min,
      voltage_max,
      created_at,
      accessory_light_tones ( light_tone:light_tones ( id, slug, name, kelvin ) ),
      accessory_finishes ( finish:finishes ( id, slug, name ) ),
      accessory_media ( id, path, kind, alt_text )
    `)
    .eq('code', code)
    .single()

  if (error) {
    console.error('getAccessoryByCode error:', error)
    return null
  }

  return data as unknown as AccessoryWithRefs
}
