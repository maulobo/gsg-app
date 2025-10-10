import { Metadata } from 'next'
import { getCategories } from '@/features/categories/queries'
import { getFinishes } from '@/features/finishes/queries'
import { getLightTones } from '@/features/light-tones/queries'
import { ProductCreationForm } from '@/components/products/ProductCreationForm'

export const metadata: Metadata = {
  title: 'Crear Producto | Dashboard',
  description: 'Crear nuevo producto con variantes y configuraciones',
}

export default async function CreateProductPage() {
  // Fetch all necessary data
  const [categories, finishes, lightTones] = await Promise.all([
    getCategories(),
    getFinishes(),
    getLightTones(),
  ])

  return (
    <ProductCreationForm
      categories={categories}
      finishes={finishes}
      lightTones={lightTones}
    />
  )
}
