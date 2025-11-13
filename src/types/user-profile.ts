// =====================================================
// TYPES: User Profile
// Tipos para el perfil extendido de usuario en Supabase
// =====================================================

export interface UserProfile {
  id: string // UUID del usuario (auth.users.id)
  
  // Información Personal
  first_name: string | null
  last_name: string | null
  display_name: string | null // Ej: "Team Manager", "CEO"
  bio: string | null
  phone: string | null
  avatar_url: string | null
  
  // Redes Sociales
  facebook_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  
  // Dirección
  country: string | null
  city_state: string | null
  postal_code: string | null
  tax_id: string | null
  full_address: string | null
  
  // Metadata
  created_at: string
  updated_at: string
}

// Tipo para crear/actualizar perfil (sin campos readonly)
export interface UserProfileUpdate {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  bio?: string | null
  phone?: string | null
  avatar_url?: string | null
  
  facebook_url?: string | null
  twitter_url?: string | null
  linkedin_url?: string | null
  instagram_url?: string | null
  
  country?: string | null
  city_state?: string | null
  postal_code?: string | null
  tax_id?: string | null
  full_address?: string | null
}

// Tipo para el formulario del cliente (incluye validación)
export interface UserProfileFormData {
  // Personal
  first_name: string
  last_name: string
  display_name: string
  bio: string
  phone: string
  
  // Social
  facebook_url: string
  twitter_url: string
  linkedin_url: string
  instagram_url: string
  
  // Address
  country: string
  city_state: string
  postal_code: string
  tax_id: string
  full_address: string
}
