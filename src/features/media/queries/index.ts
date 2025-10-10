/**
 * Media Asset queries
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { MediaAsset } from '@/types/database'

/**
 * Get media assets for a product
 */
export async function getProductMedia(productId: number): Promise<MediaAsset[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('product_id', productId)
    .order('created_at')

  if (error) {
    console.error('getProductMedia error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Get media assets for a variant
 */
export async function getVariantMedia(variantId: number): Promise<MediaAsset[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('variant_id', variantId)
    .order('created_at')

  if (error) {
    console.error('getVariantMedia error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}
