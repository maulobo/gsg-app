/**
 * LED Profiles - Database Queries
 * 
 * Funciones para interactuar con las tablas de perfiles LED en Supabase
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { deleteFromR2, extractKeyFromUrl } from '@/lib/r2client'
import { revalidatePath } from 'next/cache'
import type {
  LedProfile,
  LedDiffuser,
  LedProfileInsert,
  LedProfileUpdate,
  LedDiffuserInsert,
  LedProfileDiffuserInsert,
  LedProfileFinishInsert,
  LedProfileIncludedItemInsert,
  LedProfileOptionalItemInsert,
  LedProfileMediaInsert,
} from '@/types/database'
import type {
  LedProfileFull,
  LedProfileListItem,
  LedProfileFilters,
  LedProfilePaginationParams,
} from '../types'

// ============================================
// LED Profiles - CRUD
// ============================================

/**
 * Obtener todos los perfiles LED
 */
export async function getLedProfiles() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_profiles')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching LED profiles:', error)
    return []
  }
  
  return data as LedProfile[]
}

/**
 * Obtener perfil LED por ID con todas sus relaciones
 */
export async function getLedProfileById(id: number): Promise<LedProfileFull | null> {
  const supabase = await createServerSupabaseClient()
  
  // Perfil base
  const { data: profile, error: profileError } = await supabase
    .from('led_profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (profileError || !profile) {
    console.error('Error fetching LED profile:', profileError)
    return null
  }
  
  // Difusores con detalles
  const { data: diffusersData } = await supabase
    .from('led_profile_diffusers')
    .select(`
      notes,
      diffuser:led_diffusers(*)
    `)
    .eq('profile_id', id)
  
  // Terminaciones
  const { data: finishesData } = await supabase
    .from('led_profile_finishes')
    .select(`
      finish:finishes(*)
    `)
    .eq('profile_id', id)
  
  // Items incluidos
  const { data: includedData } = await supabase
    .from('led_profile_included_items')
    .select(`
      qty_per_m,
      accessory:accessories(id, code, name, description)
    `)
    .eq('profile_id', id)
  
  // Items opcionales
  const { data: optionalData } = await supabase
    .from('led_profile_optional_items')
    .select(`
      accessory:accessories(id, code, name, description)
    `)
    .eq('profile_id', id)
  
  // Media
  const { data: mediaData } = await supabase
    .from('led_profile_media')
    .select('*')
    .eq('profile_id', id)
    .order('created_at', { ascending: true })
  
  return {
    ...profile,
    diffusers: diffusersData?.map(d => {
      const diffuser = Array.isArray(d.diffuser) ? d.diffuser[0] : d.diffuser
      return {
        ...diffuser,
        notes: d.notes,
      }
    }) || [],
    finishes: finishesData?.map(f => {
      const finish = Array.isArray(f.finish) ? f.finish[0] : f.finish
      return finish
    }).filter(Boolean) || [],
    included_items: includedData?.map(i => {
      const accessory = Array.isArray(i.accessory) ? i.accessory[0] : i.accessory
      return {
        ...accessory,
        qty_per_m: i.qty_per_m,
      }
    }) || [],
    optional_items: optionalData?.map(o => {
      const accessory = Array.isArray(o.accessory) ? o.accessory[0] : o.accessory
      return accessory
    }).filter(Boolean) || [],
    media: mediaData || [],
  } as LedProfileFull
}

/**
 * Obtener perfil LED por código
 */
export async function getLedProfileByCode(code: string): Promise<LedProfileFull | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data: profile, error } = await supabase
    .from('led_profiles')
    .select('id')
    .eq('code', code)
    .single()
  
  if (error || !profile) {
    return null
  }
  
  return getLedProfileById(profile.id)
}

/**
 * Obtener vista resumida para listados con contadores
 */
export async function getLedProfilesListItems(): Promise<LedProfileListItem[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data: profiles, error } = await supabase
    .from('led_profiles')
    .select(`
      *,
      led_profile_media ( kind )
    `)
    .order('name', { ascending: true })
  
  if (error || !profiles) {
    console.error('Error fetching LED profiles:', error)
    return []
  }
  
  // Obtener contadores para cada perfil
  const listItems = await Promise.all(
    profiles.map(async (profile) => {
      // Contar difusores
      const { count: diffusersCount } = await supabase
        .from('led_profile_diffusers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)
      
      // Contar terminaciones
      const { count: finishesCount } = await supabase
        .from('led_profile_finishes')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)
      
      // Obtener imagen de portada
      const { data: coverMedia } = await supabase
        .from('led_profile_media')
        .select('path')
        .eq('profile_id', profile.id)
        .eq('kind', 'cover')
        .single()

      // Verificar presencia de media
      const media = (profile.led_profile_media as any[]) || []
      
      // Debug: ver qué media tiene cada perfil
      if (media.length > 0) {
        console.log(`Profile ${profile.code}:`, media.map((m: any) => m.kind))
      }
      
      const hasPhoto = media.some((m: any) => m.kind === 'cover' || m.kind === 'tech')
      const hasPdf = media.some((m: any) => m.kind === 'datasheet' || m.kind === 'spec')
      
      return {
        id: profile.id,
        code: profile.code,
        name: profile.name,
        description: profile.description,
        material: profile.material,
        max_w_per_m: profile.max_w_per_m,
        diffusers_count: diffusersCount || 0,
        finishes_count: finishesCount || 0,
        cover_image: coverMedia?.path || null,
        has_photo: hasPhoto,
        has_pdf: hasPdf,
      }
    })
  )
  
  return listItems
}

/**
 * Crear nuevo perfil LED
 */
export async function createLedProfile(profile: LedProfileInsert): Promise<LedProfile | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_profiles')
    .insert(profile)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating LED profile:', error)
    return null
  }
  return data
}

/**
 * Actualizar perfil LED
 */
export async function updateLedProfile(
  id: number,
  updates: LedProfileUpdate
): Promise<LedProfile | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating LED profile:', error)
    return null
  }
  
  return data
}

/**
 * Eliminar perfil LED
 */
export async function deleteLedProfile(id: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  // 0. Obtener media asociada al perfil para limpiar R2
  try {
    const { data: mediaItems, error: mediaFetchError } = await supabase
      .from('led_profile_media')
      .select('id, path')
      .eq('profile_id', id)

    if (mediaFetchError) {
      console.error('Error fetching profile media before delete:', mediaFetchError)
    } else if (mediaItems && mediaItems.length > 0) {
      for (const item of mediaItems) {
        const key = extractKeyFromUrl(item.path)
        if (key) {
          try {
            console.log(`🗑️ Deleting R2 object for profile ${id}: ${key}`)
            await deleteFromR2(key)
          } catch (r2Error) {
            console.error(`Error deleting from R2 for key ${key}:`, r2Error)
          }
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error while cleaning R2 for profile:', err)
  }
  const { error } = await supabase
    .from('led_profiles')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting LED profile:', error)
    return false
  }

  // Revalidate led profiles listing and profile page
  try {
    revalidatePath('/led-profiles')
  } catch (err) {
    // ignore revalidation failures in server contexts
  }
  
  return true
}

// ============================================
// Diffusers - CRUD
// ============================================

/**
 * Obtener todos los difusores
 */
export async function getLedDiffusers(): Promise<LedDiffuser[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_diffusers')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching LED diffusers:', error)
    return []
  }
  
  return data
}

/**
 * Crear nuevo difusor
 */
export async function createLedDiffuser(diffuser: LedDiffuserInsert): Promise<LedDiffuser | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('led_diffusers')
    .insert(diffuser)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating LED diffuser:', error)
    return null
  }
  
  return data
}

// ============================================
// Profile Relations
// ============================================

/**
 * Asociar difusor a perfil
 */
export async function addDiffuserToProfile(
  relation: LedProfileDiffuserInsert
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_diffusers')
    .insert(relation)
  
  if (error) {
    console.error('Error adding diffuser to profile:', error)
    return false
  }
  
  return true
}

/**
 * Remover difusor de perfil
 */
export async function removeDiffuserFromProfile(
  profileId: number,
  diffuserId: number
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_diffusers')
    .delete()
    .eq('profile_id', profileId)
    .eq('diffuser_id', diffuserId)
  
  if (error) {
    console.error('Error removing diffuser from profile:', error)
    return false
  }
  
  return true
}

/**
 * Asociar terminación a perfil
 */
export async function addFinishToProfile(
  relation: LedProfileFinishInsert
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_finishes')
    .insert(relation)
  
  if (error) {
    console.error('Error adding finish to profile:', error)
    return false
  }
  
  return true
}

/**
 * Remover terminación de perfil
 */
export async function removeFinishFromProfile(
  profileId: number,
  finishId: number
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_finishes')
    .delete()
    .eq('profile_id', profileId)
    .eq('finish_id', finishId)
  
  if (error) {
    console.error('Error removing finish from profile:', error)
    return false
  }
  
  return true
}

/**
 * Agregar item incluido a perfil
 */
export async function addIncludedItemToProfile(
  relation: LedProfileIncludedItemInsert
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_included_items')
    .insert(relation)
  
  if (error) {
    console.error('Error adding included item to profile:', error)
    return false
  }
  
  return true
}

/**
 * Agregar item opcional a perfil
 */
export async function addOptionalItemToProfile(
  relation: LedProfileOptionalItemInsert
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_optional_items')
    .insert(relation)
  
  if (error) {
    console.error('Error adding optional item to profile:', error)
    return false
  }
  
  return true
}

/**
 * Agregar media a perfil
 */
export async function addMediaToProfile(
  media: LedProfileMediaInsert
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_media')
    .insert(media)
  
  if (error) {
    console.error('Error adding media to profile:', error)
    return false
  }
  
  return true
}

/**
 * Eliminar media de perfil
 */
export async function deleteMediaFromProfile(mediaId: number): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('led_profile_media')
    .delete()
    .eq('id', mediaId)
  
  if (error) {
    console.error('Error deleting media from profile:', error)
    return false
  }
  
  return true
}

// ============================================
// Search & Filter
// ============================================

/**
 * Buscar perfiles LED con filtros
 */
export async function searchLedProfiles(
  filters: LedProfileFilters = {},
  pagination: LedProfilePaginationParams = {}
): Promise<{ data: LedProfile[]; total: number }> {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase.from('led_profiles').select('*', { count: 'exact' })
  
  // Filtro de búsqueda
  if (filters.search) {
    query = query.or(
      `code.ilike.%${filters.search}%,name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }
  
  // Filtro por material
  if (filters.material) {
    query = query.eq('material', filters.material)
  }
  
  // Filtro por rango de potencia
  if (filters.min_w_per_m) {
    query = query.gte('max_w_per_m', filters.min_w_per_m)
  }
  if (filters.max_w_per_m) {
    query = query.lte('max_w_per_m', filters.max_w_per_m)
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
    console.error('Error searching LED profiles:', error)
    return { data: [], total: 0 }
  }
  
  return { data: data || [], total: count || 0 }
}
