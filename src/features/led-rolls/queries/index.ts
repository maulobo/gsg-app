/**
 * LED Rolls - Database Queries
 * 
 * Funciones para interactuar con las tablas de rollos LED en Supabase
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type {
  LedRoll,
  LedRollModel,
  LedRollFormData,
  LedRollModelFormData,
  LedRollFull,
  LedRollListItem,
  LedRollFilters,
  LedRollPaginationParams,
} from '../types'

// ============================================
// LED Rolls - CRUD
// ============================================

/**
 * Obtener todos los rollos LED
 */
export async function getLedRolls() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_rolls')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching LED rolls:', error)
    return []
  }
  
  return data as LedRoll[]
}

/**
 * Obtener rollo LED por ID con todas sus relaciones
 */
export async function getLedRollById(id: number): Promise<LedRollFull | null> {
  const supabase = await createServerSupabaseClient()
  
  // Rollo base
  const { data: roll, error: rollError } = await supabase
    .from('led_rolls')
    .select('*')
    .eq('id', id)
    .single()
  
  if (rollError || !roll) {
    console.error('Error fetching LED roll:', rollError)
    return null
  }
  
  // Modelos con light tones (nueva estructura con múltiples tonos)
  const { data: modelsData } = await supabase
    .from('led_roll_models')
    .select('*')
    .eq('roll_id', id)
    .eq('is_active', true)
    .order('sku', { ascending: true })
  
  // Para cada modelo, obtener sus tonos de luz de la tabla de relación
  const modelsWithTones = await Promise.all(
    (modelsData || []).map(async (model) => {
      const { data: toneRelations } = await supabase
        .from('led_roll_model_light_tones')
        .select(`
          light_tone:light_tones(id, name, slug, kelvin)
        `)
        .eq('model_id', model.id)
      
      const tones = toneRelations?.map(r => {
        const tone = Array.isArray(r.light_tone) ? r.light_tone[0] : r.light_tone
        return tone
      }).filter(Boolean) || []
      
      return {
        ...model,
        light_tones: tones.length > 0 ? tones : undefined,
      }
    })
  )
  
  // Media
  const { data: mediaData } = await supabase
    .from('led_roll_media')
    .select('*')
    .eq('roll_id', id)
    .order('display_order', { ascending: true })
  
  return {
    ...roll,
    models: modelsWithTones,
    media: mediaData || [],
  } as LedRollFull
}

/**
 * Obtener rollo LED por código
 */
export async function getLedRollByCode(code: string): Promise<LedRollFull | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data: roll, error } = await supabase
    .from('led_rolls')
    .select('id')
    .eq('code', code)
    .single()
  
  if (error || !roll) {
    return null
  }
  
  return getLedRollById(roll.id)
}

/**
 * Obtener vista resumida para listados
 */
export async function getLedRollsListItems(): Promise<LedRollListItem[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data: rolls, error } = await supabase
    .from('led_rolls')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
  
  if (error || !rolls) {
    console.error('Error fetching LED rolls:', error)
    return []
  }
  
  // Obtener contadores para cada rollo
  const listItems = await Promise.all(
    rolls.map(async (roll) => {
      // Contar modelos
      const { count: modelsCount } = await supabase
        .from('led_roll_models')
        .select('*', { count: 'exact', head: true })
        .eq('roll_id', roll.id)
        .eq('is_active', true)
      
      // Obtener imagen de portada
      const { data: coverMedia } = await supabase
        .from('led_roll_media')
        .select('path')
        .eq('roll_id', roll.id)
        .eq('kind', 'cover')
        .single()
      
      return {
        id: roll.id,
        code: roll.code,
        name: roll.name,
        description: roll.description,
        typology: roll.typology,
        color_control: roll.color_control,
        models_count: modelsCount || 0,
        cover_image: coverMedia?.path || null,
      }
    })
  )
  
  return listItems
}

/**
 * Crear nuevo rollo LED
 */
export async function createLedRoll(roll: LedRollFormData): Promise<LedRoll | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_rolls')
    .insert(roll)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating LED roll:', error)
    return null
  }
  
  return data
}

/**
 * Actualizar rollo LED
 */
export async function updateLedRoll(
  id: number,
  updates: Partial<LedRollFormData>
): Promise<LedRoll | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_rolls')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating LED roll:', error)
    return null
  }
  
  return data
}

/**
 * Eliminar rollo LED (soft delete)
 */
export async function deleteLedRoll(id: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_rolls')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting LED roll:', error)
    return false
  }
  
  return true
}

// ============================================
// LED Roll Models - CRUD
// ============================================

/**
 * Obtener modelos de un rollo
 */
export async function getLedRollModels(rollId: number) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_roll_models')
    .select(`
      *,
      light_tone:light_tones(id, name, slug, kelvin)
    `)
    .eq('roll_id', rollId)
    .eq('is_active', true)
    .order('sku', { ascending: true })
  
  if (error) {
    console.error('Error fetching LED roll models:', error)
    return []
  }
  
  return data
}

/**
 * Crear nuevo modelo
 */
export async function createLedRollModel(model: LedRollModelFormData): Promise<LedRollModel | null> {
  const supabase = await createServerSupabaseClient()
  
  // Separar light_tone_ids del resto de los datos
  const { light_tone_ids, ...modelData } = model
  
  // Insertar el modelo (sin light_tone_ids, ya que va en otra tabla)
  const { data, error } = await supabase
    .from('led_roll_models')
    .insert(modelData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating LED roll model:', error)
    return null
  }
  
  // Si hay múltiples tonos de luz, insertarlos en la tabla de relación
  if (light_tone_ids && light_tone_ids.length > 0 && data) {
    const toneRelations = light_tone_ids.map(toneId => ({
      model_id: data.id,
      light_tone_id: toneId
    }))
    
    const { error: toneError } = await supabase
      .from('led_roll_model_light_tones')
      .insert(toneRelations)
    
    if (toneError) {
      console.error('Error creating light tone relations:', toneError)
      // No retornamos null porque el modelo ya fue creado
      // Solo logueamos el error
    }
  }
  
  return data
}

/**
 * Actualizar modelo
 */
export async function updateLedRollModel(
  id: number,
  updates: Partial<LedRollModelFormData>
): Promise<LedRollModel | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_roll_models')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating LED roll model:', error)
    return null
  }
  
  return data
}

/**
 * Eliminar modelo (soft delete)
 */
export async function deleteLedRollModel(id: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_roll_models')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting LED roll model:', error)
    return false
  }
  
  return true
}

// ============================================
// Media
// ============================================

/**
 * Agregar media a rollo
 */
export async function addMediaToRoll(
  rollId: number,
  path: string,
  kind: 'cover' | 'gallery' | 'tech' | 'datasheet' | 'installation',
  altText?: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_roll_media')
    .insert({
      roll_id: rollId,
      path,
      kind,
      alt_text: altText || null,
    })
  
  if (error) {
    console.error('Error adding media to LED roll:', error)
    return false
  }
  
  return true
}

/**
 * Eliminar media
 */
export async function deleteMediaFromRoll(mediaId: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_roll_media')
    .delete()
    .eq('id', mediaId)
  
  if (error) {
    console.error('Error deleting media from LED roll:', error)
    return false
  }
  
  return true
}

// ============================================
// Search & Filter
// ============================================

/**
 * Buscar rollos LED con filtros
 */
export async function searchLedRolls(
  filters: LedRollFilters = {},
  pagination: LedRollPaginationParams = {}
): Promise<{ data: LedRoll[]; total: number }> {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('led_rolls')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
  
  // Filtro de búsqueda
  if (filters.search) {
    query = query.or(
      `code.ilike.%${filters.search}%,name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }
  
  // Filtro por tipología
  if (filters.typology) {
    query = query.eq('typology', filters.typology)
  }
  
  // Filtro por control de color
  if (filters.color_control) {
    query = query.eq('color_control', filters.color_control)
  }
  
  // Filtro por voltaje
  if (filters.voltage) {
    query = query.eq('voltage_v', filters.voltage)
  }
  
  // Filtro por IP rating
  if (filters.ip_rating) {
    query = query.eq('ip_rating', filters.ip_rating)
  }
  
  // Ordenamiento
  const sortBy = pagination.sort_by || 'name'
  const sortOrder = pagination.sort_order === 'desc' ? false : true
  query = query.order(sortBy, { ascending: sortOrder })
  
  // Paginación
  const page = pagination.page || 1
  const limit = pagination.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error searching LED rolls:', error)
    return { data: [], total: 0 }
  }
  
  return { data: data || [], total: count || 0 }
}
