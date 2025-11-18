import { NextResponse } from 'next/server'
import { getAllZones, createZone } from '@/features/distributors/queries'
import type { DistributorZoneInsert } from '@/types/database'

/**
 * GET /api/distributors/zones
 * Get all zones
 */
export async function GET() {
  try {
    const zones = await getAllZones()
    return NextResponse.json(zones)
  } catch (error) {
    console.error('GET /api/distributors/zones error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch zones' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/distributors/zones
 * Create a new zone
 */
export async function POST(request: Request) {
  try {
    const body: DistributorZoneInsert = await request.json()
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }
    
    const zone = await createZone(body)
    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error('POST /api/distributors/zones error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create zone' },
      { status: 500 }
    )
  }
}
