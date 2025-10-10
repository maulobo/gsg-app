/**
 * Categories feature types
 */

import type { Category } from '@/types/database'

export type { Category }

export type CategoryFormData = {
  slug: string
  name: string
}
