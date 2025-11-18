import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAccessoryByCode } from '@/features/accessories/queries'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const accessory = await getAccessoryByCode(resolvedParams.code)
  
  return {
    title: accessory?.name ? `${accessory.name} | Accesorio` : 'Accesorio',
    description: accessory?.description ?? 'Detalle del accesorio',
  }
}

export default async function AccessoryDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params
  const accessory = await getAccessoryByCode(resolvedParams.code)

  if (!accessory) {
    notFound()
  }

  // Extraer tonos de luz
  const lightTones = (accessory.accessory_light_tones ?? [])
    .map((rel: any) => rel.light_tone)
    .filter(Boolean)

  // Extraer acabados
  const finishes = (accessory.accessory_finishes ?? [])
    .map((rel: any) => rel.finish)
    .filter(Boolean)

  // Extraer imágenes
  const techImages = (accessory.accessory_media ?? []).filter((m: any) => m.kind === 'tech')

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header con botón de editar */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
            {accessory.name}
          </h1>
          <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
            Código: {accessory.code}
          </p>
        </div>
        <a
          href={`/accessories/${accessory.code}/edit`}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar Accesorio
        </a>
      </div>

      {/* Descripción */}
      {accessory.description && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Descripción
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {accessory.description}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Especificaciones Técnicas */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Especificaciones Técnicas
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {accessory.watt && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/[0.12]">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Potencia
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Watts
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {accessory.watt}W
                  </p>
                </div>
              )}

              {accessory.voltage_label && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-500/[0.12]">
                      <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Voltaje
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {accessory.voltage_min && accessory.voltage_max && (
                          <span>Rango: {accessory.voltage_min}V - {accessory.voltage_max}V</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {accessory.voltage_label}V
                  </p>
                </div>
              )}

              {!accessory.watt && !accessory.voltage_label && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No hay especificaciones técnicas disponibles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Características */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Características
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Tonos de luz */}
            {lightTones.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Tonos de luz compatibles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {lightTones.map((tone: any) => (
                    <span
                      key={tone.id}
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    >
                      {tone.name}
                      {tone.kelvin && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-500">
                          ({tone.kelvin}K)
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Acabados */}
            {finishes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Acabados disponibles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {finishes.map((finish: any) => (
                    <span
                      key={finish.id}
                      className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                    >
                      {finish.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lightTones.length === 0 && finishes.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay características adicionales
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Imágenes Técnicas */}
      {techImages.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Imágenes Técnicas
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {techImages.map((img: any) => (
                <div key={img.id} className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                    <img
                      className="h-48 w-full object-cover"
                      src={img.path}
                      alt={img.alt_text || `Imagen técnica de ${accessory.name}`}
                    />
                  </div>
                  {img.alt_text && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {img.alt_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Foto del producto (si existe) */}
      {accessory.photo_url && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Imagen del Producto
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
              <img
                className="h-64 w-full object-cover"
                src={accessory.photo_url}
                alt={accessory.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
