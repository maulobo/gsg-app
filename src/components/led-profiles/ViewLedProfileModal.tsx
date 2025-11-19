"use client"

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import Button from '@/components/ui/button/Button'
import { LedProfileFull } from '@/features/led-profiles/types'

type Props = {
  profileId: number | null
  isOpen: boolean
  onClose: () => void
}

export default function ViewLedProfileModal({ profileId, isOpen, onClose }: Props) {
  const [profile, setProfile] = useState<LedProfileFull | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !profileId) return

    setLoading(true)
    setError(null)
    setProfile(null)

    fetch(`/api/led-profiles/${profileId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error fetching profile')
        }
        return res.json()
      })
      .then((data) => {
        setProfile(data.profile)
      })
      .catch((err) => {
        console.error('Error loading profile for view modal:', err)
        setError(err.message || 'Error')
      })
      .finally(() => setLoading(false))
  }, [isOpen, profileId])

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[900px] m-4">
      <div className="p-6 bg-white rounded-3xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalles del Perfil LED</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vista rápida - solo lectura</p>
          </div>
          <div>
            <Button size="sm" variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Cargando...</p>}
        {error && <p className="text-sm text-error-600">{error}</p>}

        {!loading && !error && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{profile.name} <span className="text-xs ml-2 font-medium text-gray-500 dark:text-gray-400">{profile.code}</span></h4>
              {profile.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{profile.description}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <div className="text-xs text-gray-400">Material</div>
                  <div className="font-medium">{profile.material || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Acabado</div>
                  <div className="font-medium">{profile.finish_surface || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Potencia Máx (W/m)</div>
                  <div className="font-medium">{profile.max_w_per_m ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Casos de Uso</div>
                  <div className="font-medium">{profile.use_cases || '—'}</div>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Difusores</h5>
                {profile.diffusers.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-1">Sin difusores relacionados</p>
                ) : (
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {profile.diffusers.map((d) => (
                      <li key={d.id}>{d.name} {d.notes ? `— ${d.notes}` : ''}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Acabados</h5>
                {profile.finishes.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-1">Sin acabados</p>
                ) : (
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {profile.finishes.map((f) => (
                      <li key={f.id}>{f.name}</li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            <aside className="flex flex-col gap-4">
              <div>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Media</h5>
                {profile.media.length === 0 && <p className="text-xs text-gray-500 mt-1">No hay archivos</p>}

                {profile.media.map((m) => (
                  <div key={m.id} className="mt-3 border rounded-lg p-2 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">
                          {m.kind === 'datasheet' ? 'FICHA TÉCNICA' : m.kind.toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{m.alt_text || m.path.split('/').pop()}</div>
                      </div>
                      <div>
                        {m.kind === 'datasheet' || m.kind === 'spec' ? (
                          <a href={m.path} target="_blank" rel="noreferrer" className="text-xs text-brand-500">Abrir PDF</a>
                        ) : (
                          <a href={m.path} target="_blank" rel="noreferrer" className="text-xs text-brand-500">Ver imagen</a>
                        )}
                      </div>
                    </div>

                    {m.kind !== 'datasheet' && m.kind !== 'spec' && (
                      <img src={m.path} alt={m.alt_text || 'Imagen'} className="w-full h-36 object-cover rounded-md mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </aside>

          </div>
        )}
      </div>
    </Modal>
  )
}
