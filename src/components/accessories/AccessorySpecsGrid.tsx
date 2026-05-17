'use client'

import type { AccessorySpecs } from '@/features/accessories/types'

interface SpecItem {
  icon: React.ReactNode
  label: string
  value: string | number | null | undefined
  unit?: string
  sublabel?: string
  color: string
  visible?: boolean
}

interface Props {
  watt: number | null
  amperage: number | null
  voltageLabel: string | null
  voltageMin: number | null
  voltageMax: number | null
  specs: AccessorySpecs | null
  lightTones: { id: number; name: string; kelvin?: number | null }[]
  finishes: { id: number; name: string; hex_color?: string | null }[]
}

export default function AccessorySpecsGrid({
  watt,
  amperage,
  voltageLabel,
  voltageMin,
  voltageMax,
  specs,
  lightTones,
  finishes,
}: Props) {
  const sp = specs || {}

  const items: SpecItem[] = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Potencia',
      value: watt,
      unit: 'W',
      sublabel: sp.power_24v_raw || sp.power_12v_raw ? `12V: ${sp.power?.['12v_w'] ?? '-'}W / 24V: ${sp.power?.['24v_w'] ?? '-'}W` : undefined,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400 border-amber-100 dark:border-amber-800',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Potencia 12V',
      value: sp.power?.['12v_w'],
      unit: 'W',
      visible: sp.power?.['12v_w'] != null,
      color: 'bg-amber-50/70 text-amber-600 dark:bg-amber-900/5 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Potencia 24V',
      value: sp.power?.['24v_w'],
      unit: 'W',
      visible: sp.power?.['24v_w'] != null,
      color: 'bg-amber-50/70 text-amber-600 dark:bg-amber-900/5 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      label: 'Voltaje',
      value: voltageLabel,
      unit: 'V',
      sublabel: voltageMin && voltageMax ? `Rango ${voltageMin}V - ${voltageMax}V` : undefined,
      color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/10 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      label: 'Amperaje',
      value: amperage,
      unit: 'A',
      sublabel: sp.amperage_24v_raw || sp.amperage_12v_raw ? `12V: ${sp.amperage?.['12v_a'] ?? '-'}A / 24V: ${sp.amperage?.['24v_a'] ?? '-'}A` : undefined,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      label: 'Amperaje 12V',
      value: sp.amperage?.['12v_a'],
      unit: 'A',
      visible: sp.amperage?.['12v_a'] != null,
      color: 'bg-emerald-50/70 text-emerald-600 dark:bg-emerald-900/5 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      label: 'Amperaje 24V',
      value: sp.amperage?.['24v_a'],
      unit: 'A',
      visible: sp.amperage?.['24v_a'] != null,
      color: 'bg-emerald-50/70 text-emerald-600 dark:bg-emerald-900/5 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      label: 'Señal / Tipo',
      value: sp.signal_type,
      visible: !!sp.signal_type,
      color: 'bg-sky-50 text-sky-600 dark:bg-sky-900/10 dark:text-sky-400 border-sky-100 dark:border-sky-800',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      label: 'Alcance / Total',
      value: sp.reach_or_total,
      visible: !!sp.reach_or_total,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      label: 'LED / Tipo',
      value: sp.led_type,
      visible: !!sp.led_type,
      color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/10 dark:text-violet-400 border-violet-100 dark:border-violet-800',
    },
  ]

  const visibleItems = items.filter((i) => i.visible !== false && i.value != null && i.value !== '')

  const hasContent = visibleItems.length > 0 || lightTones.length > 0 || finishes.length > 0

  if (!hasContent) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Especificaciones Técnicas
        </h2>
      </div>
      <div className="p-6">
        {/* Grid de specs */}
        {visibleItems.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl border p-4 ${item.color}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-black/20">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium opacity-70">{item.label}</p>
                  <p className="text-lg font-bold">
                    {item.value}{item.unit ? ` ${item.unit}` : ''}
                  </p>
                  {item.sublabel && (
                    <p className="text-xs opacity-60 truncate">{item.sublabel}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tonos de luz */}
        {lightTones.length > 0 && (
          <div className={`${visibleItems.length > 0 ? 'mt-6' : ''}`}>
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Tonos de luz compatibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {lightTones.map((tone) => (
                <span
                  key={tone.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: getKelvinColor(tone.kelvin),
                      boxShadow: `0 0 6px ${getKelvinColor(tone.kelvin)}`,
                    }}
                  />
                  {tone.name}
                  {tone.kelvin && (
                    <span className="text-xs opacity-70">({tone.kelvin}K)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Acabados */}
        {finishes.length > 0 && (
          <div className={`${visibleItems.length > 0 || lightTones.length > 0 ? 'mt-6' : ''}`}>
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Acabados disponibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {finishes.map((finish) => (
                <span
                  key={finish.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                >
                  {finish.hex_color && (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: finish.hex_color }}
                    />
                  )}
                  {finish.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getKelvinColor(kelvin: number | null | undefined): string {
  if (!kelvin) return '#9CA3AF'
  if (kelvin >= 2700 && kelvin <= 3200) return '#FDB813'
  if (kelvin > 3200 && kelvin <= 4500) return '#FFF4E0'
  if (kelvin > 4500 && kelvin <= 5500) return '#FFFFFF'
  if (kelvin > 5500) return '#E0F0FF'
  if (kelvin === 0) return '#9CA3AF'
  return '#9CA3AF'
}
