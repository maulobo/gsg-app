import { Metadata } from 'next'
import { getAccessories } from '@/features/accessories/queries'
import { getLightTones } from '@/features/light-tones/queries'
import { AccessoriesDashboard } from '@/components/accessories/AccessoriesDashboard'

export const metadata: Metadata = {
  title: 'Dashboard de Accesorios | Admin',
  description: 'Resumen y estadísticas de accesorios',
}

export default async function AccessoriesPage() {
  const [accessories, lightTones] = await Promise.all([
    getAccessories(),
    getLightTones()
  ])

  return (
    <div className="p-6">
      <AccessoriesDashboard accessories={accessories} lightTones={lightTones} />
    </div>
  )
}
