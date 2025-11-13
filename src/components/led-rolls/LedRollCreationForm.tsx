'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LedRollModelFormData } from '@/features/led-rolls/types'
import type { LightTone } from '@/types/database'

type LedRollCreationFormProps = {
  lightTones: LightTone[]
}

type RollModel = {
  sku: string
  name: string
  watt_per_m: number
  leds_per_m: number
  luminous_efficacy_lm_w: number
  luminous_flux_per_m_lm: number
  cut_step_mm: number
  width_mm: number
  color_mode: 'mono' | 'cct' | 'rgb' | 'rgb_pixel'
  light_tone_id: number | null
  light_tone_ids?: number[] // Múltiples tonos para mono
  cct_min_k: number | null
  cct_max_k: number | null
  ip_rating: string
  price: number
}

export function LedRollCreationForm({ lightTones }: LedRollCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'basic' | 'specs' | 'models' | 'images' | 'review'>('basic')

  // Paso 1: Info básica
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    typology: 'LED COB',
    color_control: '',
    packaging: 'Rollo termoencogido con etiqueta identificatoria',
  })

  // Paso 2: Especificaciones
  const [specs, setSpecs] = useState({
    cri_min: 0,
    voltage_v: 12,
    ip_rating: 'IP20',
    dimmable: true,
    dynamic_effects: '',
    cut_step_mm_min: 0,
    cut_step_mm_max: 0,
    width_mm_min: 0,
    width_mm_max: 0,
    eff_lm_per_w_min: 0,
    eff_lm_per_w_max: 0,
    flux_lm_per_m_min: 0,
    flux_lm_per_m_max: 0,
    leds_per_m_min: 0,
    leds_per_m_max: 0,
    roll_length_m: 0,
    warranty_years: 0,
  })

  // Paso 3: Modelos
  const [models, setModels] = useState<RollModel[]>([])
  const [tempModel, setTempModel] = useState<RollModel>({
    sku: '',
    name: '',
    watt_per_m: 0,
    leds_per_m: 0,
    luminous_efficacy_lm_w: 0,
    luminous_flux_per_m_lm: 0,
    cut_step_mm: 0,
    width_mm: 0,
    color_mode: 'mono',
    light_tone_id: null,
    light_tone_ids: [],
    cct_min_k: null,
    cct_max_k: null,
    ip_rating: 'IP20',
    price: 0,
  })

  // Paso 4: Imágenes
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [techImage, setTechImage] = useState<File | null>(null)
  const [techImagePreview, setTechImagePreview] = useState<string>('')

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setCoverImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleTechImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTechImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setTechImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const addModel = () => {
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

    // Para modo mono, crear un modelo por cada tono seleccionado
    if (tempModel.color_mode === 'mono' && tempModel.light_tone_ids && tempModel.light_tone_ids.length > 0) {
      const newModels = tempModel.light_tone_ids.map(toneId => ({
        ...tempModel,
        light_tone_id: toneId,
        light_tone_ids: undefined, // Remover el campo temporal
      }))
      setModels([...models, ...newModels])
    } else {
      // Para otros modos (CCT, RGB), agregar solo un modelo
      const newModel = { ...tempModel, light_tone_ids: undefined }
      setModels([...models, newModel])
    }

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
  }

  const removeModel = (index: number) => {
    setModels(models.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      alert('Código y nombre son requeridos')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Crear rollo
      const rollResponse = await fetch('/api/led-rolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...specs }),
      })

      if (!rollResponse.ok) {
        const error = await rollResponse.json()
        throw new Error(error.error || 'Error al crear el rollo LED')
      }

      const { roll } = await rollResponse.json()

      // 2. Crear modelos
      for (const model of models) {
        await fetch(`/api/led-rolls/${roll.id}/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model),
        })
      }

      // 3. Subir imágenes
      if (coverImage) {
        const coverFormData = new FormData()
        coverFormData.append('image', coverImage)
        coverFormData.append('rollCode', formData.code)
        coverFormData.append('kind', 'cover')
        coverFormData.append('altText', `${formData.name} - Portada`)

        await fetch(`/api/led-rolls/${roll.id}/images/upload`, {
          method: 'POST',
          body: coverFormData,
        })
      }

      if (techImage) {
        const techFormData = new FormData()
        techFormData.append('image', techImage)
        techFormData.append('rollCode', formData.code)
        techFormData.append('kind', 'tech')
        techFormData.append('altText', `${formData.name} - Técnica`)

        await fetch(`/api/led-rolls/${roll.id}/images/upload`, {
          method: 'POST',
          body: techFormData,
        })
      }

      alert('✅ Rollo LED creado exitosamente')
      router.push('/led-rolls')
      router.refresh()
    } catch (error) {
      console.error('Error creating LED roll:', error)
      alert(error instanceof Error ? error.message : 'Error al crear el rollo LED')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-600">
          Crear Rollo LED
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Completa la información del nuevo rollo/tira LED
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'basic', label: '1. Info Básica' },
          { key: 'specs', label: '2. Especificaciones' },
          { key: 'models', label: '3. Modelos' },
          { key: 'images', label: '4. Imágenes' },
          { key: 'review', label: '5. Revisar' }
        ].map((step, index) => (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => setCurrentStep(step.key as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentStep === step.key
                  ? 'bg-brand-500 text-white shadow-theme-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
            </button>
            {index < 4 && <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
        {/* Step 1: Basic Info */}
        {currentStep === 'basic' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="COB-ROLL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Tira LED COB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipología</label>
                <select
                  value={formData.typology}
                  onChange={(e) => setFormData({ ...formData, typology: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  <option value="LED COB">LED COB</option>
                  <option value="LED SMD 5050">LED SMD 5050</option>
                  <option value="LED SMD 2835">LED SMD 2835</option>
                  <option value="LED SMD 3528">LED SMD 3528</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Control de Color</label>
                <input
                  type="text"
                  value={formData.color_control}
                  onChange={(e) => setFormData({ ...formData, color_control: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="monocromático / CCT / RGB Pixel"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                rows={3}
                placeholder="Descripción del rollo LED..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Packaging</label>
              <input
                type="text"
                value={formData.packaging}
                onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('specs')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
              >
                Siguiente: Especificaciones →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Specifications */}
        {currentStep === 'specs' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Especificaciones Técnicas</h2>

            {/* Electrical */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Características Eléctricas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CRI Mínimo</label>
                  <input
                    type="number"
                    value={specs.cri_min || ''}
                    onChange={(e) => setSpecs({ ...specs, cri_min: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Voltaje (V)</label>
                  <select
                    value={specs.voltage_v}
                    onChange={(e) => setSpecs({ ...specs, voltage_v: parseInt(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value={12}>12V</option>
                    <option value={24}>24V</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">IP Rating</label>
                  <select
                    value={specs.ip_rating}
                    onChange={(e) => setSpecs({ ...specs, ip_rating: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="IP20">IP20</option>
                    <option value="IP65">IP65</option>
                    <option value="IP67">IP67</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Dimensiones y Corte</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Corte mín (mm)</label>
                  <input
                    type="number"
                    value={specs.cut_step_mm_min || ''}
                    onChange={(e) => setSpecs({ ...specs, cut_step_mm_min: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Corte máx (mm)</label>
                  <input
                    type="number"
                    value={specs.cut_step_mm_max || ''}
                    onChange={(e) => setSpecs({ ...specs, cut_step_mm_max: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ancho mín (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.width_mm_min || ''}
                    onChange={(e) => setSpecs({ ...specs, width_mm_min: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ancho máx (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.width_mm_max || ''}
                    onChange={(e) => setSpecs({ ...specs, width_mm_max: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* LEDs */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">LEDs por Metro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LEDs/m Mínimo</label>
                  <input
                    type="number"
                    value={specs.leds_per_m_min || ''}
                    onChange={(e) => setSpecs({ ...specs, leds_per_m_min: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LEDs/m Máximo</label>
                  <input
                    type="number"
                    value={specs.leds_per_m_max || ''}
                    onChange={(e) => setSpecs({ ...specs, leds_per_m_max: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Efficiency */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Eficiencia Lumínica</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Efic. mín (lm/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.eff_lm_per_w_min || ''}
                    onChange={(e) => setSpecs({ ...specs, eff_lm_per_w_min: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Efic. máx (lm/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.eff_lm_per_w_max || ''}
                    onChange={(e) => setSpecs({ ...specs, eff_lm_per_w_max: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Flujo mín (lm/m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.flux_lm_per_m_min || ''}
                    onChange={(e) => setSpecs({ ...specs, flux_lm_per_m_min: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Flujo máx (lm/m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.flux_lm_per_m_max || ''}
                    onChange={(e) => setSpecs({ ...specs, flux_lm_per_m_max: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Other */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Otros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Longitud rollo (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={specs.roll_length_m || ''}
                    onChange={(e) => setSpecs({ ...specs, roll_length_m: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Garantía (años)</label>
                  <input
                    type="number"
                    value={specs.warranty_years || ''}
                    onChange={(e) => setSpecs({ ...specs, warranty_years: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specs.dimmable}
                      onChange={(e) => setSpecs({ ...specs, dimmable: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimeable</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('basic')}
                className="rounded-md border px-6 py-2 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('models')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
              >
                Siguiente: Modelos →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Models */}
        {currentStep === 'models' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Modelos/SKUs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Agrega los diferentes modelos (SKUs) de este rollo
            </p>

            <div className="border border-blue-light-200 rounded-lg p-4 bg-blue-light-50 dark:bg-blue-light-950 dark:border-blue-light-800">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Agregar Modelo</h3>
              
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
                    value={tempModel.name}
                    onChange={(e) => setTempModel({ ...tempModel, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="COB 10W 3000K"
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
                    <option value="cct">CCT (Temperatura Variable)</option>
                    <option value="rgb">RGB</option>
                    <option value="rgb_pixel">RGB Pixel</option>
                  </select>
                </div>
              </div>

              {/* Color configuration */}
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
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CCT Máx (K) *</label>
                    <input
                      type="number"
                      value={tempModel.cct_max_k || ''}
                      onChange={(e) => setTempModel({ ...tempModel, cct_max_k: parseInt(e.target.value) || null })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="6000"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Potencia (W/m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempModel.watt_per_m}
                    onChange={(e) => setTempModel({ ...tempModel, watt_per_m: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LEDs/m *</label>
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
                    value={tempModel.luminous_efficacy_lm_w}
                    onChange={(e) => setTempModel({ ...tempModel, luminous_efficacy_lm_w: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Flujo (lm/m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempModel.luminous_flux_per_m_lm}
                    onChange={(e) => setTempModel({ ...tempModel, luminous_flux_per_m_lm: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Corte (mm)</label>
                  <input
                    type="number"
                    value={tempModel.cut_step_mm}
                    onChange={(e) => setTempModel({ ...tempModel, cut_step_mm: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ancho (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempModel.width_mm}
                    onChange={(e) => setTempModel({ ...tempModel, width_mm: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">IP Rating</label>
                  <select
                    value={tempModel.ip_rating}
                    onChange={(e) => setTempModel({ ...tempModel, ip_rating: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="IP20">IP20</option>
                    <option value="IP65">IP65</option>
                    <option value="IP67">IP67</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempModel.price}
                    onChange={(e) => setTempModel({ ...tempModel, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addModel}
                className="w-full rounded-md bg-blue-light-500 px-4 py-2 text-white hover:bg-blue-light-600"
              >
                + Agregar Modelo
              </button>
            </div>

            {/* Models list */}
            {models.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Modelos Agregados ({models.length})</h3>
                <div className="space-y-2">
                  {models.map((model, index) => {
                    const toneName = model.light_tone_id 
                      ? lightTones.find(t => t.id === model.light_tone_id)?.name || 'N/A'
                      : null
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border dark:bg-gray-900">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{model.sku}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {model.watt_per_m}W/m • {model.leds_per_m} LED/m • {model.color_mode.toUpperCase()}
                            {toneName && ` • ${toneName}`}
                            {model.price > 0 && ` • $${model.price.toFixed(2)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeModel(index)}
                          className="text-error-600 hover:text-error-700 font-medium px-3 py-1 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('specs')}
                className="rounded-md border px-6 py-2 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('images')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
              >
                Siguiente: Imágenes →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Images */}
        {currentStep === 'images' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Imágenes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Foto de Portada</h3>
                {!coverImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-brand-500">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click para subir o arrastra</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverImageChange} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={coverImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setCoverImage(null); setCoverImagePreview('') }}
                      className="absolute top-2 right-2 bg-error-600 text-white p-2 rounded-full hover:bg-error-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Tech Image */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Foto Técnica</h3>
                {!techImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-brand-500">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click para subir o arrastra</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleTechImageChange} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={techImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setTechImage(null); setTechImagePreview('') }}
                      className="absolute top-2 right-2 bg-error-600 text-white p-2 rounded-full hover:bg-error-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('models')}
                className="rounded-md border px-6 py-2 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('review')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
              >
                Siguiente: Revisar →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Revisar y Confirmar</h2>

            <div className="space-y-4">
              <div className="border-b pb-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Info Básica</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Código:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{formData.code}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Nombre:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{formData.name}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Tipología:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{formData.typology}</dd>
                </dl>
              </div>

              <div className="border-b pb-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Especificaciones</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">CRI:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{specs.cri_min}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Voltaje:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{specs.voltage_v}V</dd>
                  <dt className="text-gray-600 dark:text-gray-400">IP Rating:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{specs.ip_rating}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">LEDs/m:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{specs.leds_per_m_min} - {specs.leds_per_m_max}</dd>
                </dl>
              </div>

              <div className="border-b pb-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Modelos ({models.length})</h3>
                {models.map((model, i) => {
                  const toneName = model.light_tone_id 
                    ? lightTones.find(t => t.id === model.light_tone_id)?.name || ''
                    : null
                  
                  return (
                    <p key={i} className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                      • <strong className="text-gray-900 dark:text-gray-100">{model.sku}</strong> - {model.watt_per_m}W/m, {model.leds_per_m} LED/m, {model.color_mode.toUpperCase()}
                      {toneName && ` - ${toneName}`}
                    </p>
                  )
                })}
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Imágenes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Portada:</p>
                    {coverImagePreview ? (
                      <img src={coverImagePreview} alt="Cover" className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No agregada</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Técnica:</p>
                    {techImagePreview ? (
                      <img src={techImagePreview} alt="Tech" className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No agregada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('images')}
                className="rounded-md border px-6 py-2 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-md bg-success-600 px-8 py-2 text-white hover:bg-success-700 disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? 'Creando Rollo LED...' : '✓ Crear Rollo LED Completo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
