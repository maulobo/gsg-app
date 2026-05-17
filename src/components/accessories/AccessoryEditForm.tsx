'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessoryWithRefs } from '@/features/accessories/types'
import { ACCESSORY_TYPES } from '@/features/accessories/types'
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
  const isKnownType = accessory.tipo
    ? (ACCESSORY_TYPES as readonly string[]).includes(accessory.tipo)
    : true
  const specs = accessory.specs || {}
  const [formData, setFormData] = useState({
    name: accessory.name,
    description: accessory.description || '',
    tipo: isKnownType ? (accessory.tipo ?? '') : 'Otro',
    amperage: accessory.amperage || null,
    watt: accessory.watt || null,
    voltage_label: accessory.voltage_label || '',
    voltage_min: accessory.voltage_min || null,
    voltage_max: accessory.voltage_max || null,
    specs: accessory.specs || null,
    notes: accessory.notes || null,
  })
  const [tipoOtro, setTipoOtro] = useState(isKnownType ? '' : (accessory.tipo ?? ''))

  // Campos detallados del specs (del Excel del cliente)
  const [specsPower12v, setSpecsPower12v] = useState<number | null>(specs.power?.['12v_w'] ?? null)
  const [specsPower24v, setSpecsPower24v] = useState<number | null>(specs.power?.['24v_w'] ?? null)
  const [specsAmp12v, setSpecsAmp12v] = useState<number | null>(specs.amperage?.['12v_a'] ?? null)
  const [specsAmp24v, setSpecsAmp24v] = useState<number | null>(specs.amperage?.['24v_a'] ?? null)
  const [specsPower12vRaw, setSpecsPower12vRaw] = useState(specs.power_12v_raw || '')
  const [specsPower24vRaw, setSpecsPower24vRaw] = useState(specs.power_24v_raw || '')
  const [specsAmp12vRaw, setSpecsAmp12vRaw] = useState(specs.amperage_12v_raw || '')
  const [specsAmp24vRaw, setSpecsAmp24vRaw] = useState(specs.amperage_24v_raw || '')
  const [specsReach, setSpecsReach] = useState(specs.reach_or_total || '')
  const [specsSignal, setSpecsSignal] = useState(specs.signal_type || '')
  const [specsLedType, setSpecsLedType] = useState(specs.led_type || '')
  const [notes, setNotes] = useState(accessory.notes || '')

  // PDF ficha técnica
  const existingDatasheet = accessory.accessory_media?.find(m => m.kind === 'datasheet') ?? null
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null)
  const [datasheetToDelete, setDatasheetToDelete] = useState<number | null>(null)

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
      const tipoFinal = formData.tipo === 'Otro' ? tipoOtro || null : formData.tipo || null
      const newSpecs: Record<string, any> = {}
      if (specsPower12v !== null || specsPower24v !== null) {
        newSpecs.power = {}
        if (specsPower12v !== null) newSpecs.power['12v_w'] = specsPower12v
        if (specsPower24v !== null) newSpecs.power['24v_w'] = specsPower24v
      }
      if (specsAmp12v !== null || specsAmp24v !== null) {
        newSpecs.amperage = {}
        if (specsAmp12v !== null) newSpecs.amperage['12v_a'] = specsAmp12v
        if (specsAmp24v !== null) newSpecs.amperage['24v_a'] = specsAmp24v
      }
      if (specsPower12vRaw.trim()) newSpecs.power_12v_raw = specsPower12vRaw.trim()
      if (specsPower24vRaw.trim()) newSpecs.power_24v_raw = specsPower24vRaw.trim()
      if (specsAmp12vRaw.trim()) newSpecs.amperage_12v_raw = specsAmp12vRaw.trim()
      if (specsAmp24vRaw.trim()) newSpecs.amperage_24v_raw = specsAmp24vRaw.trim()
      if (specsReach.trim()) newSpecs.reach_or_total = specsReach.trim()
      if (specsSignal.trim()) newSpecs.signal_type = specsSignal.trim()
      if (specsLedType.trim()) newSpecs.led_type = specsLedType.trim()
      if (notes.trim()) newSpecs.notes = notes.trim()
      const specsObj = Object.keys(newSpecs).length > 0 ? newSpecs : null

      const dataToSubmit = {
        accessory: {
          ...formData,
          tipo: tipoFinal,
          photo_url: uploadedPhotoUrl,
          specs: specsObj,
          notes: notes.trim() || null,
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

      // 3. Eliminar PDF anterior (marcado para borrar O si se va a reemplazar por uno nuevo)
      const pdfToRemove = datasheetToDelete ?? (datasheetFile && existingDatasheet ? existingDatasheet.id : null)
      if (pdfToRemove) {
        await fetch(`/api/accessories/images/upload?mediaId=${pdfToRemove}`, { method: 'DELETE' })
      }

      // 4. Subir nuevo PDF si se seleccionó
      if (datasheetFile) {
        const pdfForm = new FormData()
        pdfForm.append('image', datasheetFile)
        pdfForm.append('accessoryCode', accessory.code)
        pdfForm.append('kind', 'datasheet')
        pdfForm.append('altText', `${formData.name} - Ficha Técnica`)
        const pdfRes = await fetch('/api/accessories/images/upload', { method: 'POST', body: pdfForm })
        if (!pdfRes.ok) console.error('Error al subir la ficha técnica PDF')
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

          {/* Tipo */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Accesorio
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => {
                const val = e.target.value
                setFormData({ ...formData, tipo: val })
                if (val !== 'Otro') setTipoOtro('')
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Sin categoría</option>
              {ACCESSORY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="Otro">Otro...</option>
            </select>
            {formData.tipo === 'Otro' && (
              <input
                type="text"
                placeholder="Especificá el tipo"
                value={tipoOtro}
                onChange={(e) => setTipoOtro(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            )}
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
        <div className="p-6 space-y-6">
          {/* Voltaje */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Voltaje (Etiqueta)
              </label>
              <input
                type="text"
                placeholder="ej: 12/24"
                value={formData.voltage_label || ''}
                onChange={(e) =>
                  setFormData({ ...formData, voltage_label: e.target.value || '' })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Voltaje Mínimo (V)
              </label>
              <input
                type="number"
                placeholder="ej: 12"
                value={formData.voltage_min || ''}
                onChange={(e) =>
                  setFormData({ ...formData, voltage_min: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Voltaje Máximo (V)
              </label>
              <input
                type="number"
                placeholder="ej: 24"
                value={formData.voltage_max || ''}
                onChange={(e) =>
                  setFormData({ ...formData, voltage_max: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Potencia y Amperaje por voltaje */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
              Potencia y Amperaje por Voltaje (del Excel del cliente)
            </h5>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Potencia 12V (W)
                </label>
                <input
                  type="number"
                  placeholder="ej: 360"
                  value={specsPower12v ?? ''}
                  onChange={(e) => setSpecsPower12v(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Potencia 24V (W)
                </label>
                <input
                  type="number"
                  placeholder="ej: 720"
                  value={specsPower24v ?? ''}
                  onChange={(e) => setSpecsPower24v(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Amperaje 12V (A)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ej: 30"
                  value={specsAmp12v ?? ''}
                  onChange={(e) => setSpecsAmp12v(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Amperaje 24V (A)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ej: 30"
                  value={specsAmp24v ?? ''}
                  onChange={(e) => setSpecsAmp24v(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Valores raw */}
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-600 dark:text-gray-400">
                  Potencia 12V (texto original si aplica)
                </label>
                <input
                  type="text"
                  placeholder="ej: 72 o 3x6A"
                  value={specsPower12vRaw}
                  onChange={(e) => setSpecsPower12vRaw(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-600 dark:text-gray-400">
                  Potencia 24V (texto original si aplica)
                </label>
                <input
                  type="text"
                  placeholder="ej: 144 o 3x6A"
                  value={specsPower24vRaw}
                  onChange={(e) => setSpecsPower24vRaw(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-600 dark:text-gray-400">
                  Amperaje 12V (texto original si aplica)
                </label>
                <input
                  type="text"
                  placeholder="ej: 6A o 3x6A"
                  value={specsAmp12vRaw}
                  onChange={(e) => setSpecsAmp12vRaw(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-600 dark:text-gray-400">
                  Amperaje 24V (texto original si aplica)
                </label>
                <input
                  type="text"
                  placeholder="ej: 6A o 3x6A"
                  value={specsAmp24vRaw}
                  onChange={(e) => setSpecsAmp24vRaw(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Otros campos del Excel */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Alcance / Total
              </label>
              <input
                type="text"
                placeholder="ej: 10m, WiFi, RGB, en cascada..."
                value={specsReach}
                onChange={(e) => setSpecsReach(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Señal
              </label>
              <input
                type="text"
                placeholder="ej: Llavero, Táctil, IR, PIR..."
                value={specsSignal}
                onChange={(e) => setSpecsSignal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                LED / Tipo
              </label>
              <input
                type="text"
                placeholder="ej: mini RGB, RGBW, Monocrom."
                value={specsLedType}
                onChange={(e) => setSpecsLedType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Notas Técnicas
            </label>
            <textarea
              placeholder="Notas adicionales del Excel (ej: VERIFICAR, datos de fábrica, funciones, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
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

      {/* Ficha Técnica PDF */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ficha Técnica</h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">PDF con especificaciones del accesorio (máx. 10MB)</p>
        </div>
        <div className="p-6 space-y-4">
          {/* PDF existente */}
          {existingDatasheet && datasheetToDelete !== existingDatasheet.id && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1H8v-1zm0 3h8v1H8v-1zm0-6h5v1H8v-1z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Ficha técnica actual</p>
                  <a href={existingDatasheet.path} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">
                    Ver PDF
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDatasheetToDelete(existingDatasheet.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                Eliminar
              </button>
            </div>
          )}
          {datasheetToDelete === existingDatasheet?.id && (
            <p className="text-sm text-amber-600 dark:text-amber-400">El PDF actual se eliminará al guardar.</p>
          )}
          {/* Subir nuevo PDF */}
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              {existingDatasheet && datasheetToDelete !== existingDatasheet.id ? 'Reemplazar PDF' : 'Subir PDF'}
            </label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setDatasheetFile(e.target.files?.[0] ?? null)}
              className="w-full text-theme-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-theme-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-white dark:file:bg-brand-500/10 dark:file:text-brand-400"
            />
            {datasheetFile && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Seleccionado: {datasheetFile.name}
              </p>
            )}
            {datasheetFile && existingDatasheet && datasheetToDelete !== existingDatasheet.id && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Al guardar se reemplazará la ficha técnica actual.
              </p>
            )}
          </div>
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
