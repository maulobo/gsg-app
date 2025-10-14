import { Metadata } from 'next'
import { getProducts } from '@/features/products/queries'
import { getCategories } from '@/features/categories/queries'
import { ProductList } from '@/components/products/ProductList'

export const metadata: Metadata = {
  title: 'Productos | Dashboard',
  description: 'Listado de todos los productos',
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ])

  return (
    <div className="p-6">
      <ProductList products={products} categories={categories} />
    </div>
  )
}
