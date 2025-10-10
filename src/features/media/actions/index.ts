/**
 * Media Asset mutations (Server Actions)
 */

'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { MediaAssetInsert, MediaAssetUpdate } from '@/types/database'

/**
 * Create a new media asset record
 */
export async function createMediaAsset(data: MediaAssetInsert) {
  const supabase = await createServerSupabaseClient()

  const { data: mediaAsset, error } = await supabase
    .from('media_assets')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  if (data.product_id) {
    revalidatePath(`/products/${data.product_id}`)
  }

  return { data: mediaAsset }
}

/**
 * Update media asset
 */
export async function updateMediaAsset(id: number, data: MediaAssetUpdate) {
  const supabase = await createServerSupabaseClient()

  const { data: mediaAsset, error } = await supabase
    .from('media_assets')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  if (mediaAsset.product_id) {
    revalidatePath(`/products/${mediaAsset.product_id}`)
  }

  return { data: mediaAsset }
}

/**
 * Delete media asset
 */
export async function deleteMediaAsset(id: number) {
  const supabase = await createServerSupabaseClient()

  // Get the asset first to revalidate correctly
  const { data: asset } = await supabase
    .from('media_assets')
    .select('product_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  if (asset?.product_id) {
    revalidatePath(`/products/${asset.product_id}`)
  }

  return { success: true }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadMediaFile(
  file: File,
  folder: 'products' | 'variants' = 'products'
): Promise<{ path?: string; publicUrl?: string; error?: string }> {
  const supabase = await createServerSupabaseClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('media').getPublicUrl(filePath)

  return { path: filePath, publicUrl }
}
