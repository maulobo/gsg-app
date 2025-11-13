import { Metadata } from 'next'
import { FeaturedProductsManager } from '@/components/products/FeaturedProductsManager'

export const metadata: Metadata = {
  title: 'Productos Destacados | Admin',
  description: 'Gestiona los productos destacados que aparecen en el home',
}

export default function FeaturedProductsPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
          Productos Destacados
        </h1>
        <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
          Selecciona hasta 3 productos para destacar en el home de la web
        </p>
      </div>

      <FeaturedProductsManager />
    </div>
  )
}
