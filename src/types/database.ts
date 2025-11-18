/**
 * Database types generated from Supabase schema
 * These mirror your database structure
 */

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          slug: string
          name: string
        }
        Insert: {
          id?: number
          slug: string
          name: string
        }
        Update: {
          id?: number
          slug?: string
          name?: string
        }
      }
      finishes: {
        Row: {
          id: number
          slug: string
          name: string
          hex_color: string | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          hex_color?: string | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          hex_color?: string | null
        }
      }
      light_tones: {
        Row: {
          id: number
          slug: string
          name: string
          kelvin: number | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          kelvin?: number | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          kelvin?: number | null
        }
      }
      products: {
        Row: {
          id: number
          code: string
          name: string
          category_id: number
          description: string | null
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          category_id: number
          description?: string | null
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          category_id?: number
          description?: string | null
          is_featured?: boolean
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: number
          product_id: number
          variant_code: string | null
          name: string
          includes_led: boolean | null
          includes_driver: boolean | null
          cantidad: number | null
        }
        Insert: {
          id?: number
          product_id: number
          variant_code?: string | null
          name: string
          includes_led?: boolean | null
          includes_driver?: boolean | null
          cantidad?: number | null
        }
        Update: {
          id?: number
          product_id?: number
          variant_code?: string | null
          name?: string
          includes_led?: boolean | null
          includes_driver?: boolean | null
          cantidad?: number | null
        }
      }
      variant_configurations: {
        Row: {
          id: number
          variant_id: number
          name: string | null
          sku: string | null
          watt: number
          lumens: number
          diameter_description: string | null
          length_mm: number | null
          width_mm: number | null
          voltage: number | null
          specs: Record<string, any>
        }
        Insert: {
          id?: number
          variant_id: number
          name?: string | null
          sku?: string | null
          watt: number
          lumens: number
          diameter_description?: string | null
          length_mm?: number | null
          width_mm?: number | null
          voltage?: number | null
          specs?: Record<string, any>
        }
        Update: {
          id?: number
          variant_id?: number
          name?: string | null
          sku?: string | null
          watt?: number
          lumens?: number
          diameter_description?: string | null
          length_mm?: number | null
          width_mm?: number | null
          voltage?: number | null
          specs?: Record<string, any>
        }
      }
      media_assets: {
        Row: {
          id: number
          product_id: number | null
          variant_id: number | null
          path: string
          kind: 'cover' | 'tech'
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: number
          product_id?: number | null
          variant_id?: number | null
          path: string
          kind: 'cover' | 'tech'
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number | null
          variant_id?: number | null
          path?: string
          kind?: 'cover' | 'tech'
          alt_text?: string | null
          created_at?: string
        }
      }
      variant_light_tones: {
        Row: {
          variant_id: number
          light_tone_id: number
        }
        Insert: {
          variant_id: number
          light_tone_id: number
        }
        Update: {
          variant_id?: number
          light_tone_id?: number
        }
      }
      led_roll_model_light_tones: {
        Row: {
          model_id: number
          light_tone_id: number
        }
        Insert: {
          model_id: number
          light_tone_id: number
        }
        Update: {
          model_id?: number
          light_tone_id?: number
        }
      }
      product_finishes: {
        Row: {
          product_id: number
          finish_id: number
        }
        Insert: {
          product_id: number
          finish_id: number
        }
        Update: {
          product_id?: number
          finish_id?: number
        }
      }
      featured_items: {
        Row: {
          id: number
          title: string
          product_code: string | null
          image_url: string
          link_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          product_code?: string | null
          image_url: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          product_code?: string | null
          image_url?: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // LED Profiles Tables
      // ============================================
      led_profiles: {
        Row: {
          id: number
          code: string
          name: string
          description: string | null
          material: string | null
          finish_surface: string | null
          max_w_per_m: number | null
          use_cases: string | null
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          description?: string | null
          material?: string | null
          finish_surface?: string | null
          max_w_per_m?: number | null
          use_cases?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          description?: string | null
          material?: string | null
          finish_surface?: string | null
          max_w_per_m?: number | null
          use_cases?: string | null
          created_at?: string
        }
      }
      led_diffusers: {
        Row: {
          id: number
          slug: string
          name: string
          material: string | null
          uv_protection: boolean
        }
        Insert: {
          id?: number
          slug: string
          name: string
          material?: string | null
          uv_protection?: boolean
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          material?: string | null
          uv_protection?: boolean
        }
      }
      led_profile_diffusers: {
        Row: {
          profile_id: number
          diffuser_id: number
          notes: string | null
          // Campos deprecados (mantener por compatibilidad pero no usar)
          included_by_m?: number
          included_qty_per_m?: number
        }
        Insert: {
          profile_id: number
          diffuser_id: number
          notes?: string | null
          included_by_m?: number
          included_qty_per_m?: number
        }
        Update: {
          profile_id?: number
          diffuser_id?: number
          notes?: string | null
          included_by_m?: number
          included_qty_per_m?: number
        }
      }
      led_profile_finishes: {
        Row: {
          profile_id: number
          finish_id: number
        }
        Insert: {
          profile_id: number
          finish_id: number
        }
        Update: {
          profile_id?: number
          finish_id?: number
        }
      }
      led_profile_included_items: {
        Row: {
          profile_id: number
          accessory_id: number
          qty_per_m: number
        }
        Insert: {
          profile_id: number
          accessory_id: number
          qty_per_m?: number
        }
        Update: {
          profile_id?: number
          accessory_id?: number
          qty_per_m?: number
        }
      }
      led_profile_optional_items: {
        Row: {
          profile_id: number
          accessory_id: number
        }
        Insert: {
          profile_id: number
          accessory_id: number
        }
        Update: {
          profile_id?: number
          accessory_id?: number
        }
      }
      led_profile_media: {
        Row: {
          id: number
          profile_id: number
          path: string
          kind: 'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec'
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: number
          profile_id: number
          path: string
          kind: 'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec'
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          profile_id?: number
          path?: string
          kind?: 'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec'
          alt_text?: string | null
          created_at?: string
        }
      }
      led_profile_embeddings: {
        Row: {
          id: number
          profile_id: number
          content: string
          embedding: string | number[]
        }
        Insert: {
          id?: number
          profile_id: number
          content: string
          embedding?: string | number[]
        }
        Update: {
          id?: number
          profile_id?: number
          content?: string
          embedding?: string | number[]
        }
      }
      distributor_zones: {
        Row: {
          id: number
          name: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      distributors: {
        Row: {
          id: number
          zone_id: number
          name: string
          address: string
          locality: string
          phone: string | null
          google_maps_url: string | null
          email: string | null
          website: string | null
          notes: string | null
          active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          zone_id: number
          name: string
          address: string
          locality: string
          phone?: string | null
          google_maps_url?: string | null
          email?: string | null
          website?: string | null
          notes?: string | null
          active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          zone_id?: number
          name?: string
          address?: string
          locality?: string
          phone?: string | null
          google_maps_url?: string | null
          email?: string | null
          website?: string | null
          notes?: string | null
          active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper types for common use cases
export type Category = Database['public']['Tables']['categories']['Row']
export type Finish = Database['public']['Tables']['finishes']['Row']
export type LightTone = Database['public']['Tables']['light_tones']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Variant = Database['public']['Tables']['product_variants']['Row']
export type VariantConfig = Database['public']['Tables']['variant_configurations']['Row']
export type MediaAsset = Database['public']['Tables']['media_assets']['Row']
export type FeaturedItem = Database['public']['Tables']['featured_items']['Row']

// Insert types
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type FinishInsert = Database['public']['Tables']['finishes']['Insert']
export type LightToneInsert = Database['public']['Tables']['light_tones']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type VariantInsert = Database['public']['Tables']['product_variants']['Insert']
export type VariantConfigInsert = Database['public']['Tables']['variant_configurations']['Insert']
export type MediaAssetInsert = Database['public']['Tables']['media_assets']['Insert']

// Update types
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type FinishUpdate = Database['public']['Tables']['finishes']['Update']
export type LightToneUpdate = Database['public']['Tables']['light_tones']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type VariantUpdate = Database['public']['Tables']['product_variants']['Update']
export type VariantConfigUpdate = Database['public']['Tables']['variant_configurations']['Update']
export type MediaAssetUpdate = Database['public']['Tables']['media_assets']['Update']

// Extended types with relations
export type ProductWithRelations = Product & {
  category?: Category
  media_assets?: MediaAsset[]
  product_variants?: VariantWithRelations[]
  product_finishes?: Array<{ finish: Finish }>
}

export type VariantWithRelations = Variant & {
  variant_light_tones?: Array<{ light_tone: LightTone }>
  variant_configurations?: VariantConfig[]
  media_assets?: MediaAsset[]
}

// ============================================
// LED Profiles Helper Types
// ============================================
export type LedProfile = Database['public']['Tables']['led_profiles']['Row']
export type LedDiffuser = Database['public']['Tables']['led_diffusers']['Row']
export type LedProfileDiffuser = Database['public']['Tables']['led_profile_diffusers']['Row']
export type LedProfileFinish = Database['public']['Tables']['led_profile_finishes']['Row']
export type LedProfileIncludedItem = Database['public']['Tables']['led_profile_included_items']['Row']
export type LedProfileOptionalItem = Database['public']['Tables']['led_profile_optional_items']['Row']
export type LedProfileMedia = Database['public']['Tables']['led_profile_media']['Row']
export type LedProfileEmbedding = Database['public']['Tables']['led_profile_embeddings']['Row']

// Insert types
export type LedProfileInsert = Database['public']['Tables']['led_profiles']['Insert']
export type LedDiffuserInsert = Database['public']['Tables']['led_diffusers']['Insert']
export type LedProfileDiffuserInsert = Database['public']['Tables']['led_profile_diffusers']['Insert']
export type LedProfileFinishInsert = Database['public']['Tables']['led_profile_finishes']['Insert']
export type LedProfileIncludedItemInsert = Database['public']['Tables']['led_profile_included_items']['Insert']
export type LedProfileOptionalItemInsert = Database['public']['Tables']['led_profile_optional_items']['Insert']
export type LedProfileMediaInsert = Database['public']['Tables']['led_profile_media']['Insert']
export type LedProfileEmbeddingInsert = Database['public']['Tables']['led_profile_embeddings']['Insert']

// Update types
export type LedProfileUpdate = Database['public']['Tables']['led_profiles']['Update']
export type LedDiffuserUpdate = Database['public']['Tables']['led_diffusers']['Update']
export type LedProfileDiffuserUpdate = Database['public']['Tables']['led_profile_diffusers']['Update']
export type LedProfileFinishUpdate = Database['public']['Tables']['led_profile_finishes']['Update']
export type LedProfileIncludedItemUpdate = Database['public']['Tables']['led_profile_included_items']['Update']
export type LedProfileOptionalItemUpdate = Database['public']['Tables']['led_profile_optional_items']['Update']
export type LedProfileMediaUpdate = Database['public']['Tables']['led_profile_media']['Update']
export type LedProfileEmbeddingUpdate = Database['public']['Tables']['led_profile_embeddings']['Update']

// Extended types with relations
export type LedProfileWithRelations = LedProfile & {
  diffusers?: Array<LedProfileDiffuser & { diffuser: LedDiffuser }>
  finishes?: Array<LedProfileFinish & { finish: Finish }>
  included_items?: Array<LedProfileIncludedItem & { accessory: { id: number; code: string; name: string } }>
  optional_items?: Array<LedProfileOptionalItem & { accessory: { id: number; code: string; name: string } }>
  media?: LedProfileMedia[]
}

// =============================================
// DISTRIBUTORS TYPES
// =============================================

export type DistributorZone = Database['public']['Tables']['distributor_zones']['Row']
export type Distributor = Database['public']['Tables']['distributors']['Row']

export type DistributorZoneInsert = Database['public']['Tables']['distributor_zones']['Insert']
export type DistributorInsert = Database['public']['Tables']['distributors']['Insert']

export type DistributorZoneUpdate = Database['public']['Tables']['distributor_zones']['Update']
export type DistributorUpdate = Database['public']['Tables']['distributors']['Update']
