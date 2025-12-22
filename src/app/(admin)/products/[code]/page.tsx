import { Metadata } from 'next'
import { getProduct } from '@/lib/products'
import { getProductAddons } from '@/features/products/queries/addons'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.code)
  return {
    title: product?.name ? `${product.name} | Product` : 'Product',
    description: product?.description ?? 'Product detail',
  }
}


export default async function ProductPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params
 const product = await getProduct(resolvedParams.code)

 console.log('=== VARIANTES CON IMÁGENES ===')
 console.log(product?.product_variants?.map(v => ({
   id: v.id,
   name: v.name,
   images: v.media_assets?.map(img => ({ kind: img.kind, path: img.path }))
 })))
 
 if(!product) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
        <p className="text-sm text-muted-foreground">El producto con código "{resolvedParams.code}" no existe.</p>
      </div>
    )
 }

  // Obtener addons del producto
  const addons = await getProductAddons(product.id)

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header con botón de editar */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-title-md font-bold text-gray-900 dark:text-white">{product.name}</h1>
          <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
            Código: {product.code} {product.category && `· ${product.category.name}`}
          </p>
        </div>
        <a
          href={`/products/${product.code}/edit`}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar Producto
        </a>
      </div>



      {/* Acabados a nivel de producto */}
      {product.product_finishes && product.product_finishes.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Acabados Disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {product.product_finishes.map((pf: any) => (
              <span key={pf.finish.id} className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                {pf.finish.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Addons/Complementos */}
      {addons && addons.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accesorios y Complementos</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <div key={addon.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {addon.name}
                  </h4>
                  <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                    {addon.category === 'control' && '🎛️ Control'}
                    {addon.category === 'installation' && '🔧 Instalación'}
                    {addon.category === 'driver' && '⚡ Driver'}
                    {addon.category === 'accessory' && '🔌 Accesorio'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono">
                  {addon.code}
                </p>
                {addon.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {addon.description}
                  </p>
                )}
                {addon.specs && Object.keys(addon.specs).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(addon.specs).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {addon.price && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${addon.price.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variantes */}
      <section className="grid gap-6">
        {product.product_variants?.map((v: any) => {
          const tones = (v.variant_light_tones ?? [])
            .map((vt: any) => vt.light_tone)
            .filter(Boolean)

          // Obtener imágenes de la variante
          const coverImage = v.media_assets?.find((m: any) => m.kind === 'cover')
          const techImage = v.media_assets?.find((m: any) => m.kind === 'tech')
          const datasheetPdf = v.media_assets?.find((m: any) => m.kind === 'datasheet')
          const specPdf = v.media_assets?.find((m: any) => m.kind === 'spec')

          return (
            <div key={v.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
              {/* Header de la variante */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{v.name}</h2>
                {v.variant_code && (
                  <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
                    Código: {v.variant_code}
                  </p>
                )}
              </div>

              <div className="p-6">
                {/* Imágenes de la variante */}
                {(coverImage || techImage) && (
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    {coverImage && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Imagen de portada
                        </h4>
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                          <img
                            className="h-48 w-full object-cover"
                            src={coverImage.path}
                            alt={coverImage.alt_text || `Portada de ${v.name}`}
                          />
                        </div>
                      </div>
                    )}
                    
                    {techImage && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Imagen técnica
                        </h4>
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                          <img
                            className="h-48 w-full object-cover"
                            src={techImage.path}
                            alt={techImage.alt_text || `Imagen técnica de ${v.name}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* PDFs de la variante */}
                {(datasheetPdf || specPdf) && (
                  <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Documentos</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {datasheetPdf && (
                        <a
                          href={datasheetPdf.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500 dark:hover:bg-brand-900/20"
                        >
                          <svg className="h-8 w-8 flex-shrink-0 text-error-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,19H16.5V18H18.5V19M18.5,17H16.5V14H18.5V17M13,19H11V18H13V19M13,17H11V14H13V17M15,13H5V11H15V13M13,9V3.5L18.5,9H13Z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Cartilla Técnica</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {datasheetPdf.path.split('/').pop()?.split('-').slice(2).join('-') || 'datasheet.pdf'}
                            </p>
                          </div>
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      
                      {specPdf && (
                        <a
                          href={specPdf.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500 dark:hover:bg-brand-900/20"
                        >
                          <svg className="h-8 w-8 flex-shrink-0 text-error-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,19H16.5V18H18.5V19M18.5,17H16.5V14H18.5V17M13,19H11V18H13V19M13,17H11V14H13V17M15,13H5V11H15V13M13,9V3.5L18.5,9H13Z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Especificaciones</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {specPdf.path.split('/').pop()?.split('-').slice(2).join('-') || 'spec.pdf'}
                            </p>
                          </div>
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {!coverImage && !techImage && (
                  <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 6 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      No hay imágenes disponibles para esta variante
                    </p>
                  </div>
                )}
              
                {/* Badges */}
                {(v.includes_led || v.includes_driver) && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {v.includes_led && (
                      <span className="inline-flex items-center rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-500/[0.12] dark:text-success-400">
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        LED incluido
                      </span>
                    )}
                    {v.includes_driver && (
                      <span className="inline-flex items-center rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-500/[0.12] dark:text-success-400">
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Driver incluido
                      </span>
                    )}
                  </div>
                )}

                {/* Tonos de luz */}
                {!!tones.length && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Tonos de luz
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tones.map((t: any) => (
                        <span key={t.id} className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {t.name}
                          {t.kelvin && (
                            <span className="ml-1 text-gray-600 dark:text-gray-400">
                              ({t.kelvin}K)
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configuraciones */}
                {!!v.variant_configurations?.length && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Configuraciones disponibles
                    </h4>
                    <div className="space-y-3">
                      {v.variant_configurations.map((c: any) => (
                        <div key={c.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                          {c.name && (
                            <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                              {c.name}
                            </div>
                          )}
                          {c.sku && (
                            <div className="mb-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                              SKU: {c.sku}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center text-gray-900 dark:text-white">
                              <span className="font-medium">Potencia:</span>
                              <span className="ml-2 text-gray-700 dark:text-gray-300">{c.watt}W</span>
                            </div>
                            <div className="flex items-center text-gray-900 dark:text-white">
                              <span className="font-medium">Lúmenes:</span>
                              <span className="ml-2 text-gray-700 dark:text-gray-300">{c.lumens} lm</span>
                            </div>
                            {c.voltage && (
                              <div className="flex items-center text-gray-900 dark:text-white">
                                <span className="font-medium">Voltaje:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{c.voltage}V</span>
                              </div>
                            )}
                            {c.diameter_description && (
                              <div className="flex items-center text-gray-900 dark:text-white">
                                <span className="font-medium">Diámetro:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{c.diameter_description}</span>
                              </div>
                            )}
                            {c.length_cm && (
                              <div className="flex items-center text-gray-900 dark:text-white">
                                <span className="font-medium">Largo:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{c.length_cm}</span>
                              </div>
                            )}
                            {c.width_cm && (
                              <div className="flex items-center text-gray-900 dark:text-white">
                                <span className="font-medium">Ancho:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{c.width_cm}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
