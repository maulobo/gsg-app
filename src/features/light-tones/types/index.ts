/**
 * Light Tones feature types
 */

import type { LightTone } from '@/types/database'

export type { LightTone }

export type LightToneFormData = {
  slug: string
  name: string
  kelvin?: number
}
