/**
 * Product feature types
 */

import type { ProductWithRelations } from '@/types/database'

// Re-export for convenience
export type { ProductWithRelations }

// Product Addon types
export type ProductAddon = {
  id: number
  product_id: number
  code: string
  name: string
  description: string | null
  category: 'control' | 'installation' | 'accessory' | 'driver'
  specs: Record<string, any>
  price: number | null
  stock_quantity: number
  display_order: number
  is_active: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

// Form data types
export type ProductFormData = {
  code: string
  name: string
  category_id: number
  description?: string
  is_featured?: boolean
}

// Query result types
export type ProductListItem = {
  id: number
  code: string
  name: string
  category: {
    id: number
    name: string
    slug: string
  }
  is_featured: boolean
  created_at: string
  variants_count: number
  variants_with_pdf: number
  variants_with_tech: number
  variants_with_cover: number
}

export type ProductDetail = ProductWithRelations & {
  product_addons?: ProductAddon[]
}
