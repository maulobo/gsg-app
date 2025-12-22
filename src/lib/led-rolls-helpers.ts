import { supabase as browserSupabase } from './supabase'
import { createServerSupabaseClient } from './supabase-server'
import type { 
  LedRollFamily, 
  LedRoll, 
  LedRollFamilyMedia, 
  LedRollMedia 
} from '@/types/database'

// Tipo extendido con relaciones para el frontend
export type LedRollFamilyWithRelations = LedRollFamily & {
  variants: LedRoll[]
  media: LedRollFamilyMedia[]
}

export type LedRollWithMedia = LedRoll & {
  family?: LedRollFamily
  media?: LedRollMedia[]
}

export type LedRollFamilyWithEverything = LedRollFamily & {
  variants: LedRollWithMedia[]
  media: LedRollFamilyMedia[]
}

/**
 * Obtiene todas las familias de LED rolls con sus variantes
 * Para usar en el servidor (Server Components)
 */
export async function getAllLedRollFamiliesServer(): Promise<LedRollFamilyWithRelations[]> {
  const supabase = await createServerSupabaseClient()

  const { data: families, error } = await supabase
    .from('led_roll_families')
    .select(`
      *,
      variants:led_rolls(*),
      media:led_roll_family_media(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching LED roll families:', error)
    return []
  }

  return families as LedRollFamilyWithRelations[]
}

/**
 * Obtiene todas las familias de LED rolls con sus variantes
 * Para usar en el cliente (Client Components)
 */
export async function getAllLedRollFamiliesClient(): Promise<LedRollFamilyWithRelations[]> {
  const supabase = browserSupabase

  const { data: families, error } = await supabase
    .from('led_roll_families')
    .select(`
      *,
      variants:led_rolls(*),
      media:led_roll_family_media(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching LED roll families:', error)
    return []
  }

  return families as LedRollFamilyWithRelations[]
}

/**
 * Obtiene una familia específica con todas sus variantes y media
 */
export async function getLedRollFamilyByIdServer(familyId: number): Promise<LedRollFamilyWithEverything | null> {
  const supabase = await createServerSupabaseClient()

  const { data: family, error } = await supabase
    .from('led_roll_families')
    .select(`
      *,
      variants:led_rolls(
        *,
        media:led_roll_media(*)
      ),
      media:led_roll_family_media(*)
    `)
    .eq('id', familyId)
    .single()

  if (error) {
    console.error('Error fetching LED roll family:', error)
    return null
  }

  return family as LedRollFamilyWithEverything
}

/**
 * Obtiene todas las variantes activas con información de su familia
 */
export async function getAllLedRollVariantsServer(): Promise<LedRollWithMedia[]> {
  const supabase = await createServerSupabaseClient()

  const { data: variants, error } = await supabase
    .from('led_rolls')
    .select(`
      *,
      family:led_roll_families(*),
      media:led_roll_media(*)
    `)
    .eq('is_active', true)
    .order('code', { ascending: true })

  if (error) {
    console.error('Error fetching LED roll variants:', error)
    return []
  }

  return variants as LedRollWithMedia[]
}

/**
 * Obtiene una variante específica por código (SKU)
 */
export async function getLedRollVariantByCodeServer(code: string): Promise<LedRollWithMedia | null> {
  const supabase = await createServerSupabaseClient()

  const { data: variant, error } = await supabase
    .from('led_rolls')
    .select(`
      *,
      family:led_roll_families(*),
      media:led_roll_media(*)
    `)
    .eq('code', code)
    .single()

  if (error) {
    console.error('Error fetching LED roll variant:', error)
    return null
  }

  return variant as LedRollWithMedia
}

/**
 * Filtra familias por características
 */
export function filterLedRollFamilies(
  families: LedRollFamilyWithRelations[],
  filters: {
    ledType?: string
    minCri?: number
    minPcbWidth?: number
    maxPcbWidth?: number
    dimmable?: boolean
  }
): LedRollFamilyWithRelations[] {
  return families.filter(family => {
    if (filters.ledType && family.led_type !== filters.ledType) return false
    if (filters.minCri && (family.cri || 0) < filters.minCri) return false
    if (filters.minPcbWidth && (family.pcb_width_mm || 0) < filters.minPcbWidth) return false
    if (filters.maxPcbWidth && (family.pcb_width_mm || 0) > filters.maxPcbWidth) return false
    if (filters.dimmable !== undefined && family.dimmable !== filters.dimmable) return false
    return true
  })
}

/**
 * Filtra variantes por características
 */
export function filterLedRollVariants(
  variants: LedRollWithMedia[],
  filters: {
    minWatts?: number
    maxWatts?: number
    minLumens?: number
    voltage?: number
    ipRating?: number
    toneLabel?: string
    kelvinRange?: { min: number; max: number }
  }
): LedRollWithMedia[] {
  return variants.filter(variant => {
    if (filters.minWatts && variant.watts_per_meter < filters.minWatts) return false
    if (filters.maxWatts && variant.watts_per_meter > filters.maxWatts) return false
    if (filters.minLumens && (variant.lumens_per_meter || 0) < filters.minLumens) return false
    if (filters.voltage && variant.voltage !== filters.voltage) return false
    if (filters.ipRating && variant.ip_rating !== filters.ipRating) return false
    if (filters.toneLabel && variant.tone_label && !variant.tone_label.includes(filters.toneLabel)) return false
    if (filters.kelvinRange && variant.kelvin) {
      if (variant.kelvin < filters.kelvinRange.min || variant.kelvin > filters.kelvinRange.max) {
        return false
      }
    }
    return true
  })
}

/**
 * Agrupa variantes por familia
 */
export function groupVariantsByFamily(variants: LedRollWithMedia[]): Map<number, LedRollWithMedia[]> {
  const grouped = new Map<number, LedRollWithMedia[]>()
  
  variants.forEach(variant => {
    const familyId = variant.family_id
    if (!grouped.has(familyId)) {
      grouped.set(familyId, [])
    }
    grouped.get(familyId)!.push(variant)
  })
  
  return grouped
}

/**
 * Obtiene la imagen de portada de una familia
 */
export function getFamilyCoverImage(family: LedRollFamilyWithRelations): LedRollFamilyMedia | undefined {
  return family.media.find(m => m.kind === 'cover')
}

/**
 * Obtiene todas las imágenes de galería de una familia
 */
export function getFamilyGalleryImages(family: LedRollFamilyWithRelations): LedRollFamilyMedia[] {
  return family.media.filter(m => m.kind === 'gallery').sort((a, b) => a.display_order - b.display_order)
}

/**
 * Obtiene imágenes técnicas de una familia
 */
export function getFamilyTechImages(family: LedRollFamilyWithRelations): LedRollFamilyMedia[] {
  return family.media.filter(m => m.kind === 'tech')
}

/**
 * Formatea información de una variante para mostrar
 */
export function formatVariantDisplay(variant: LedRoll): string {
  const parts = [
    `${variant.watts_per_meter}W/m`,
    variant.tone_label,
    `${variant.voltage}V`,
    `IP${variant.ip_rating}`
  ]
  
  if (variant.lumens_per_meter) {
    parts.push(`${variant.lumens_per_meter}lm/m`)
  }
  
  return parts.join(' • ')
}

/**
 * Obtiene el rango de precios de una familia
 */
export function getFamilyPriceRange(family: LedRollFamilyWithRelations): { min: number; max: number } | null {
  const prices = family.variants
    .map(v => v.price)
    .filter((p): p is number => p !== null && p > 0)
  
  if (prices.length === 0) return null
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
}

/**
 * Obtiene todas las opciones únicas de tonos de luz disponibles
 */
export function getUniqueToneLabels(families: LedRollFamilyWithRelations[]): string[] {
  const tones = new Set<string>()
  
  families.forEach(family => {
    family.variants.forEach(variant => {
      if (variant.tone_label) {
        tones.add(variant.tone_label)
      }
    })
  })
  
  return Array.from(tones).sort()
}

/**
 * Obtiene todos los tipos de LED únicos
 */
export function getUniqueLedTypes(families: LedRollFamilyWithRelations[]): string[] {
  const types = new Set<string>()
  
  families.forEach(family => {
    if (family.led_type) {
      types.add(family.led_type)
    }
  })
  
  return Array.from(types).sort()
}

/**
 * Busca familias y variantes por texto
 */
export function searchLedRolls(
  families: LedRollFamilyWithRelations[],
  query: string
): LedRollFamilyWithRelations[] {
  const lowerQuery = query.toLowerCase()
  
  return families.filter(family => {
    // Buscar en nombre y descripción de familia
    if (family.name.toLowerCase().includes(lowerQuery)) return true
    if (family.description?.toLowerCase().includes(lowerQuery)) return true
    if (family.led_type?.toLowerCase().includes(lowerQuery)) return true
    
    // Buscar en códigos y nombres de variantes
    const matchingVariant = family.variants.some(variant => 
      variant.code.toLowerCase().includes(lowerQuery) ||
      variant.name?.toLowerCase().includes(lowerQuery) ||
      variant.tone_label?.toLowerCase().includes(lowerQuery)
    )
    
    return matchingVariant
  })
}
