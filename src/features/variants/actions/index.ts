/**
 * Variant mutations (Server Actions)
 */

'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { VariantInsert, VariantUpdate } from '@/types/database'

/**
 * Create a new variant
 */
export async function createVariant(data: VariantInsert) {
  const supabase = await createServerSupabaseClient()

  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { data: variant }
}

/**
 * Update variant
 */
export async function updateVariant(id: number, data: VariantUpdate) {
  const supabase = await createServerSupabaseClient()

  const { data: variant, error } = await supabase
    .from('product_variants')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { data: variant }
}

/**
 * Delete variant
 */
export async function deleteVariant(id: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('product_variants').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

// Finishes are now at product level (product_finishes), not variant level
// See products/actions for finish management

/**
 * Add light tone to variant (many-to-many)
 */
export async function addLightToneToVariant(variantId: number, lightToneId: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('variant_light_tones')
    .insert({ variant_id: variantId, light_tone_id: lightToneId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

/**
 * Remove light tone from variant
 */
export async function removeLightToneFromVariant(variantId: number, lightToneId: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('variant_light_tones')
    .delete()
    .eq('variant_id', variantId)
    .eq('light_tone_id', lightToneId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

/**
 * Create variant configuration
 */
export async function createVariantConfig(data: {
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
}) {
  const supabase = await createServerSupabaseClient()

  const { data: config, error } = await supabase
    .from('variant_configurations')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { data: config }
}

/**
 * Delete variant configuration
 */
export async function deleteVariantConfig(id: number) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('variant_configurations').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}
