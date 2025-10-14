import { getAccessories } from '@/features/accessories/queries'
import AccessoryList from '@/components/accessories/AccessoryList'

export const metadata = {
  title: 'Lista de Accesorios | Admin',
  description: 'Gestión de accesorios',
}

export default async function AccessoriesListPage() {
  const accessories = await getAccessories()

  return (
    <div className="space-y-6">
      <AccessoryList accessories={accessories} />
    </div>
  )
}
