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
