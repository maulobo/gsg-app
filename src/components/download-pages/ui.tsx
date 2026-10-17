export const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500'
export const labelCls = 'mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300'
export const btnPrimaryCls =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50'
export const btnSecondaryCls =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5'
export const iconBtnCls =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'

/**
 * Tarjeta de sección. `step` numera los pasos del flujo (datos → PDFs → QR).
 */
export function Card({
  title,
  step,
  hint,
  aside,
  children,
}: {
  title: string
  step?: number
  hint?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <header className="flex items-start gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        {step !== undefined && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            {step}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-4 p-6">{children}</div>
    </section>
  )
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-success-500' : 'bg-gray-400'}`} />
      {active ? 'Activa' : 'Inactiva'}
    </span>
  )
}
