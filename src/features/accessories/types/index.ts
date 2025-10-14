/**
 * Accessory feature types - Modelo con relaciones N:N
 */

// ---- DB base ----
export type Accessory = {
  id: number
  code: string
  name: string
  description: string | null
  photo_url: string | null
  watt: number | null
  voltage_label: string | null
  voltage_min: number | null
  voltage_max: number | null
  created_at: string // ISO
}

// Para crear (INSERT)
export type AccessoryInsert = {
  code: string
  name: string
  description?: string | null
  photo_url?: string | null
  watt?: number | null
  voltage_label?: string | null
  voltage_min?: number | null
  voltage_max?: number | null
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
  kind: 'tech'
  alt_text?: string | null
}

// Media asset type (DB result)
export type AccessoryMedia = {
  id: number
  accessory_id: number
  path: string
  kind: 'tech'
  alt_text: string | null
  created_at: string
}

// Para pintar en el dashboard (con joins)
export type AccessoryWithRefs = Accessory & {
  accessory_light_tones: { light_tone: { id: number; slug: string; name: string; kelvin: number | null } }[]
  accessory_finishes: { finish: { id: number; slug: string; name: string } }[]
  accessory_media: { id: number; path: string; kind: 'tech'; alt_text: string | null }[]
}

// List item for tables (simplified view)
export type AccessoryListItem = {
  id: number
  code: string
  name: string
  photo_url: string | null
  watt: number | null
  voltage_label: string | null
  light_tones: { id: number; name: string }[]
  finishes: { id: number; name: string }[]
  created_at: string
}

// Update (parcial)
export type AccessoryUpdate = Partial<AccessoryInsert>
