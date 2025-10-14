import AccessoryCreationForm from '@/components/accessories/AccessoryCreationForm'
import { getFinishes } from '@/features/finishes/queries'
import { getLightTones } from '@/features/light-tones/queries'


export const metadata = {
  title: 'Nuevo Accesorio | Admin',
  description: 'Crear un nuevo accesorio',
}

export default async function NewAccessoryPage() {
  const [finishes, lightTones] = await Promise.all([
    getFinishes(),
    getLightTones(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Accesorio
        </h1>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-6 shadow-theme-xs dark:border-stroke-dark dark:bg-gray-dark">
        <AccessoryCreationForm
          finishes={finishes}
          lightTones={lightTones}
        />
      </div>
    </div>
  )
}
