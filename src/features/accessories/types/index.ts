/**
 * Accessory feature types - Modelo con relaciones N:N
 */

export const ACCESSORY_TYPES = [
  'Amplificadores',
  'Controladoras',
  'Dimmers',
  'Conectores',
  'Sensores',
] as const

export type AccessorySpecs = {
  power?: { '12v_w'?: number; '24v_w'?: number }
  amperage?: { '12v_a'?: number; '24v_a'?: number }
  power_12v_raw?: string
  power_24v_raw?: string
  amperage_12v_raw?: string
  amperage_24v_raw?: string
  reach_or_total?: string
  led_type?: string
  notes?: string
  signal_type?: string
  [key: string]: any
}

// ---- DB base ----
export type Accessory = {
  id: number
  code: string
  name: string
  description: string | null
  photo_url: string | null
  tipo: string | null
  amperage: number | null
  watt: number | null
  voltage_label: string | null
  voltage_min: number | null
  voltage_max: number | null
  specs: AccessorySpecs | null
  notes: string | null
  created_at: string // ISO
}

// Para crear (INSERT)
export type AccessoryInsert = {
  code: string
  name: string
  description?: string | null
  photo_url?: string | null
  tipo?: string | null
  amperage?: number | null
  watt?: number | null
  voltage_label?: string | null
  voltage_min?: number | null
  voltage_max?: number | null
  specs?: AccessorySpecs | null
  notes?: string | null
}

// Relaciones N:N
export type AccessoryLightToneInsert = {
  accessory_id: number
  light_tone_id: number
}

export type AccessoryFinishInsert = {
  accessory_id: number
  finish_id: number
}

// Media técnica opcional
export type AccessoryMediaInsert = {
  accessory_id: number
  path: string // URL o storage public URL
  kind: 'tech' | 'datasheet'
  alt_text?: string | null
}

// Media asset type (DB result)
export type AccessoryMedia = {
  id: number
  accessory_id: number
  path: string
  kind: 'tech' | 'datasheet'
  alt_text: string | null
  created_at: string
}

// Para pintar en el dashboard (con joins)
export type AccessoryWithRefs = Accessory & {
  accessory_light_tones: { light_tone: { id: number; slug: string; name: string; kelvin: number | null } }[]
  accessory_finishes: { finish: { id: number; slug: string; name: string } }[]
  accessory_media: { id: number; path: string; kind: 'tech' | 'datasheet'; alt_text: string | null }[]
}

// List item for tables (simplified view)
export type AccessoryListItem = {
  id: number
  code: string
  name: string
  photo_url: string | null
  tipo: string | null
  amperage: number | null
  watt: number | null
  voltage_label: string | null
  specs: AccessorySpecs | null
  notes: string | null
  light_tones: { id: number; name: string }[]
  finishes: { id: number; name: string }[]
  created_at: string
  has_photo: boolean
  has_tech: boolean
  has_pdf: boolean
}

// Update (parcial)
export type AccessoryUpdate = Partial<AccessoryInsert>
