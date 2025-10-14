'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Finish } from '@/features/finishes/types'
import type { LightTone } from '@/features/light-tones/types'
import type { AccessoryInsert } from '@/features/accessories/types'

interface Props {
  finishes: Finish[]
  lightTones: LightTone[]
}

export default function AccessoryCreationForm({ finishes, lightTones }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Datos del accesorio
  const [formData, setFormData] = useState<AccessoryInsert>({
    code: '',
    name: '',
    description: null,
    photo_url: null,
    watt: null,
    voltage_label: null,
    voltage_min: null,
    voltage_max: null,
  })

  // Relaciones N:N
  const [selectedToneIds, setSelectedToneIds] = useState<number[]>([])
  const [selectedFinishIds, setSelectedFinishIds] = useState<number[]>([])

  // Imagen del accesorio
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      alert('Código y nombre son requeridos')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Crear el accesorio primero (sin foto) con las relaciones N:N
      const dataToSubmit = {
        accessory: {
          ...formData,
          photo_url: null, // Se actualizará después si hay imagen
        },
        light_tone_ids: selectedToneIds,
        finish_ids: selectedFinishIds,
      }

      const res = await fetch('/api/accessories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al crear el accesorio')
      }

      const result = await res.json()

      // 2. Subir imagen si existe (esto actualiza photo_url automáticamente en DB)
      if (coverImage) {
        const formDataImage = new FormData()
        formDataImage.append('image', coverImage)
        formDataImage.append('accessoryCode', result.code)
        formDataImage.append('kind', 'cover')
        formDataImage.append('altText', `Imagen de ${formData.name}`)

        const imageRes = await fetch('/api/accessories/images/upload', {
          method: 'POST',
          body: formDataImage,
        })

        if (!imageRes.ok) {
          console.error('Error al subir la imagen, pero el accesorio fue creado')
          alert('Accesorio creado, pero hubo un error al subir la imagen')
        }
      }

      alert('Accesorio creado exitosamente')
      router.push(`/accessories`)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Crear Nuevo Accesorio</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Completa la información del accesorio
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información del Accesorio
          </h3>
        </div>
        <div className="space-y-6 p-6">
          {/* Código y Nombre */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Código del Accesorio <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ej: ACC-001"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Accesorio <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ej: Conector Universal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              placeholder="Descripción del accesorio..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Imagen del Accesorio */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Imagen del Accesorio
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="w-full text-theme-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-theme-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-white dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
              {coverImagePreview && (
                <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img
                    src={coverImagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Especificaciones Técnicas
            </h4>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Watt */}
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Potencia (W)
                </label>
                <input
                  type="number"
                  placeholder="ej: 10"
                  value={formData.watt || ''}
                  onChange={(e) => setFormData({ ...formData, watt: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Voltage Label */}
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Voltaje (Etiqueta)
                </label>
                <input
                  type="text"
                  placeholder="ej: 110-220"
                  value={formData.voltage_label || ''}
                  onChange={(e) => setFormData({ ...formData, voltage_label: e.target.value || null })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Voltage Min */}
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Voltaje Mínimo (V)
                </label>
                <input
                  type="number"
                  placeholder="ej: 110"
                  value={formData.voltage_min || ''}
                  onChange={(e) => setFormData({ ...formData, voltage_min: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Voltage Max */}
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Voltaje Máximo (V)
                </label>
                <input
                  type="number"
                  placeholder="ej: 220"
                  value={formData.voltage_max || ''}
                  onChange={(e) => setFormData({ ...formData, voltage_max: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Tono y Acabado - Selección múltiple */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Tonos y Acabados (puedes seleccionar varios)
            </h4>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Tonos de Luz */}
              <div>
                <label className="mb-3 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Tonos de Luz
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  {lightTones.map((tone) => (
                    <label
                      key={tone.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedToneIds.includes(tone.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedToneIds([...selectedToneIds, tone.id])
                          } else {
                            setSelectedToneIds(selectedToneIds.filter((id) => id !== tone.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-theme-sm text-gray-900 dark:text-white">
                        {tone.name}{tone.kelvin ? ` (${tone.kelvin}K)` : ''}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {selectedToneIds.length} tono(s) seleccionado(s)
                </p>
              </div>

              {/* Acabados */}
              <div>
                <label className="mb-3 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Acabados
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  {finishes.map((finish) => (
                    <label
                      key={finish.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFinishIds.includes(finish.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFinishIds([...selectedFinishIds, finish.id])
                          } else {
                            setSelectedFinishIds(selectedFinishIds.filter((id) => id !== finish.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-theme-sm text-gray-900 dark:text-white">
                        {finish.name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {selectedFinishIds.length} acabado(s) seleccionado(s)
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Accesorio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
