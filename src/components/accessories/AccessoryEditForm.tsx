'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessoryWithRefs } from '@/features/accessories/types'
import type { Finish } from '@/features/finishes/types'
import type { LightTone } from '@/features/light-tones/types'

interface Props {
  accessory: AccessoryWithRefs
  finishes: Finish[]
  lightTones: LightTone[]
}

export default function AccessoryEditForm({ accessory, finishes, lightTones }: Props) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: accessory.name,
    description: accessory.description || '',
    watt: accessory.watt || null,
    voltage_label: accessory.voltage_label || '',
    voltage_min: accessory.voltage_min || null,
    voltage_max: accessory.voltage_max || null,
  })

  // Estados para selección múltiple
  const [selectedToneIds, setSelectedToneIds] = useState<number[]>(
    accessory.accessory_light_tones?.map((alt) => alt.light_tone.id) || []
  )
  const [selectedFinishIds, setSelectedFinishIds] = useState<number[]>(
    accessory.accessory_finishes?.map((af) => af.finish.id) || []
  )

  // Imagen del accesorio
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(accessory.photo_url)

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

  const handleToneToggle = (toneId: number) => {
    setSelectedToneIds((prev) =>
      prev.includes(toneId) ? prev.filter((id) => id !== toneId) : [...prev, toneId]
    )
  }

  const handleFinishToggle = (finishId: number) => {
    setSelectedFinishIds((prev) =>
      prev.includes(finishId) ? prev.filter((id) => id !== finishId) : [...prev, finishId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('El nombre es requerido')
      return
    }

    setIsSaving(true)

    try {
      // 1. Subir imagen si se seleccionó una nueva
      let uploadedPhotoUrl = accessory.photo_url
      if (coverImage) {
        const formDataImage = new FormData()
        formDataImage.append('image', coverImage)
        formDataImage.append('accessoryCode', accessory.code)
        formDataImage.append('kind', 'cover')
        formDataImage.append('altText', `Imagen de ${formData.name}`)

        const imageRes = await fetch('/api/accessories/images/upload', {
          method: 'POST',
          body: formDataImage,
        })

        if (imageRes.ok) {
          const imageData = await imageRes.json()
          uploadedPhotoUrl = imageData.url
        } else {
          console.error('Error al subir la imagen')
        }
      }

      // 2. Actualizar el accesorio
      const dataToSubmit = {
        accessory: {
          ...formData,
          photo_url: uploadedPhotoUrl,
        },
        light_tone_ids: selectedToneIds,
        finish_ids: selectedFinishIds,
      }

      const response = await fetch(`/api/accessories/${accessory.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el accesorio')
      }

      alert('Accesorio actualizado exitosamente')
      router.push(`/accessories`)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Error al actualizar el accesorio')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información Básica</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Código (no editable) */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Código del Accesorio
            </label>
            <input
              type="text"
              value={accessory.code}
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-theme-sm text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              El código no se puede modificar
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre del Accesorio <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
        </div>
      </div>

      {/* Especificaciones Técnicas */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Especificaciones Técnicas</h2>
        </div>
        <div className="p-6">
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
                onChange={(e) =>
                  setFormData({ ...formData, watt: e.target.value ? Number(e.target.value) : null })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, voltage_label: e.target.value || '' })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, voltage_min: e.target.value ? Number(e.target.value) : null })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, voltage_max: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tonos de Luz (Selección Múltiple) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tonos de Luz</h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Selecciona los tonos de luz disponibles para este accesorio
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {lightTones.map((tone) => (
              <label
                key={tone.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedToneIds.includes(tone.id)}
                  onChange={() => handleToneToggle(tone.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {tone.name}
                  </div>
                  {tone.kelvin && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tone.kelvin}K
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          {selectedToneIds.length === 0 && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No se ha seleccionado ningún tono de luz
            </p>
          )}
        </div>
      </div>

      {/* Acabados (Selección Múltiple) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Acabados</h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Selecciona los acabados disponibles para este accesorio
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {finishes.map((finish) => (
              <label
                key={finish.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedFinishIds.includes(finish.id)}
                  onChange={() => handleFinishToggle(finish.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {finish.name}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {selectedFinishIds.length === 0 && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No se ha seleccionado ningún acabado
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/accessories')}
          disabled={isSaving}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="mr-2 inline h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </button>
      </div>
    </form>
  )
}
