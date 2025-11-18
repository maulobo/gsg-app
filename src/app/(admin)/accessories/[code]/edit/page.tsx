import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAccessoryByCode } from '@/features/accessories/queries'
import { getFinishes } from '@/features/finishes/queries'
import { getLightTones } from '@/features/light-tones/queries'
import AccessoryEditForm from '@/components/accessories/AccessoryEditForm'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const accessory = await getAccessoryByCode(resolvedParams.code)
  return {
    title: accessory?.name ? `Editar ${accessory.name}` : 'Editar Accesorio',
    description: 'Editar información del accesorio',
  }
}

export default async function AccessoryEditPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params
  
  // Cargar datos en paralelo
  const [accessory, finishes, lightTones] = await Promise.all([
    getAccessoryByCode(resolvedParams.code),
    getFinishes(),
    getLightTones(),
  ])

  if (!accessory) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Accesorio</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Actualiza la información del accesorio {accessory.name}
        </p>
      </div>
      
      <AccessoryEditForm 
        accessory={accessory} 
        finishes={finishes}
        lightTones={lightTones}
      />
    </div>
  )
}
