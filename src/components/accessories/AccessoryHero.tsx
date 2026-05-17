'use client'

interface AccessoryHeroProps {
  name: string
  code: string
  tipo: string | null
  description: string | null
  photoUrl: string | null
  notes: string | null
  datasheet: { path: string; alt_text: string | null } | undefined
  editHref: string
}

export default function AccessoryHero({
  name,
  code,
  tipo,
  description,
  photoUrl,
  notes,
  datasheet,
  editHref,
}: AccessoryHeroProps) {
  const tipoColors: Record<string, string> = {
    'Dimmers': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    'Controladoras': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    'Amplificadores': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    'Sensores': 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
    'Cargadores': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    'Conectores': 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }

  const tipoClass = tipo ? (tipoColors[tipo] || tipoColors['Conectores']) : ''

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Imagen */}
        <div className="relative bg-gray-50 dark:bg-white/[0.02]">
          {photoUrl ? (
            <div className="h-64 sm:h-80 lg:h-full">
              <img
                src={photoUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-64 sm:h-80 lg:h-full items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Sin imagen</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {tipo && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tipoClass}`}>
                  {tipo}
                </span>
              )}
              <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {name}
              </h1>
              <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
                {code}
              </p>
            </div>
            <a
              href={editHref}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </a>
          </div>

          {description && (
            <div className="mt-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Notas técnicas */}
          {notes && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Notas técnicas
                  </p>
                  <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                    {notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Datasheet PDF */}
          {datasheet && (
            <div className="mt-auto pt-6">
              <a
                href={datasheet.path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-900/10 dark:hover:text-brand-400 sm:w-auto"
              >
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Descargar ficha técnica (PDF)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
