import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllZones, getDistributorById } from '@/features/distributors/queries'
import { DistributorForm } from '@/components/distributors/DistributorForm'

export const metadata: Metadata = {
  title: 'Editar Distribuidor - GSG Admin',
  description: 'Editar información del distribuidor',
}

type EditDistributorPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditDistributorPage({ params }: EditDistributorPageProps) {
  const { id } = await params
  const distributorId = parseInt(id)

  if (isNaN(distributorId)) {
    notFound()
  }

  const [zones, distributorData] = await Promise.all([
    getAllZones(),
    getDistributorById(distributorId)
  ])

  if (!distributorData) {
    notFound()
  }

  // Extract the distributor without the zone relation
  const { zone, ...distributor } = distributorData

  return <DistributorForm zones={zones} distributor={distributor} mode="edit" />
}
