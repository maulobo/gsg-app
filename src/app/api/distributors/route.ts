import { NextResponse } from 'next/server'
import { 
  getAllDistributors, 
  getDistributorsByZone,
  createDistributor 
} from '@/features/distributors/queries'
import type { DistributorInsert } from '@/types/database'

/**
 * GET /api/distributors
 * Get all distributors (optionally grouped by zone)
 * Query params:
 *   - grouped: 'true' to get distributors grouped by zone
 *   - includeInactive: 'true' to include inactive distributors
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const grouped = searchParams.get('grouped') === 'true'
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    if (grouped) {
      const data = await getDistributorsByZone()
      return NextResponse.json(data)
    }
    
    const data = await getAllDistributors(includeInactive)
    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/distributors error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch distributors' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/distributors
 * Create a new distributor
 */
export async function POST(request: Request) {
  try {
    const body: DistributorInsert = await request.json()
    
    // Validation
    if (!body.zone_id || !body.name || !body.address || !body.locality) {
      return NextResponse.json(
        { error: 'Missing required fields: zone_id, name, address, locality' },
        { status: 400 }
      )
    }
    
    const distributor = await createDistributor(body)
    return NextResponse.json(distributor, { status: 201 })
  } catch (error) {
    console.error('POST /api/distributors error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create distributor' },
      { status: 500 }
    )
  }
}
