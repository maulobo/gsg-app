/**
 * Media Assets feature types
 */

import type { MediaAsset } from '@/types/database'

export type { MediaAsset }

export type MediaAssetFormData = {
  product_id?: number
  variant_id?: number
  path: string
  kind: 'cover' | 'tech'
  alt_text?: string
}

export type MediaUploadResult = {
  path: string
  publicUrl: string
}
