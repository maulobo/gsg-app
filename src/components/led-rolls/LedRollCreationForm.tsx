'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LedRollFamilyInsert, LedRollInsert } from '@/types/database'

type LedRollCreationFormProps = Record<string, never>

// Formulario de familia (modelo general)
type FamilyFormData = {
  name: string
  description: string
  led_type: string
  adhesive: string
  roll_length_m: number
  dimmable: boolean
  leds_per_meter: number | null
  cri: number | null
  pcb_width_mm: number | null
  warranty_years: number
  technical_note: string
  cut_note: string
  general_note: string
}

// Formulario de variante (SKU específico)
type VariantFormData = {
  code: string
  name: string
  watts_per_meter: number
  lumens_per_meter: number | null
  kelvin: number | null
  tone_label: string
  voltage: number
  ip_rating: number
  leds_per_meter_variant: number | null
  price: number
}

export function LedRollCreationForm({}: LedRollCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'family' | 'variants' | 'images' | 'review'>('family')

  // Paso 1: Info de la familia (modelo general)
  const [familyData, setFamilyData] = useState<FamilyFormData>({
    name: '',
    description: '',
    led_type: 'COB',
    adhesive: '3M Original',
    roll_length_m: 5,
    dimmable: true,
    leds_per_meter: null,
    cri: 80,
    pcb_width_mm: 8,
    warranty_years: 3,
    technical_note: '',
    cut_note: '',
    general_note: '',
  })

  // Paso 2: Variantes (SKUs específicos)
  const [variants, setVariants] = useState<VariantFormData[]>([])
  const [tempVariant, setTempVariant] = useState<VariantFormData>({
    code: '',
    name: '',
    watts_per_meter: 10,
    lumens_per_meter: 1000,
    kelvin: 3000,
    tone_label: '3000K',
    voltage: 12,
    ip_rating: 20,
    leds_per_meter_variant: null,
    price: 0,
  })

  // Paso 3: Imágenes
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

  const addVariant = () => {
    if (!tempVariant.code) {
      alert('El código (SKU) es requerido')
      return
    }
    if (tempVariant.watts_per_meter <= 0) {
      alert('La potencia debe ser mayor a 0')
      return
    }

    setVariants([...variants, tempVariant])
    setTempVariant({
      code: '',
      name: '',
      watts_per_meter: 10,
      lumens_per_meter: 1000,
      kelvin: 3000,
      tone_label: '3000K',
      voltage: 12,
      ip_rating: 20,
      leds_per_meter_variant: null,
      price: 0,
    })
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!familyData.name) {
      alert('El nombre de la familia es requerido')
      return
    }
    if (variants.length === 0) {
      alert('Debes agregar al menos una variante')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Crear familia
      const familyResponse = await fetch('/api/led-rolls/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyData),
      })

      if (!familyResponse.ok) {
        const error = await familyResponse.json()
        throw new Error(error.error || 'Error al crear la familia LED')
      }

      const { family } = await familyResponse.json()

      // 2. Crear variantes
      for (const variant of variants) {
        await fetch('/api/led-rolls/variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...variant,
            family_id: family.id,
          }),
        })
      }

      // 3. Subir imágenes (asociadas a la familia)
      if (coverImage) {
        const coverFormData = new FormData()
        coverFormData.append('image', coverImage)
        coverFormData.append('kind', 'cover')
        coverFormData.append('altText', `${familyData.name} - Portada`)

        await fetch(`/api/led-rolls/families/${family.id}/images`, {
          method: 'POST',
          body: coverFormData,
        })
      }

      if (techImage) {
        const techFormData = new FormData()
        techFormData.append('image', techImage)
        techFormData.append('kind', 'tech')
        techFormData.append('altText', `${familyData.name} - Técnica`)

        await fetch(`/api/led-rolls/families/${family.id}/images`, {
          method: 'POST',
          body: techFormData,
        })
      }

      alert('✅ Familia LED creada exitosamente')
      router.push('/led-rolls')
      router.refresh()
    } catch (error) {
      console.error('Error creating LED roll family:', error)
      alert(error instanceof Error ? error.message : 'Error al crear la familia LED')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-600">
          Crear Familia de LED Rolls
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Define la familia (modelo) y sus variantes (SKUs)
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'family', label: '1. Familia' },
          { key: 'variants', label: '2. Variantes' },
          { key: 'images', label: '3. Imágenes' },
          { key: 'review', label: '4. Revisar' }
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
            {index < 3 && <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-theme-sm dark:bg-gray-dark dark:border-gray-800">
        {/* Step 1: Family Info */}
        {currentStep === 'family' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Información de la Familia</h2>
            <p className="text-sm text-gray-600 mb-4">
              Define las características comunes del modelo LED (ej: COB 10 w/m, SMD 14,4 w/m)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={familyData.name}
                  onChange={(e) => setFamilyData({ ...familyData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="COB 10 w/m"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo LED *</label>
                <input
                  type="text"
                  value={familyData.led_type}
                  onChange={(e) => setFamilyData({ ...familyData, led_type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="COB, 2835, 5050, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Adhesivo</label>
                <input
                  type="text"
                  value={familyData.adhesive}
                  onChange={(e) => setFamilyData({ ...familyData, adhesive: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="3M Original"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Largo Rollo (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={familyData.roll_length_m}
                  onChange={(e) => setFamilyData({ ...familyData, roll_length_m: parseFloat(e.target.value) || 5 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LEDs por metro</label>
                <input
                  type="number"
                  value={familyData.leds_per_meter || ''}
                  onChange={(e) => setFamilyData({ ...familyData, leds_per_meter: parseInt(e.target.value) || null })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="320 (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CRI</label>
                <input
                  type="number"
                  value={familyData.cri || ''}
                  onChange={(e) => setFamilyData({ ...familyData, cri: parseInt(e.target.value) || null })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="80, 90, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ancho PCB (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={familyData.pcb_width_mm || ''}
                  onChange={(e) => setFamilyData({ ...familyData, pcb_width_mm: parseFloat(e.target.value) || null })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="8, 10, 30, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Garantía (años)</label>
                <input
                  type="number"
                  value={familyData.warranty_years}
                  onChange={(e) => setFamilyData({ ...familyData, warranty_years: parseInt(e.target.value) || 3 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyData.dimmable}
                    onChange={(e) => setFamilyData({ ...familyData, dimmable: e.target.checked })}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimerizable</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea
                value={familyData.description}
                onChange={(e) => setFamilyData({ ...familyData, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                rows={2}
                placeholder="Descripción del modelo..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nota Técnica</label>
                <input
                  type="text"
                  value={familyData.technical_note}
                  onChange={(e) => setFamilyData({ ...familyData, technical_note: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Permite alimentar 25m sin caída"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nota Corte</label>
                <input
                  type="text"
                  value={familyData.cut_note}
                  onChange={(e) => setFamilyData({ ...familyData, cut_note: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Permite el corte cada 10 mm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nota General</label>
                <input
                  type="text"
                  value={familyData.general_note}
                  onChange={(e) => setFamilyData({ ...familyData, general_note: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Nota adicional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('variants')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
              >
                Siguiente: Variantes →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Variants */}
        {currentStep === 'variants' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Variantes (SKUs)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Agrega las diferentes variantes de <strong>{familyData.name || 'esta familia'}</strong> (ej: diferentes temperaturas, voltajes, IPs)
            </p>

            <div className="border border-blue-light-200 rounded-lg p-4 bg-blue-light-50 dark:bg-blue-light-950 dark:border-blue-light-800">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Agregar Variante</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Código (SKU) *</label>
                  <input
                    type="text"
                    value={tempVariant.code}
                    onChange={(e) => setTempVariant({ ...tempVariant, code: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="LED-COB-10W-CAL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre</label>
                  <input
                    type="text"
                    value={tempVariant.name}
                    onChange={(e) => setTempVariant({ ...tempVariant, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="Descripción opcional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Potencia (W/m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempVariant.watts_per_meter}
                    onChange={(e) => setTempVariant({ ...tempVariant, watts_per_meter: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Lúmenes/m</label>
                  <input
                    type="number"
                    value={tempVariant.lumens_per_meter || ''}
                    onChange={(e) => setTempVariant({ ...tempVariant, lumens_per_meter: parseInt(e.target.value) || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kelvin (K)</label>
                  <input
                    type="number"
                    value={tempVariant.kelvin || ''}
                    onChange={(e) => setTempVariant({ ...tempVariant, kelvin: parseInt(e.target.value) || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="3000, 6000, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Etiqueta Tono *</label>
                  <input
                    type="text"
                    value={tempVariant.tone_label}
                    onChange={(e) => setTempVariant({ ...tempVariant, tone_label: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="3000K, RGB, 3K-6K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Voltaje *</label>
                  <select
                    value={tempVariant.voltage}
                    onChange={(e) => setTempVariant({ ...tempVariant, voltage: parseInt(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="12">12V</option>
                    <option value="24">24V</option>
                    <option value="110">110V</option>
                    <option value="220">220V</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">IP Rating *</label>
                  <select
                    value={tempVariant.ip_rating}
                    onChange={(e) => setTempVariant({ ...tempVariant, ip_rating: parseInt(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="20">IP20</option>
                    <option value="65">IP65</option>
                    <option value="67">IP67</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LEDs/m (variante)</label>
                  <input
                    type="number"
                    value={tempVariant.leds_per_meter_variant || ''}
                    onChange={(e) => setTempVariant({ ...tempVariant, leds_per_meter_variant: parseInt(e.target.value) || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="Si difiere de familia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempVariant.price}
                    onChange={(e) => setTempVariant({ ...tempVariant, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="w-full rounded-md bg-blue-light-500 px-4 py-2 text-white hover:bg-blue-light-600"
              >
                + Agregar Variante
              </button>
            </div>

            {/* Variants list */}
            {variants.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Variantes Agregadas ({variants.length})</h3>
                <div className="space-y-2">
                  {variants.map((variant, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border dark:bg-gray-900">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{variant.code}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {variant.watts_per_meter}W/m • {variant.tone_label} • {variant.voltage}V • IP{variant.ip_rating}
                          {variant.lumens_per_meter && ` • ${variant.lumens_per_meter}lm/m`}
                          {variant.price > 0 && ` • $${variant.price.toFixed(2)}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-error-600 hover:text-error-700 font-medium px-3 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('family')}
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

        {/* Step 3: Images */}
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
                onClick={() => setCurrentStep('variants')}
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

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Revisar y Confirmar</h2>

            <div className="space-y-4">
              <div className="border-b pb-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Familia</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Nombre:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.name}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Tipo LED:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.led_type}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Adhesivo:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.adhesive}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Largo:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.roll_length_m}m</dd>
                  <dt className="text-gray-600 dark:text-gray-400">CRI:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.cri || 'N/A'}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Ancho PCB:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.pcb_width_mm ? `${familyData.pcb_width_mm}mm` : 'N/A'}</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Garantía:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.warranty_years} años</dd>
                  <dt className="text-gray-600 dark:text-gray-400">Dimerizable:</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{familyData.dimmable ? 'Sí' : 'No'}</dd>
                </dl>
              </div>

              <div className="border-b pb-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Variantes ({variants.length})</h3>
                {variants.map((variant, i) => (
                  <p key={i} className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                    • <strong className="text-gray-900 dark:text-gray-100">{variant.code}</strong> - {variant.watts_per_meter}W/m, {variant.tone_label}, {variant.voltage}V, IP{variant.ip_rating}
                    {variant.lumens_per_meter && ` - ${variant.lumens_per_meter}lm/m`}
                  </p>
                ))}
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
                {isSubmitting ? 'Creando Familia LED...' : '✓ Crear Familia LED Completa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
