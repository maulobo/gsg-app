import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { 
  Distributor, 
  DistributorZone, 
  DistributorInsert, 
  DistributorUpdate,
  DistributorZoneInsert,
  DistributorZoneUpdate
} from '@/types/database'
import type { DistributorWithZone, DistributorsByZone } from '../types'

/**
 * =============================================
 * ZONE QUERIES
 * =============================================
 */

/**
 * Get all zones ordered by display_order
 */
export async function getAllZones(): Promise<DistributorZone[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributor_zones')
    .select('*')
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching zones:', error)
    throw new Error(`Failed to fetch zones: ${error.message}`)
  }
  
  return data || []
}

/**
 * Get zone by ID
 */
export async function getZoneById(id: number): Promise<DistributorZone | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributor_zones')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching zone:', error)
    return null
  }
  
  return data
}

/**
 * Create a new zone
 */
export async function createZone(zone: DistributorZoneInsert): Promise<DistributorZone> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributor_zones')
    .insert(zone)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating zone:', error)
    throw new Error(`Failed to create zone: ${error.message}`)
  }
  
  return data
}

/**
 * Update a zone
 */
export async function updateZone(id: number, zone: DistributorZoneUpdate): Promise<DistributorZone> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributor_zones')
    .update(zone)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating zone:', error)
    throw new Error(`Failed to update zone: ${error.message}`)
  }
  
  return data
}

/**
 * Delete a zone (will cascade delete all distributors in that zone)
 */
export async function deleteZone(id: number): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('distributor_zones')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting zone:', error)
    throw new Error(`Failed to delete zone: ${error.message}`)
  }
}

/**
 * =============================================
 * DISTRIBUTOR QUERIES
 * =============================================
 */

/**
 * Get all active distributors with their zones, ordered by zone and display_order
 */
export async function getAllDistributors(includeInactive = false): Promise<DistributorWithZone[]> {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('distributors')
    .select(`
      *,
      zone:distributor_zones(*)
    `)
    .order('display_order', { ascending: true })
  
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching distributors:', error)
    throw new Error(`Failed to fetch distributors: ${error.message}`)
  }
  
  return (data || []) as DistributorWithZone[]
}

/**
 * Get distributors grouped by zone (for public display)
 */
export async function getDistributorsByZone(): Promise<DistributorsByZone[]> {
  const supabase = await createServerSupabaseClient()
  
  // Get all zones
  const zones = await getAllZones()
  
  // Get all active distributors
  const { data: distributors, error } = await supabase
    .from('distributors')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching distributors:', error)
    throw new Error(`Failed to fetch distributors: ${error.message}`)
  }
  
  // Group by zone
  return zones.map(zone => ({
    zone,
    distributors: (distributors || []).filter((d: Distributor) => d.zone_id === zone.id)
  }))
}

/**
 * Get distributor by ID
 */
export async function getDistributorById(id: number): Promise<DistributorWithZone | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributors')
    .select(`
      *,
      zone:distributor_zones(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching distributor:', error)
    return null
  }
  
  return data as DistributorWithZone
}

/**
 * Get distributors by zone ID
 */
export async function getDistributorsByZoneId(zoneId: number, includeInactive = false): Promise<Distributor[]> {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('distributors')
    .select('*')
    .eq('zone_id', zoneId)
    .order('display_order', { ascending: true })
  
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching distributors by zone:', error)
    throw new Error(`Failed to fetch distributors: ${error.message}`)
  }
  
  return data || []
}

/**
 * Create a new distributor
 */
export async function createDistributor(distributor: DistributorInsert): Promise<Distributor> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributors')
    .insert(distributor)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating distributor:', error)
    throw new Error(`Failed to create distributor: ${error.message}`)
  }
  
  return data
}

/**
 * Update a distributor
 */
export async function updateDistributor(id: number, distributor: DistributorUpdate): Promise<Distributor> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('distributors')
    .update(distributor)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating distributor:', error)
    throw new Error(`Failed to update distributor: ${error.message}`)
  }
  
  return data
}

/**
 * Delete a distributor
 */
export async function deleteDistributor(id: number): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase
    .from('distributors')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting distributor:', error)
    throw new Error(`Failed to delete distributor: ${error.message}`)
  }
}

/**
 * Toggle distributor active status
 */
export async function toggleDistributorActive(id: number, active: boolean): Promise<Distributor> {
  return updateDistributor(id, { active })
}
