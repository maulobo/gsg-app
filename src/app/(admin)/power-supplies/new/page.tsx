import PowerSupplyForm from '@/components/power-supplies/PowerSupplyForm'

export const metadata = {
  title: 'Nueva Fuente | Admin',
  description: 'Crear una nueva fuente LED',
}

export default function NewPowerSupplyPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Nueva Fuente</h1>
      </div>
      <PowerSupplyForm />
    </div>
  )
}
