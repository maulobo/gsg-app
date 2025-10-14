'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessoryListItem } from '@/features/accessories/types'

type LightTone = {
  id: number
  name: string
  slug: string
}

type AccessoriesDashboardProps = {
  accessories: AccessoryListItem[]
  lightTones: LightTone[]
}

export function AccessoriesDashboard({ accessories, lightTones }: AccessoriesDashboardProps) {
  const router = useRouter()

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalAccessories = accessories.length

    // Accesorios por tono de luz
    const accessoriesByTone = lightTones.map(tone => ({
      name: tone.name,
      count: accessories.filter(acc => 
        acc.light_tones?.some(t => t.id === tone.id)
      ).length,
      id: tone.id
    })).filter(t => t.count > 0)

    // Tono con más accesorios
    const topTone = accessoriesByTone.length > 0
      ? accessoriesByTone.reduce((max, tone) => tone.count > max.count ? tone : max)
      : null

    // Accesorios con watt
    const withWatt = accessories.filter(a => a.watt !== null && a.watt !== undefined).length

    // Accesorios con voltage
    const withVoltage = accessories.filter(a => a.voltage_label !== null).length

    // Total de acabados únicos
    const allFinishes = new Set<number>()
    accessories.forEach(acc => {
      acc.finishes?.forEach(f => allFinishes.add(f.id))
    })
    const totalFinishes = allFinishes.size

    // Total de tonos únicos usados
    const usedTones = accessoriesByTone.length

    return {
      totalAccessories,
      accessoriesByTone,
      topTone,
      withWatt,
      withVoltage,
      totalFinishes,
      usedTones
    }
  }, [accessories, lightTones])

  // Accesorios recientes (últimos 5)
  const recentAccessories = useMemo(() => {
    return [...accessories]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5)
  }, [accessories])

  // Colores para el gráfico
  const chartColors = [
    'bg-brand-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-md font-bold text-gray-900 dark:text-white">
            Dashboard de Accesorios
          </h1>
          <p className="text-theme-sm text-gray-600 dark:text-gray-400 mt-1">
            Resumen y estadísticas de tu inventario de accesorios
          </p>
        </div>
        <button
          onClick={() => router.push('/accessories/list')}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        >
          Ver Todos los Accesorios
        </button>
      </div>

      {/* Cards de métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Accesorios */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Accesorios
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalAccessories}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/[0.12]">
              <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {stats.usedTones} tipos de tonos
            </span>
          </div>
        </div>

        {/* Con Especificaciones Watt */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Con Potencia
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.withWatt}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/[0.12]">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {((stats.withWatt / stats.totalAccessories) * 100).toFixed(0)}% del total
            </span>
          </div>
        </div>

        {/* Con Voltaje */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Con Voltaje
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.withVoltage}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-500/[0.12]">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {((stats.withVoltage / stats.totalAccessories) * 100).toFixed(0)}% especificados
            </span>
          </div>
        </div>

        {/* Acabados */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Acabados
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalFinishes}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/[0.12]">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats.topTone && (
              <span className="text-gray-600 dark:text-gray-400">
                Top: {stats.topTone.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accesorios por Tono de Luz */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accesorios por Tono de Luz
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.accessoriesByTone.map((tone, index) => {
                const percentage = (tone.count / stats.totalAccessories) * 100
                return (
                  <div key={tone.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {tone.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {tone.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full ${chartColors[index % chartColors.length]} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {stats.accessoriesByTone.length === 0 && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
                  No hay datos de tonos de luz
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Accesorios Recientes */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accesorios Recientes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAccessories.map((accessory) => (
                <div
                  key={accessory.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {accessory.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {accessory.code}
                      </span>
                      {accessory.watt && (
                        <>
                          <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {accessory.watt}W
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    {accessory.light_tones && accessory.light_tones.length > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                        {accessory.light_tones[0].name}
                      </span>
                    )}
                    <button
                      onClick={() => router.push(`/accessories/${accessory.code}`)}
                      className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {recentAccessories.length === 0 && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
                No hay accesorios recientes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Accesos Rápidos
          </h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/accessories/new')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Nuevo Accesorio
              </span>
            </button>
            <button
              onClick={() => router.push('/accessories/list')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Ver Lista
              </span>
            </button>
            <button
              onClick={() => router.push('/finishes')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/[0.06]"
            >
              <svg className="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Gestionar Acabados
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
