import { Metadata } from 'next'
import { FeaturedItemsManager } from '@/components/products/FeaturedItemsManager'

export const metadata: Metadata = {
  title: 'Items Destacados | Admin',
  description: 'Gestiona los items destacados que aparecen en el home',
}

export default function FeaturedItemsPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
          Items Destacados
        </h1>
        <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
          Gestiona hasta 3 items destacados para el home (título + imagen + enlace)
        </p>
      </div>

      <FeaturedItemsManager />
    </div>
  )
}
