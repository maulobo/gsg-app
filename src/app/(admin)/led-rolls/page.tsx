import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export const metadata = {
  title: 'Rollos LED | Admin',
  description: 'Gestión de familias de rollos/tiras LED y sus variantes',
}

type FamilyListItem = {
  id: number
  name: string
  description: string | null
  led_type: string | null
  cri: number | null
  pcb_width_mm: number | null
  warranty_years: number
  dimmable: boolean
  roll_length_m: number | null
  variants: { count: number }[]
  media: { path: string; kind: string }[]
}

export default async function LedRollsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: families, error } = await supabase
    .from('led_roll_families')
    .select(`
      id,
      name,
      description,
      led_type,
      cri,
      pcb_width_mm,
      warranty_years,
      dimmable,
      roll_length_m,
      variants:led_rolls(count),
      media:led_roll_family_media(path, kind)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const rolls = (families || []) as unknown as FamilyListItem[]
  const totalVariants = rolls.reduce((acc, r) => {
    const count = Array.isArray(r.variants) ? r.variants[0]?.count || 0 : 0
    return acc + count
  }, 0)
  const uniqueTypes = new Set(rolls.map(r => r.led_type).filter(Boolean))

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rollos LED
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Familias de rollos LED con sus variantes (SKUs)
          </p>
        </div>
        <Link
          href="/led-rolls/new"
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          + Nueva Familia
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-dark dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Familias</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{rolls.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-dark dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Variantes (SKUs)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{totalVariants}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-dark dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipos LED</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{uniqueTypes.size}</p>
        </div>
      </div>

      {/* Grid */}
      {rolls.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:bg-gray-900 dark:border-gray-700">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay familias de LED creadas todavía
          </p>
          <Link
            href="/led-rolls/new"
            className="inline-block rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Crear primera familia LED
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolls.map((roll) => {
            const coverImage = roll.media?.find((m) => m.kind === 'cover')?.path
            const variantCount = Array.isArray(roll.variants) ? roll.variants[0]?.count || 0 : 0

            return (
              <Link
                key={roll.id}
                href={`/led-rolls/${roll.id}/edit`}
                className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-brand-400 hover:shadow-lg transition-all dark:bg-gray-dark dark:border-gray-800 dark:hover:border-brand-500"
              >
                {/* Image */}
                {coverImage ? (
                  <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                      src={coverImage}
                      alt={roll.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-brand-600 transition-colors">
                    {roll.name}
                  </h3>

                  {roll.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {roll.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {roll.led_type && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {roll.led_type}
                      </span>
                    )}
                    {roll.cri && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        CRI {roll.cri}
                      </span>
                    )}
                    {roll.dimmable && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Dimm
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{variantCount}</span> variante{variantCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-brand-500 font-medium group-hover:text-brand-600 transition-colors">
                      Editar →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
