/**
 * Variant queries
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { VariantWithRelations } from '@/types/database'

/**
 * Get variants for a product
 */
export async function getProductVariants(productId: number): Promise<VariantWithRelations[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_variants')
    .select(
      `
      *,
      variant_light_tones (
        light_tone:light_tones ( id, slug, name, kelvin )
      ),
      variant_configurations (
        id, sku, watt, lumens, diameter_description, length_mm, width_mm,
        voltage, specs
      )
    `
    )
    .eq('product_id', productId)

  if (error) {
    console.error('getProductVariants error:', error)
    throw new Error(error.message)
  }

  return (data ?? []) as VariantWithRelations[]
}

/**
 * Get variant by ID with all relations
 */
export async function getVariantById(id: number): Promise<VariantWithRelations | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_variants')
    .select(
      `
      *,
      variant_light_tones (
        light_tone:light_tones ( id, slug, name, kelvin )
      ),
      variant_configurations (
        id, sku, watt, lumens, diameter_description, length_mm, width_mm,
        voltage, specs
      ),
      media_assets ( id, path, kind, alt_text )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('getVariantById error:', error)
    return null
  }

  return data as VariantWithRelations
}
