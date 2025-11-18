import type { Metadata } from 'next'
import { getAllZones } from '@/features/distributors/queries'
import { DistributorForm } from '@/components/distributors/DistributorForm'

export const metadata: Metadata = {
  title: 'Nuevo Distribuidor - GSG Admin',
  description: 'Crear un nuevo distribuidor autorizado',
}

export default async function NewDistributorPage() {
  const zones = await getAllZones()

  return <DistributorForm zones={zones} mode="create" />
}
