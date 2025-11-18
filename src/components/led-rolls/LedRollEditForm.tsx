'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LedRollFull, LedRollModel } from '@/features/led-rolls/types'
import type { LightTone } from '@/types/database'

type LedRollEditFormProps = {
  roll: LedRollFull
  lightTones: LightTone[]
}

// Interfaz temporal para el modelo con múltiples tonos
interface TempModelData extends Partial<LedRollModel> {
  light_tone_ids?: number[] // Para múltiples tonos en monocromático
}

export function LedRollEditForm({ roll, lightTones }: LedRollEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Datos básicos
  const [formData, setFormData] = useState({
    name: roll.name,
    description: roll.description || '',
    typology: roll.typology,
    color_control: roll.color_control || '',
    packaging: roll.packaging || '',
    cri_min: roll.cri_min || 90,
    voltage_v: roll.voltage_v,
    ip_rating: roll.ip_rating,
    dimmable: roll.dimmable,
    dynamic_effects: roll.dynamic_effects || '',
    cut_step_mm_min: roll.cut_step_mm_min || 0,
    cut_step_mm_max: roll.cut_step_mm_max || 0,
    width_mm_min: roll.width_mm_min || 0,
    width_mm_max: roll.width_mm_max || 0,
    eff_lm_per_w_min: roll.eff_lm_per_w_min || 0,
    eff_lm_per_w_max: roll.eff_lm_per_w_max || 0,
    flux_lm_per_m_min: roll.flux_lm_per_m_min || 0,
    flux_lm_per_m_max: roll.flux_lm_per_m_max || 0,
    leds_per_m_min: roll.leds_per_m_min || 0,
    leds_per_m_max: roll.leds_per_m_max || 0,
    roll_length_m: roll.roll_length_m || 0,
    warranty_years: roll.warranty_years || 0,
  })

  // Nuevo modelo temporal
  const [tempModel, setTempModel] = useState<TempModelData>({
    sku: '',
    name: '',
    watt_per_m: 10,
    leds_per_m: 320,
    luminous_efficacy_lm_w: 105,
    luminous_flux_per_m_lm: 1050,
    cut_step_mm: 25,
    width_mm: 8,
    color_mode: 'mono',
    light_tone_id: null,
    light_tone_ids: [], // Múltiples tonos para mono
    cct_min_k: null,
    cct_max_k: null,
    ip_rating: 'IP20',
    price: 0,
  })

  // Nueva imagen
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null)
  const [newCoverImagePreview, setNewCoverImagePreview] = useState<string>('')

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setNewCoverImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const addModel = async () => {
    if (!tempModel.sku) {
      alert('El SKU es requerido')
      return
    }
    if (tempModel.color_mode === 'mono' && (!tempModel.light_tone_ids || tempModel.light_tone_ids.length === 0)) {
      alert('Selecciona al menos un tono de luz para modo monocromático')
      return
    }
    if (tempModel.color_mode === 'cct' && (!tempModel.cct_min_k || !tempModel.cct_max_k)) {
      alert('Define el rango de temperatura para modo CCT')
      return
    }

    try {
      // Crear UN modelo con los tonos seleccionados como array
      const modelData = {
        ...tempModel,
        light_tone_ids: tempModel.color_mode === 'mono' ? tempModel.light_tone_ids : undefined,
        light_tone_id: tempModel.color_mode === 'mono' ? null : tempModel.light_tone_id,
      }

      const response = await fetch(`/api/led-rolls/${roll.id}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear modelo')
      }

      alert('✅ Modelo agregado exitosamente')
      router.refresh()
      setTempModel({
        sku: '',
        name: '',
        watt_per_m: 10,
        leds_per_m: 320,
        luminous_efficacy_lm_w: 105,
        luminous_flux_per_m_lm: 1050,
        cut_step_mm: 25,
        width_mm: 8,
        color_mode: 'mono',
        light_tone_id: null,
        light_tone_ids: [],
        cct_min_k: null,
        cct_max_k: null,
        ip_rating: 'IP20',
        price: 0,
      })
    } catch (error) {
      console.error('Error adding model:', error)
      alert(error instanceof Error ? error.message : 'Error al crear modelo')
    }
  }

  const handleUpdateRoll = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/led-rolls/${roll.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar')
      }

      // Subir nueva imagen de portada si hay
      if (newCoverImage) {
        const coverFormData = new FormData()
        coverFormData.append('image', newCoverImage)
        coverFormData.append('rollCode', roll.code)
        coverFormData.append('kind', 'cover')
        coverFormData.append('altText', `${formData.name} - Portada`)

        await fetch(`/api/led-rolls/${roll.id}/images/upload`, {
          method: 'POST',
          body: coverFormData,
        })
      }

      alert('✅ Rollo LED actualizado exitosamente')
      router.refresh()
    } catch (error) {
      console.error('Error updating roll:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este rollo LED? Esta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/led-rolls/${roll.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar')
      }

      alert('✅ Rollo LED eliminado exitosamente')
      router.push('/led-rolls')
      router.refresh()
    } catch (error) {
      console.error('Error deleting roll:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar')
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-600">
            Editar: {roll.name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Código: <span className="font-mono font-medium">{roll.code}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md bg-error-600 px-4 py-2 text-white hover:bg-error-700 disabled:opacity-50"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar Rollo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Datos básicos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info básica */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipología</label>
                <select
                  value={formData.typology || ''}
                  onChange={(e) => setFormData({ ...formData, typology: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  <option value="LED COB">LED COB</option>
                  <option value="LED SMD 5050">LED SMD 5050</option>
                  <option value="LED SMD 2835">LED SMD 2835</option>
                  <option value="LED SMD 3528">LED SMD 3528</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleUpdateRoll}
                disabled={isSubmitting}
                className="rounded-md bg-success-600 px-6 py-2 text-white hover:bg-success-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-blue-light-200 bg-blue-light-50 p-6 shadow-theme-sm dark:bg-blue-light-950 dark:border-blue-light-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Agregar Nuevo Modelo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">SKU *</label>
                <input
                  type="text"
                  value={tempModel.sku}
                  onChange={(e) => setTempModel({ ...tempModel, sku: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="COB-10W-3000K-IP20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={tempModel.name || ''}
                  onChange={(e) => setTempModel({ ...tempModel, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Modo de Color *</label>
                <select
                  value={tempModel.color_mode}
                  onChange={(e) => setTempModel({ ...tempModel, color_mode: e.target.value as any })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  <option value="mono">Monocromático</option>
                  <option value="cct">CCT</option>
                  <option value="rgb">RGB</option>
                  <option value="rgb_pixel">RGB Pixel</option>
                </select>
              </div>
            </div>

            {tempModel.color_mode === 'mono' && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tonos de Luz * (Seleccionar uno o más)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-300 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-800 max-h-48 overflow-y-auto">
                  {lightTones.map(tone => {
                    const isSelected = tempModel.light_tone_ids?.includes(tone.id) || false
                    return (
                      <label 
                        key={tone.id} 
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentIds = tempModel.light_tone_ids || []
                            const newIds = e.target.checked
                              ? [...currentIds, tone.id]
                              : currentIds.filter(id => id !== tone.id)
                            setTempModel({ ...tempModel, light_tone_ids: newIds })
                          }}
                          className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {tone.name} {tone.kelvin ? `(${tone.kelvin}K)` : ''}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {tempModel.light_tone_ids && tempModel.light_tone_ids.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {tempModel.light_tone_ids.length} tono{tempModel.light_tone_ids.length > 1 ? 's' : ''} seleccionado{tempModel.light_tone_ids.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {tempModel.color_mode === 'cct' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CCT Mín (K) *</label>
                  <input
                    type="number"
                    value={tempModel.cct_min_k || ''}
                    onChange={(e) => setTempModel({ ...tempModel, cct_min_k: parseInt(e.target.value) || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CCT Máx (K) *</label>
                  <input
                    type="number"
                    value={tempModel.cct_max_k || ''}
                    onChange={(e) => setTempModel({ ...tempModel, cct_max_k: parseInt(e.target.value) || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">W/m</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempModel.watt_per_m}
                  onChange={(e) => setTempModel({ ...tempModel, watt_per_m: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LEDs/m</label>
                <input
                  type="number"
                  value={tempModel.leds_per_m}
                  onChange={(e) => setTempModel({ ...tempModel, leds_per_m: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Efic. (lm/W)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempModel.luminous_efficacy_lm_w || 0}
                  onChange={(e) => setTempModel({ ...tempModel, luminous_efficacy_lm_w: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  value={tempModel.price || 0}
                  onChange={(e) => setTempModel({ ...tempModel, price: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addModel}
              className="w-full rounded-md bg-blue-light-600 px-4 py-2 text-white hover:bg-blue-light-700"
            >
              + Agregar Modelo
            </button>
          </div>
        </div>

        {/* Panel derecho: Imágenes y modelos */}
        <div className="space-y-6">
          {/* Imagen actual */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Imagen de Portada</h3>
            {roll.media?.find(m => m.kind === 'cover')?.path ? (
              <div className="mb-3">
                <img src={roll.media.find(m => m.kind === 'cover')!.path} alt={roll.name} className="w-full rounded-lg" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Imagen actual</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sin imagen de portada</p>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir Nueva Imagen</label>
              {!newCoverImagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-brand-500">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click para subir</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverImageChange} />
                </label>
              ) : (
                <div className="relative">
                  <img src={newCoverImagePreview} alt="Preview" className="w-full rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setNewCoverImage(null); setNewCoverImagePreview('') }}
                    className="absolute top-2 right-2 bg-error-600 text-white p-1 rounded-full hover:bg-error-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lista de modelos */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Modelos Existentes ({roll.models?.length || 0})</h3>
            {roll.models && roll.models.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {roll.models.map((model) => (
                  <div key={model.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{model.sku}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {model.watt_per_m}W/m • {model.leds_per_m} LED/m
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {model.color_mode.toUpperCase()}
                      {model.price && model.price > 0 && ` • $${model.price.toFixed(2)}`}
                    </p>
                    {/* Mostrar tonos de luz si existen */}
                    {model.light_tones && model.light_tones.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Tonos: {model.light_tones.map(t => t.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay modelos creados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
