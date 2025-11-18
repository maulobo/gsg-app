/**
 * LED Rolls - Type Definitions
 * 
 * Sistema de tipos para el catálogo de rollos/tiras LED
 */

// ============================================
// Base Types (from Database)
// ============================================

/**
 * Rollo LED (familia)
 */
export interface LedRoll {
  id: number
  code: string
  name: string
  description: string | null

  typology: string | null
  color_control: string | null

  cri_min: number | null
  voltage_v: number | null
  ip_rating: string | null
  dimmable: boolean
  dynamic_effects: string | null

  cut_step_mm_min: number | null
  cut_step_mm_max: number | null
  width_mm_min: number | null
  width_mm_max: number | null

  eff_lm_per_w_min: number | null
  eff_lm_per_w_max: number | null
  flux_lm_per_m_min: number | null
  flux_lm_per_m_max: number | null

  leds_per_m_min: number | null
  leds_per_m_max: number | null

  roll_length_m: number | null
  warranty_years: number | null
  packaging: string | null

  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Modelo/SKU de rollo LED
 */
export interface LedRollModel {
  id: number
  roll_id: number
  sku: string
  name: string | null
  description: string | null

  watt_per_m: number
  leds_per_m: number
  luminous_efficacy_lm_w: number | null
  luminous_flux_per_m_lm: number | null

  cut_step_mm: number | null
  width_mm: number | null

  ip_rating: string | null
  voltage_v: number | null
  dimmable: boolean | null
  cri: number | null

  color_mode: string
  light_tone_id: number | null
  cct_min_k: number | null
  cct_max_k: number | null

  price: number | null
  stock: number

  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Media de rollos LED
 */
export interface LedRollMedia {
  id: number
  roll_id: number
  path: string
  kind: 'cover' | 'gallery' | 'tech' | 'datasheet' | 'installation'
  alt_text: string | null
  display_order: number
  created_at: string
}

/**
 * Embeddings para RAG
 */
export interface LedRollEmbedding {
  id: number
  roll_id: number
  content: string
  embedding: number[] | string
}

// ============================================
// Extended Types (con relaciones)
// ============================================

/**
 * Modelo con información del light tone
 */
export interface LedRollModelWithTone extends LedRollModel {
  light_tone?: {
    id: number
    name: string
    slug: string
    kelvin: number | null
  }
}

/**
 * Modelo con múltiples tonos de luz (nueva estructura)
 */
export interface LedRollModelWithTones extends Omit<LedRollModel, 'light_tone_id'> {
  light_tones?: Array<{
    id: number
    name: string
    slug: string
    kelvin: number | null
  }>
}

/**
 * Rollo con sus modelos y media
 */
export interface LedRollFull extends LedRoll {
  models: LedRollModelWithTones[]
  media: LedRollMedia[]
}

/**
 * Vista resumida para listados
 */
export interface LedRollListItem {
  id: number
  code: string
  name: string
  description: string | null
  typology: string | null
  color_control: string | null
  models_count: number
  cover_image: string | null
}

// ============================================
// Form Types
// ============================================

/**
 * Form data para crear/editar rollo LED
 */
export interface LedRollFormData {
  code: string
  name: string
  description?: string | null
  typology?: string | null
  color_control?: string | null
  cri_min?: number | null
  voltage_v?: number | null
  ip_rating?: string | null
  dimmable?: boolean
  dynamic_effects?: string | null
  cut_step_mm_min?: number | null
  cut_step_mm_max?: number | null
  width_mm_min?: number | null
  width_mm_max?: number | null
  eff_lm_per_w_min?: number | null
  eff_lm_per_w_max?: number | null
  flux_lm_per_m_min?: number | null
  flux_lm_per_m_max?: number | null
  leds_per_m_min?: number | null
  leds_per_m_max?: number | null
  roll_length_m?: number | null
  warranty_years?: number | null
  packaging?: string | null
}

/**
 * Form data para crear/editar modelo
 */
export interface LedRollModelFormData {
  roll_id: number
  sku: string
  name?: string | null
  description?: string | null
  watt_per_m: number
  leds_per_m: number
  luminous_efficacy_lm_w?: number | null
  luminous_flux_per_m_lm?: number | null
  cut_step_mm?: number | null
  width_mm?: number | null
  ip_rating?: string | null
  voltage_v?: number | null
  dimmable?: boolean | null
  cri?: number | null
  color_mode: 'mono' | 'cct' | 'rgb' | 'rgb_pixel'
  light_tone_id?: number | null // Deprecado: usar light_tone_ids
  light_tone_ids?: number[] // Nuevo: array de IDs de tonos de luz
  cct_min_k?: number | null
  cct_max_k?: number | null
  price?: number | null
  stock?: number
}

/**
 * Form data para media
 */
export interface LedRollMediaFormData {
  path: string
  kind: 'cover' | 'gallery' | 'tech' | 'datasheet' | 'installation'
  alt_text?: string | null
}

// ============================================
// Filter & Search Types
// ============================================

/**
 * Filtros para búsqueda de rollos
 */
export interface LedRollFilters {
  search?: string
  typology?: string
  color_control?: string
  min_watt?: number
  max_watt?: number
  voltage?: number
  ip_rating?: string
}

/**
 * Parámetros de paginación
 */
export interface LedRollPaginationParams {
  page?: number
  limit?: number
  sort_by?: 'code' | 'name' | 'created_at'
  sort_order?: 'asc' | 'desc'
}
