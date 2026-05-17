'use client'

import type { AccessorySpecs } from '@/features/accessories/types'

interface Props {
  specs: AccessorySpecs | null
}

export default function AccessoryVoltageTable({ specs }: Props) {
  if (!specs) return null

  const has12v = specs.power?.['12v_w'] != null || specs.amperage?.['12v_a'] != null
  const has24v = specs.power?.['24v_w'] != null || specs.amperage?.['24v_a'] != null

  if (!has12v && !has24v) return null

  const rows = [
    {
      label: 'Potencia (W)',
      val12: specs.power?.['12v_w'] ?? null,
      val24: specs.power?.['24v_w'] ?? null,
      unit: 'W',
      icon: (
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Amperaje (A)',
      val12: specs.amperage?.['12v_a'] ?? null,
      val24: specs.amperage?.['24v_a'] ?? null,
      unit: 'A',
      icon: (
        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ].filter((r) => r.val12 != null || r.val24 != null)

  if (rows.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rendimiento por voltaje
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comparativa de potencia y amperaje según el voltaje de operación
        </p>
      </div>
      <div className="p-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Parámetro</th>
                {has12v && (
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        12
                      </span>
                      12V
                    </div>
                  </th>
                )}
                {has24v && (
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        24
                      </span>
                      24V
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row, idx) => (
                <tr key={idx} className="bg-white dark:bg-white/[0.02]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {row.icon}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{row.label}</span>
                    </div>
                  </td>
                  {has12v && (
                    <td className="px-4 py-3.5">
                      {row.val12 != null ? (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {row.val12} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{row.unit}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                  )}
                  {has24v && (
                    <td className="px-4 py-3.5">
                      {row.val24 != null ? (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {row.val24} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{row.unit}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Valores raw del Excel */}
        {(specs.power_12v_raw || specs.power_24v_raw || specs.amperage_12v_raw || specs.amperage_24v_raw) && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/30">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Datos originales del fabricante
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {specs.power_12v_raw && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Potencia 12V</p>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{specs.power_12v_raw}</p>
                </div>
              )}
              {specs.power_24v_raw && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Potencia 24V</p>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{specs.power_24v_raw}</p>
                </div>
              )}
              {specs.amperage_12v_raw && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Amperaje 12V</p>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{specs.amperage_12v_raw}</p>
                </div>
              )}
              {specs.amperage_24v_raw && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Amperaje 24V</p>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{specs.amperage_24v_raw}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
