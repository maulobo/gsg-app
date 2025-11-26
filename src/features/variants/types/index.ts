/**
 * Variants feature types
 */

import type { Variant, VariantWithRelations } from '@/types/database'

export type { Variant, VariantWithRelations }

export type VariantFormData = {
  product_id: number
  variant_code?: string
  name: string
}

export type VariantConfigFormData = {
  variant_id: number
  sku?: string
  watt: number
  lumens: number
  diameter_description?: string
  length_cm?: number
  width_cm?: number
  voltage?: number
  includes_led?: boolean
  includes_driver?: boolean
  specs?: Record<string, any>
}
