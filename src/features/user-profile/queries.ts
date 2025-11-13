// =====================================================
// QUERIES: User Profile
// Funciones para interactuar con user_profiles en Supabase
// =====================================================

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { UserProfile, UserProfileUpdate } from '@/types/user-profile'

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error)
    return null
  }
}

/**
 * Obtiene el perfil de un usuario específico por ID
 */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfileById:', error)
    return null
  }
}

/**
 * Crea o actualiza el perfil del usuario (upsert)
 */
export async function upsertUserProfile(
  userId: string,
  profileData: UserProfileUpdate
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting user profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in upsertUserProfile:', error)
    return { success: false, error: error?.message || 'Unknown error' }
  }
}

/**
 * Actualiza solo campos específicos del perfil
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfileUpdate>
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in updateUserProfile:', error)
    return { success: false, error: error?.message || 'Unknown error' }
  }
}

/**
 * Elimina el perfil del usuario (raro, pero disponible)
 */
export async function deleteUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteUserProfile:', error)
    return { success: false, error: error?.message || 'Unknown error' }
  }
}

/**
 * Actualiza solo el avatar del usuario
 */
export async function updateUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (error) {
      console.error('Error updating avatar:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateUserAvatar:', error)
    return { success: false, error: error?.message || 'Unknown error' }
  }
}
