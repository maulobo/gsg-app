/**
 * Fuentes LED (power supplies) - Familia → modelos por voltaje de salida
 */

export const POWER_SUPPLY_SERIES = ['Ultra Slim', 'Slim'] as const

export type PowerSupplyMediaKind = 'gallery' | 'tech' | 'datasheet'

// ---- DB base ----
export type PowerSupply = {
  id: number
  code: string
  name: string
  series: string | null
  description: string | null
  power_w: number | null
  ip_rating: string | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  warranty_years: number | null
  connection: string | null
  dimmable: boolean
  dimming_notes: string | null
  notes: string | null
  photo_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PowerSupplyModel = {
  id: number
  power_supply_id: number
  code: string
  input_v_min: number | null
  input_v_max: number | null
  input_label: string | null
  output_v: number
  current_a: number | null
  display_order: number
}

export type PowerSupplyMedia = {
  id: number
  power_supply_id: number
  path: string
  kind: PowerSupplyMediaKind
  alt_text: string | null
  display_order: number
}

export type PowerSupplyFull = PowerSupply & {
  power_supply_models: PowerSupplyModel[]
  power_supply_media: PowerSupplyMedia[]
}

// ---- Payloads ----
export type PowerSupplyInput = Omit<PowerSupply, 'id' | 'created_at' | 'updated_at'>

export type PowerSupplyModelInput = Omit<PowerSupplyModel, 'id' | 'power_supply_id' | 'display_order'> & {
  display_order?: number
}

export type PowerSupplyPayload = {
  power_supply: PowerSupplyInput
  models: PowerSupplyModelInput[]
}
