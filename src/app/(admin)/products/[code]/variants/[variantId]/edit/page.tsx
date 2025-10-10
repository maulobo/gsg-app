import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { VariantEditForm } from '@/components/products/VariantEditForm'


async function getVariant(productCode: string, variantId: string) {
  const supabase = await createServerSupabaseClient()

  // 1. Obtener la variante con product, light_tones y configurations
  const { data: variant, error } = await supabase
    .from('product_variants')
    .select(`
      *,
      product:products!inner (
        id,
        code,
        name
      ),
      variant_light_tones (
        light_tone:light_tones (
          id,
          slug,
          name,
          kelvin
        )
      ),
      variant_configurations (
        id,
        sku,
        watt,
        lumens,
        voltage,
        diameter_description,
        length_mm,
        width_mm,
        specs
      )
    `)
    .eq('id', variantId)
    .eq('products.code', productCode)
    .single()

  if (error) {
    console.error('[getVariant] Error fetching variant:', error)
    return null
  }

  // 2. Obtener las imágenes de esta variante por separado
  const { data: images, error: imagesError } = await supabase
    .from('media_assets')
    .select('id, path, kind, alt_text')
    .eq('variant_id', variantId)

  if (imagesError) {
    console.error('[getVariant] Error fetching images:', imagesError)
  }

  // 3. Asociar las imágenes a la variante
  return {
    ...variant,
    media_assets: images || []
  }
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

export async function generateMetadata({ params }: { params: { code: string; variantId: string } }): Promise<Metadata> {
  const resolvedParams = await params
  const variant = await getVariant(resolvedParams.code, resolvedParams.variantId)
  
  return {
    title: variant?.name ? `Editar ${variant.name}` : 'Editar Variante',
    description: 'Editar información de la variante del producto',
  }
}

export default async function VariantEditPage({ params }: { params: { code: string; variantId: string } }) {
  const resolvedParams = await params
  const [variant, lightTones] = await Promise.all([
    getVariant(resolvedParams.code, resolvedParams.variantId),
    getLightTones()
  ])

  if (!variant) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href={`/products/${resolvedParams.code}`} className="hover:text-brand-600 dark:hover:text-brand-400">
            {variant.product.name}
          </a>
          <span>/</span>
          <span>Editar Variante</span>
        </div>
        <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
          Editar Variante: {variant.name}
        </h1>
        <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
          Actualiza la información de la variante
        </p>
      </div>
      
      <VariantEditForm 
        variant={variant} 
        productCode={resolvedParams.code}
        lightTones={lightTones}
      />
    </div>
  )
}
