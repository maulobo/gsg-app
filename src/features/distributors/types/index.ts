import type { Distributor, DistributorZone } from '@/types/database'

/**
 * Distributor with its zone information
 */
export type DistributorWithZone = Distributor & {
  zone: DistributorZone
}

/**
 * Distributors grouped by zone
 */
export type DistributorsByZone = {
  zone: DistributorZone
  distributors: Distributor[]
}

/**
 * Form data for creating/updating a distributor
 */
export type DistributorFormData = {
  zone_id: number
  name: string
  address: string
  locality: string
  phone: string
  google_maps_url: string
  email?: string
  website?: string
  notes?: string
  active: boolean
  display_order: number
}

/**
 * Form data for creating/updating a zone
 */
export type ZoneFormData = {
  name: string
  display_order: number
}
