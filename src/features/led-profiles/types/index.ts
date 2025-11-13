/**
 * LED Profiles - Type Definitions
 * 
 * Sistema de tipos para el catálogo de perfiles LED
 */

// ============================================
// Base Types from Database Schema
// ============================================

/**
 * Perfil LED (familia / ficha técnica)
 */
export interface LedProfile {
  id: number
  code: string                    // ej: P01
  name: string                    // ej: Perfil-01 P01
  description: string | null
  material: string | null         // ej: Aluminio 6061
  finish_surface: string | null   // ej: Anodizado
  max_w_per_m: number | null      // ej: 16 (W/m)
  use_cases: string | null        // texto libre (lista separada por ;)
  created_at: string
}

/**
 * Catálogo de difusores
 */
export interface LedDiffuser {
  id: number
  slug: string                    // 'opal' | 'transparente'
  name: string                    // 'Opal' | 'Transparente'
  material: string | null         // Material del difusor (PC, PMMA, etc.)
  uv_protection: boolean
}

/**
 * Relación Perfil <-> Difusor
 * (Campos de cantidad deprecados - ya no se usan en UI)
 */
export interface LedProfileDiffuser {
  profile_id: number
  diffuser_id: number
  notes: string | null            // ej: "recomendado para exterior"
}

/**
 * Relación Perfil <-> Terminación (acabado)
 */
export interface LedProfileFinish {
  profile_id: number
  finish_id: number
}

/**
 * Accesorios incluidos por metro (N:N)
 */
export interface LedProfileIncludedItem {
  profile_id: number
  accessory_id: number
  qty_per_m: number               // ej: Grampa x2/m
}

/**
 * Accesorios opcionales (N:N)
 */
export interface LedProfileOptionalItem {
  profile_id: number
  accessory_id: number
}

/**
 * Media (fotos del perfil)
 */
export interface LedProfileMedia {
  id: number
  profile_id: number
  path: string                    // URL / storage
  kind: 'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec'
  alt_text: string | null
  created_at: string
}

/**
 * Embeddings para RAG
 */
export interface LedProfileEmbedding {
  id: number
  profile_id: number
  content: string                 // texto consolidado
  embedding: number[] | string    // vector(1536)
}

// ============================================
// Extended Types for Frontend
// ============================================

/**
 * Difusor con info adicional del perfil
 */
export interface LedDiffuserWithInclusion extends LedDiffuser {
  notes: string | null
}

/**
 * Accesorio con cantidad por metro
 */
export interface LedAccessoryWithQty {
  id: number
  code: string
  name: string
  description: string | null
  qty_per_m: number
}

/**
 * Terminación (finish) del catálogo global
 */
export interface LedFinish {
  id: number
  name: string
  slug: string
  hex_color: string | null
}

/**
 * Perfil LED completo con todas sus relaciones
 */
export interface LedProfileFull extends LedProfile {
  diffusers: LedDiffuserWithInclusion[]
  finishes: LedFinish[]
  included_items: LedAccessoryWithQty[]
  optional_items: {
    id: number
    code: string
    name: string
    description: string | null
  }[]
  media: LedProfileMedia[]
}

/**
 * Vista resumida para listados
 */
export interface LedProfileListItem {
  id: number
  code: string
  name: string
  description: string | null
  material: string | null
  max_w_per_m: number | null
  diffusers_count: number
  finishes_count: number
  cover_image: string | null
}

// ============================================
// Form Types
// ============================================

/**
 * Form data para crear/editar perfil LED
 */
export interface LedProfileFormData {
  code: string
  name: string
  description?: string | null
  material?: string | null
  finish_surface?: string | null
  max_w_per_m?: number | null
  use_cases?: string | null
}

/**
 * Form data para relación perfil-difusor
 */
export interface LedProfileDiffuserFormData {
  diffuser_id: number
  // Estos campos quedan opcionales y deprecados en el UI
  included_by_m?: number
  included_qty_per_m?: number
  notes?: string | null
}

/**
 * Form data para item incluido
 */
export interface LedProfileIncludedItemFormData {
  accessory_id: number
  qty_per_m: number
}

/**
 * Form data para media
 */
export interface LedProfileMediaFormData {
  path: string
  kind: 'cover' | 'gallery' | 'tech' | 'accessory'
  alt_text?: string | null
}

// ============================================
// API Response Types
// ============================================

/**
 * Response de creación/actualización de perfil
 */
export interface LedProfileResponse {
  success: boolean
  data?: LedProfileFull
  error?: string
}

/**
 * Response de listado de perfiles
 */
export interface LedProfileListResponse {
  success: boolean
  data?: LedProfileListItem[]
  total?: number
  error?: string
}

/**
 * Response de difusores disponibles
 */
export interface LedDiffusersResponse {
  success: boolean
  data?: LedDiffuser[]
  error?: string
}

// ============================================
// Filter & Search Types
// ============================================

/**
 * Filtros para búsqueda de perfiles
 */
export interface LedProfileFilters {
  search?: string                 // búsqueda en code/name/description
  material?: string
  min_w_per_m?: number
  max_w_per_m?: number
  diffuser_id?: number
  finish_id?: number
  has_uv_protection?: boolean
}

/**
 * Parámetros de paginación
 */
export interface LedProfilePaginationParams {
  page?: number
  limit?: number
  sort_by?: 'code' | 'name' | 'created_at' | 'max_w_per_m'
  sort_order?: 'asc' | 'desc'
}

// ============================================
// Utility Types
// ============================================

/**
 * Tipos de media disponibles
 */
export type LedMediaKind = 'cover' | 'gallery' | 'tech' | 'accessory'

/**
 * Slugs de difusores comunes
 */
export type LedDiffuserSlug = 'opal' | 'transparente' | string

/**
 * Materiales de difusor
 */
export type LedDiffuserMaterial = 'PC' | 'PVC' | string

/**
 * Materiales de perfil
 */
export type LedProfileMaterial = 'Aluminio 6061' | 'Aluminio' | string

/**
 * Tipos de acabado de superficie
 */
export type LedFinishSurface = 'Anodizado' | 'Pintado' | 'Natural' | string
