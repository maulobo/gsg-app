import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductByCode } from '@/features/products/queries'
import { ProductEditForm } from '@/components/products/ProductEditForm'


export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProductByCode(resolvedParams.code)
  return {
    title: product?.name ? `Editar ${product.name}` : 'Editar Producto',
    description: 'Editar información del producto',
  }
}

export default async function ProductEditPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params
  const product = await getProductByCode(resolvedParams.code)

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Producto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Actualiza la información del producto {product.name}
        </p>
      </div>
      
      <ProductEditForm product={product} />
    </div>
  )
}
