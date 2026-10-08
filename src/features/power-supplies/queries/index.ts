import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PowerSupplyFull } from '../types'

const POWER_SUPPLY_SELECT = `
  *,
  power_supply_models ( * ),
  power_supply_media ( * )
`

function sortChildren(ps: PowerSupplyFull): PowerSupplyFull {
  return {
    ...ps,
    power_supply_models: [...(ps.power_supply_models || [])].sort(
      (a, b) => a.display_order - b.display_order || a.output_v - b.output_v
    ),
    power_supply_media: [...(ps.power_supply_media || [])].sort((a, b) => a.display_order - b.display_order),
  }
}

/**
 * Get all power supplies (incluye inactivas) con modelos y media
 */
export async function getPowerSupplies(): Promise<PowerSupplyFull[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('power_supplies')
    .select(POWER_SUPPLY_SELECT)
    .order('display_order', { ascending: true })
    .order('power_w', { ascending: true })

  if (error) {
    console.error('getPowerSupplies error:', error)
    throw new Error(error.message)
  }

  return ((data ?? []) as PowerSupplyFull[]).map(sortChildren)
}

/**
 * Get a single power supply by code
 */
export async function getPowerSupplyByCode(code: string): Promise<PowerSupplyFull | null> {
  if (!code) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('power_supplies')
    .select(POWER_SUPPLY_SELECT)
    .eq('code', code)
    .single()

  if (error) {
    console.error('getPowerSupplyByCode error:', error)
    return null
  }

  return sortChildren(data as PowerSupplyFull)
}
