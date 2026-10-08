import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPowerSupplyByCode } from '@/features/power-supplies/queries'
import PowerSupplyForm from '@/components/power-supplies/PowerSupplyForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const ps = await getPowerSupplyByCode(code)
  return { title: ps?.name ? `Editar ${ps.name}` : 'Editar Fuente' }
}

export default async function EditPowerSupplyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const powerSupply = await getPowerSupplyByCode(code)

  if (!powerSupply) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Fuente</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{powerSupply.name}</p>
      </div>
      <PowerSupplyForm powerSupply={powerSupply} />
    </div>
  )
}
