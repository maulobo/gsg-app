import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { VariantCreateForm } from '@/components/products/VariantCreateForm'

async function getProduct(code: string) {
  const supabase = await createServerSupabaseClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('id, code, name')
    .eq('code', code)
    .single()

  if (error || !product) {
    console.error('[getProduct] Error:', error)
    return null
  }

  return product
}

async function getLightTones() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('light_tones')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching light tones:', error)
    return []
  }

  return data || []
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.code)
  
  return {
    title: product ? `Nueva Variante - ${product.name}` : 'Nueva Variante',
    description: 'Crear nueva variante del producto',
  }
}

export default async function NewVariantPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params
  const [product, lightTones] = await Promise.all([
    getProduct(resolvedParams.code),
    getLightTones()
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href={`/products/${resolvedParams.code}`} className="hover:text-brand-600 dark:hover:text-brand-400">
            {product.name}
          </a>
          <span>/</span>
          <span>Nueva Variante</span>
        </div>
        <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
          Crear Nueva Variante
        </h1>
        <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
          Agrega una nueva variante al producto
        </p>
      </div>
      
      <VariantCreateForm 
        product={product}
        productCode={resolvedParams.code}
        lightTones={lightTones}
      />
    </div>
  )
}
