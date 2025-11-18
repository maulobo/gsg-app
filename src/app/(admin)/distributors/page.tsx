import type { Metadata } from 'next'
import { getAllDistributors } from '@/features/distributors/queries'
import { DistributorList } from '@/components/distributors/DistributorList'

export const metadata: Metadata = {
  title: 'Distribuidores - GSG Admin',
  description: 'Gestión de distribuidores autorizados',
}

export default async function DistributorsPage() {
  const distributors = await getAllDistributors(true)

  return <DistributorList distributors={distributors} />
}
