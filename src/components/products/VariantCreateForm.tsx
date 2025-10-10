'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LocalImageUpload } from './LocalImageUpload'

type LightTone = {
  id: number
  slug: string
  name: string
  kelvin: number | null
}

type Configuration = {
  sku: string
  watt: number
  lumens: number
  voltage?: number
  diameter_description?: string
  length_mm?: number
  width_mm?: number
  specs?: Record<string, any>
}

type Product = {
  id: number
  code: string
  name: string
}

type VariantCreateFormProps = {
  product: Product
  productCode: string
  lightTones: LightTone[]
}

export function VariantCreateForm({ product, productCode, lightTones }: VariantCreateFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario básico
  const [formData, setFormData] = useState({
    name: '',
    variant_code: '',
    includes_led: false,
    includes_driver: false,
  })

  // Tonos de luz seleccionados
  const [selectedLightTones, setSelectedLightTones] = useState<number[]>([])

  // Configuraciones
  const [configurations, setConfigurations] = useState<Configuration[]>([])

  // Imágenes
  const [images, setImages] = useState<{
    cover: File | null
    tech: File | null
  }>({
    cover: null,
    tech: null,
  })

  const handleToggleLightTone = (toneId: number) => {
    setSelectedLightTones(prev =>
      prev.includes(toneId)
        ? prev.filter(id => id !== toneId)
        : [...prev, toneId]
    )
  }

  const handleAddConfiguration = () => {
    setConfigurations([
      ...configurations,
      {
        sku: '',
        watt: 0,
        lumens: 0,
      }
    ])
  }

  const handleRemoveConfiguration = (index: number) => {
    setConfigurations(configurations.filter((_, i) => i !== index))
  }

  const handleConfigChange = (index: number, field: keyof Configuration, value: any) => {
    const updated = [...configurations]
    updated[index] = { ...updated[index], [field]: value }
    setConfigurations(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('El nombre de la variante es requerido')
      return
    }

    setIsSaving(true)

    try {
      // 1. Crear la variante
      const response = await fetch(`/api/products/${productCode}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          ...formData,
          light_tone_ids: selectedLightTones,
          configurations,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la variante')
      }

      const result = await response.json()
      const variantId = result.variant.id

      // 2. Subir imágenes si hay
      const uploadPromises: Promise<void>[] = []

      if (images.cover) {
        uploadPromises.push(uploadImage(images.cover, 'cover', variantId))
      }

      if (images.tech) {
        uploadPromises.push(uploadImage(images.tech, 'tech', variantId))
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises)
      }

      alert('Variante creada exitosamente')
      router.push(`/products/${productCode}`)
    } catch (error) {
      console.error(error)
      alert('Error al crear la variante: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setIsSaving(false)
    }
  }

  const uploadImage = async (file: File, kind: 'cover' | 'tech', variantId: number) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('productId', product.id.toString())
    formData.append('productCode', productCode)
    formData.append('variantId', variantId.toString())
    formData.append('kind', kind)
    formData.append('altText', `${kind} de ${formData.get('name')}`)

    const response = await fetch('/api/products/images/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Error subiendo imagen ${kind}: ${error.error}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información Básica</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Nombre de la Variante <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Código de variante */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Código de Variante
            </label>
            <input
              type="text"
              value={formData.variant_code}
              onChange={(e) => setFormData({ ...formData, variant_code: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.includes_led}
                onChange={(e) => setFormData({ ...formData, includes_led: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LED incluido</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.includes_driver}
                onChange={(e) => setFormData({ ...formData, includes_driver: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Driver incluido</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tonos de Luz */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tonos de Luz</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {lightTones.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => handleToggleLightTone(tone.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedLightTones.includes(tone.id)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]'
                }`}
              >
                {tone.name}
                {tone.kelvin && <span className="ml-1 text-xs">({tone.kelvin}K)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Imágenes</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Imagen Cover */}
          <div>
            <LocalImageUpload
              label="Imagen de Portada"
              description="Selecciona una imagen de portada"
              file={images.cover}
              onFileSelect={(file) => setImages({ ...images, cover: file })}
            />
          </div>

          {/* Imagen Tech */}
          <div>
            <LocalImageUpload
              label="Imagen Técnica"
              description="Selecciona una imagen técnica"
              file={images.tech}
              onFileSelect={(file) => setImages({ ...images, tech: file })}
            />
          </div>
        </div>
      </div>

      {/* Configuraciones */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configuraciones</h2>
            <button
              type="button"
              onClick={handleAddConfiguration}
              className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {configurations.length === 0 ? (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
              No hay configuraciones. Haz clic en "Agregar" para crear una.
            </p>
          ) : (
            configurations.map((config, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Configuración {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveConfiguration(index)}
                    className="text-error-600 hover:text-error-700 dark:text-error-400"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={config.sku}
                      onChange={(e) => handleConfigChange(index, 'sku', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Watt */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Potencia (W) <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={config.watt}
                      onChange={(e) => handleConfigChange(index, 'watt', Number(e.target.value))}
                      required
                      min="0"
                      step="0.1"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Lumens */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lúmenes <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={config.lumens}
                      onChange={(e) => handleConfigChange(index, 'lumens', Number(e.target.value))}
                      required
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Voltage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Voltaje (V)
                    </label>
                    <input
                      type="number"
                      value={config.voltage || ''}
                      onChange={(e) => handleConfigChange(index, 'voltage', e.target.value ? Number(e.target.value) : undefined)}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Diameter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Diámetro
                    </label>
                    <input
                      type="text"
                      value={config.diameter_description || ''}
                      onChange={(e) => handleConfigChange(index, 'diameter_description', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Length */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Largo (mm)
                    </label>
                    <input
                      type="number"
                      value={config.length_mm || ''}
                      onChange={(e) => handleConfigChange(index, 'length_mm', e.target.value ? Number(e.target.value) : undefined)}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ancho (mm)
                    </label>
                    <input
                      type="number"
                      value={config.width_mm || ''}
                      onChange={(e) => handleConfigChange(index, 'width_mm', e.target.value ? Number(e.target.value) : undefined)}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.push(`/products/${productCode}`)}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-brand-800"
        >
          {isSaving ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando...
            </>
          ) : (
            'Crear Variante'
          )}
        </button>
      </div>
    </form>
  )
}
