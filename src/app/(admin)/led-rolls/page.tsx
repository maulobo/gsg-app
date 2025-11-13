import { getLedRollsListItems } from '@/features/led-rolls/queries'
import Link from 'next/link'

export const metadata = {
  title: 'Rollos LED | Admin',
  description: 'Gestión de rollos/tiras LED',
}

export default async function LedRollsPage() {
  const rolls = await getLedRollsListItems()

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rollos LED
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona el catálogo de tiras/rollos LED
          </p>
        </div>
        <Link
          href="/led-rolls/new"
          className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors shadow-theme-sm"
        >
          + Nuevo Rollo LED
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Rollos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rolls.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Modelos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {rolls.reduce((acc, r) => acc + r.models_count, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Tipologías</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {new Set(rolls.map(r => r.typology).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Lista de rollos */}
      {rolls.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:bg-gray-900 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay rollos LED creados todavía
          </p>
          <Link
            href="/led-rolls/new"
            className="inline-block rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors"
          >
            Crear primer rollo LED
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolls.map((roll) => (
            <Link
              key={roll.id}
              href={`/led-rolls/${roll.code}/edit`}
              className="group rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-500 hover:shadow-lg transition-all dark:bg-gray-dark dark:border-gray-800 dark:hover:border-brand-400"
            >
              {/* Imagen */}
              {roll.cover_image ? (
                <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                  <img
                    src={roll.cover_image}
                    alt={roll.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="mb-3 aspect-video w-full rounded-md bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                      {roll.code}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {roll.name}
                    </h3>
                  </div>
                </div>

                {roll.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {roll.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {roll.typology && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-light-100 text-blue-light-700 rounded dark:bg-blue-light-950 dark:text-blue-light-400">
                      {roll.typology}
                    </span>
                  )}
                  {roll.color_control && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded dark:bg-purple-950 dark:text-purple-400">
                      {roll.color_control}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{roll.models_count}</span> modelo{roll.models_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
