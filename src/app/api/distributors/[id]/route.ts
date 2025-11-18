import { NextResponse } from 'next/server'
import { 
  getDistributorById, 
  updateDistributor, 
  deleteDistributor 
} from '@/features/distributors/queries'
import type { DistributorUpdate } from '@/types/database'

/**
 * GET /api/distributors/[id]
 * Get a distributor by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const distributorId = parseInt(id)
    
    if (isNaN(distributorId)) {
      return NextResponse.json(
        { error: 'Invalid distributor ID' },
        { status: 400 }
      )
    }
    
    const distributor = await getDistributorById(distributorId)
    
    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(distributor)
  } catch (error) {
    console.error('GET /api/distributors/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch distributor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/distributors/[id]
 * Update a distributor
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const distributorId = parseInt(id)
    
    if (isNaN(distributorId)) {
      return NextResponse.json(
        { error: 'Invalid distributor ID' },
        { status: 400 }
      )
    }
    
    const body: DistributorUpdate = await request.json()
    const distributor = await updateDistributor(distributorId, body)
    
    return NextResponse.json(distributor)
  } catch (error) {
    console.error('PUT /api/distributors/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update distributor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/distributors/[id]
 * Delete a distributor
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const distributorId = parseInt(id)
    
    if (isNaN(distributorId)) {
      return NextResponse.json(
        { error: 'Invalid distributor ID' },
        { status: 400 }
      )
    }
    
    await deleteDistributor(distributorId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/distributors/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete distributor' },
      { status: 500 }
    )
  }
}
