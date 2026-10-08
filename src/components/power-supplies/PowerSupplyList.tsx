'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PowerSupplyFull } from '@/features/power-supplies/types'

export default function PowerSupplyList({ powerSupplies }: { powerSupplies: PowerSupplyFull[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return powerSupplies
    return powerSupplies.filter(
      (ps) =>
        ps.name.toLowerCase().includes(q) ||
        ps.code.toLowerCase().includes(q) ||
        ps.power_supply_models.some((m) => m.code.toLowerCase().includes(q))
    )
  }, [search, powerSupplies])

  const handleDelete = async (ps: PowerSupplyFull) => {
    if (!confirm(`¿Eliminar "${ps.name}" y todos sus modelos e imágenes?`)) return
    setDeleting(ps.code)
    try {
      const res = await fetch(`/api/power-supplies/${ps.code}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fuentes LED</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {powerSupplies.length} fuentes ·{' '}
            {powerSupplies.reduce((n, ps) => n + ps.power_supply_models.length, 0)} modelos
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:w-72 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <Link
            href="/power-supplies/new"
            className="whitespace-nowrap rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            + Crear fuente
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Serie</th>
              <th className="px-4 py-3">Potencia</th>
              <th className="px-4 py-3">Modelos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No hay fuentes
                </td>
              </tr>
            )}
            {filtered.map((ps) => (
              <tr key={ps.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-50 dark:bg-gray-800">
                      {ps.photo_url && <img src={ps.photo_url} alt={ps.name} className="h-full w-full object-contain" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{ps.name}</p>
                      <p className="text-xs text-gray-500">{ps.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ps.series || '-'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ps.power_w ? `${ps.power_w} W` : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ps.power_supply_models.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        title={m.code}
                      >
                        {m.output_v}V · {m.current_a ?? '-'}A
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      ps.is_active
                        ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {ps.is_active ? 'Visible' : 'Oculta'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/power-supplies/${ps.code}/edit`}
                      className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(ps)}
                      disabled={deleting === ps.code}
                      className="rounded-lg px-3 py-1.5 text-sm text-error-600 hover:bg-error-50 disabled:opacity-50 dark:hover:bg-error-500/10"
                    >
                      {deleting === ps.code ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
