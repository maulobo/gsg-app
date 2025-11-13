'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Category, Finish, LightTone } from '@/types/database'
import { LocalImageUpload } from './LocalImageUpload'

type ProductFormProps = {
  categories: Category[]
  finishes: Finish[]
  lightTones: LightTone[]
}

type ProductData = {
  code: string
  name: string
  description: string
  category_id: number | null
  is_featured: boolean
  finish_ids: number[]
}

type VariantData = {
  variant_code: string
  name: string
  includes_led: boolean
  includes_driver: boolean
  cantidad: number
  light_tone_ids: number[]
  configurations: ConfigData[]
  imageFiles?: {
    cover?: File
    tech?: File
    datasheet?: File  // PDF de cartilla técnica
    spec?: File       // PDF de especificaciones
  }
}

type ConfigData = {
  sku: string
  watt: number
  lumens: number
  voltage?: number
  diameter_description?: string
  length_mm?: number
  width_mm?: number
  specs?: Record<string, any>
}

export function ProductCreationForm({ categories, finishes: initialFinishes, lightTones }: ProductFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'product' | 'variants' | 'review'>('product')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Estado para acabados (permite agregar nuevos)
  const [finishes, setFinishes] = useState<Finish[]>(initialFinishes)
  const [showAddFinish, setShowAddFinish] = useState(false)
  const [newFinishName, setNewFinishName] = useState('')
  const [isCreatingFinish, setIsCreatingFinish] = useState(false)

  // Ordenar acabados alfabéticamente (case-insensitive)
  const sortedFinishes = useMemo(() => {
    try {
      return [...finishes].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    } catch (e) {
      return finishes
    }
  }, [finishes])

  const [productData, setProductData] = useState<ProductData>({
    code: '',
    name: '',
    description: '',
    category_id: null,
    is_featured: false,
    finish_ids: [],
  })

  const [variants, setVariants] = useState<VariantData[]>([])
  const [currentVariant, setCurrentVariant] = useState<VariantData>({
    variant_code: '',
    name: '',
    includes_led: false,
    includes_driver: false,
    cantidad: 0,
    light_tone_ids: [],
    configurations: [],
    imageFiles: {}
  })

  const [currentConfig, setCurrentConfig] = useState<ConfigData>({
    sku: '',
    watt: 0,
    lumens: 0,
  })

  const handleAddVariant = () => {
    if (!currentVariant.name || !currentVariant.variant_code) {
      alert('Nombre y código de variante son requeridos')
      return
    }
    setVariants([...variants, currentVariant])
    setCurrentVariant({
      variant_code: '',
      name: '',
      includes_led: false,
      includes_driver: false,
      cantidad: 0,
      light_tone_ids: [],
      configurations: [],
      imageFiles: {}
    })
  }

  const handleAddConfigToVariant = () => {
    if (!currentConfig.sku || currentConfig.watt <= 0 || currentConfig.lumens <= 0) {
      alert('SKU, Watt y Lumens son requeridos')
      return
    }
    setCurrentVariant({
      ...currentVariant,
      configurations: [...currentVariant.configurations, currentConfig],
    })
    setCurrentConfig({ sku: '', watt: 0, lumens: 0 })
  }

  const handleCreateFinish = async () => {
    if (!newFinishName.trim()) {
      alert('El nombre del acabado es requerido')
      return
    }

    setIsCreatingFinish(true)

    try {
      const response = await fetch('/api/finishes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFinishName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          alert(`Ya existe el acabado "${data.finish.name}"`)
          // Agregar el acabado existente a la selección
          if (!productData.finish_ids.includes(data.finish.id)) {
            setProductData({
              ...productData,
              finish_ids: [...productData.finish_ids, data.finish.id],
            })
          }
        } else {
          throw new Error(data.error || 'Error al crear acabado')
        }
      } else {
        // Agregar el nuevo acabado a la lista
        setFinishes([...finishes, data.finish])
        // Seleccionarlo automáticamente
        setProductData({
          ...productData,
          finish_ids: [...productData.finish_ids, data.finish.id],
        })
        alert(`Acabado "${data.finish.name}" creado exitosamente`)
      }

      setNewFinishName('')
      setShowAddFinish(false)
    } catch (error) {
      console.error(error)
      alert('Error al crear el acabado')
    } finally {
      setIsCreatingFinish(false)
    }
  }

  const handleSubmit = async () => {
    if (!productData.code || !productData.name || !productData.category_id) {
      alert('Código, nombre y categoría son requeridos')
      setCurrentStep('product')
      return
    }

    if (variants.length === 0) {
      alert('Debes agregar al menos una variante')
      setCurrentStep('variants')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Crear producto y variantes
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productData, variants }),
      })

      if (!response.ok) throw new Error('Error al crear producto')

      const result = await response.json()
      
      // 2. Subir imágenes de cada variante
      const uploadPromises: Promise<void>[] = []
      
      // Verificar que tenemos las variantes en la respuesta
      if (result.variants && Array.isArray(result.variants)) {
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i]
          const createdVariant = result.variants[i]
          
          if (!createdVariant?.id) {
            console.warn(`Variante ${i} no encontrada en la respuesta del servidor`)
            continue
          }
          
          // Subir imagen cover si existe
          if (variant.imageFiles?.cover) {
            uploadPromises.push(
              uploadVariantImage(
                variant.imageFiles.cover,
                result.product.id,
                result.product.code,
                createdVariant.id,
                'cover'
              )
            )
          }
          
          // Subir imagen tech si existe
          if (variant.imageFiles?.tech) {
            uploadPromises.push(
              uploadVariantImage(
                variant.imageFiles.tech,
                result.product.id,
                result.product.code,
                createdVariant.id,
                'tech'
              )
            )
          }

          // Subir datasheet PDF si existe
          if (variant.imageFiles?.datasheet) {
            uploadPromises.push(
              uploadVariantImage(
                variant.imageFiles.datasheet,
                result.product.id,
                result.product.code,
                createdVariant.id,
                'datasheet'
              )
            )
          }

          // Subir spec PDF si existe
          if (variant.imageFiles?.spec) {
            uploadPromises.push(
              uploadVariantImage(
                variant.imageFiles.spec,
                result.product.id,
                result.product.code,
                createdVariant.id,
                'spec'
              )
            )
          }
        }
      } else {
        console.warn('No se encontraron variantes en la respuesta del servidor')
      }
      
      // Esperar a que se suban todas las imágenes
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises)
      }
      
      alert('Producto e imágenes creados exitosamente')
      router.push(`/products/${result.product.code}`)
    } catch (error) {
      console.error(error)
      alert('Error al crear producto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función auxiliar para subir una imagen de variante
  const uploadVariantImage = async (
    file: File,
    productId: number,
    productCode: string,
    variantId: number,
    kind: 'cover' | 'tech' | 'datasheet' | 'spec'
  ): Promise<void> => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('productId', productId.toString())
    formData.append('productCode', productCode)
    formData.append('variantId', variantId.toString())
    formData.append('kind', kind)
    formData.append('altText', `${kind} de ${productCode}`)

    const response = await fetch('/api/products/images/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error subiendo imagen:', error)
      throw new Error(`Error subiendo imagen ${kind}: ${error.error}`)
    }
    
    const result = await response.json()
    console.log(`✅ Imagen ${kind} subida exitosamente:`, result.mediaAsset?.id)
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Crear Nuevo Producto</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Completa la información en cada paso
        </p>
      </div>

      <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
        <button
          onClick={() => setCurrentStep('product')}
          className={`w-full rounded-md px-3 py-2 text-theme-sm font-medium transition-all ${
            currentStep === 'product'
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          1. Info Básica
        </button>
        <button
          onClick={() => setCurrentStep('variants')}
          className={`w-full rounded-md px-3 py-2 text-theme-sm font-medium transition-all ${
            currentStep === 'variants'
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          2. Variantes
        </button>
        <button
          onClick={() => setCurrentStep('review')}
          className={`w-full rounded-md px-3 py-2 text-theme-sm font-medium transition-all ${
            currentStep === 'review'
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          3. Revisar
        </button>
      </div>

      {/* PASO 1: Información Básica */}
      {currentStep === 'product' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Producto
            </h3>
          </div>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Código del Producto <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej: BUR"
                  value={productData.code}
                  onChange={(e) =>
                    setProductData({ ...productData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Producto <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej: Buro Directo"
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Categoría <span className="text-error-500">*</span>
              </label>
              <select
                value={productData.category_id || ''}
                onChange={(e) =>
                  setProductData({ ...productData, category_id: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                placeholder="Describe el producto..."
                value={productData.description}
                onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Acabados Disponibles
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddFinish(!showAddFinish)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-theme-xs font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Acabado
                </button>
              </div>

              {showAddFinish && (
                <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del acabado (ej: Blanco Mate)"
                      value={newFinishName}
                      onChange={(e) => setNewFinishName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateFinish()
                        }
                      }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFinish}
                      disabled={isCreatingFinish || !newFinishName.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreatingFinish ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creando...
                        </>
                      ) : (
                        'Crear'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddFinish(false)
                        setNewFinishName('')
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {sortedFinishes.map((finish) => (
                  <label
                    key={finish.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  >
                    <input
                      type="checkbox"
                      checked={productData.finish_ids.includes(finish.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductData({
                            ...productData,
                            finish_ids: [...productData.finish_ids, finish.id],
                          })
                        } else {
                          setProductData({
                            ...productData,
                            finish_ids: productData.finish_ids.filter((id) => id !== finish.id),
                          })
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-2 focus:ring-brand-500"
                    />
                    <span>{finish.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={productData.is_featured}
                  onChange={(e) => setProductData({ ...productData, is_featured: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Producto destacado
                </span>
              </label>
            </div>

            <div className="flex justify-end border-t border-gray-200 pt-6 dark:border-gray-800">
              <button
                onClick={() => setCurrentStep('variants')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              >
                Siguiente: Variantes
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Variantes */}
      {currentStep === 'variants' && (
        <div className="space-y-6">
          {variants.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Variantes Agregadas ({variants.length})
                </h3>
              </div>
              <div className="space-y-3 p-6">
                {variants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{variant.name}</h4>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                          Código: <span className="font-mono">{variant.variant_code}</span>
                          {variant.cantidad > 0 && (
                            <span className="ml-3">
                              • Cantidad: <span className="font-medium">{variant.cantidad}</span>
                            </span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {variant.includes_led && (
                            <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-1 text-theme-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                              LED
                            </span>
                          )}
                          {variant.includes_driver && (
                            <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-1 text-theme-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                              Driver
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-1 text-theme-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                            {variant.configurations.length} config
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                        className="rounded-lg border border-error-300 bg-white px-3 py-1.5 text-theme-xs font-medium text-error-700 hover:bg-error-50 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agregar Nueva Variante
              </h3>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Código de Variante
                  </label>
                  <input
                    type="text"
                    placeholder="ej: BUR-D"
                    value={currentVariant.variant_code}
                    onChange={(e) =>
                      setCurrentVariant({
                        ...currentVariant,
                        variant_code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de Variante
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Buro Directo"
                    value={currentVariant.name}
                    onChange={(e) =>
                      setCurrentVariant({ ...currentVariant, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    placeholder="ej: 100"
                    min="0"
                    value={currentVariant.cantidad || ''}
                    onChange={(e) =>
                      setCurrentVariant({ ...currentVariant, cantidad: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentVariant.includes_led}
                    onChange={(e) =>
                      setCurrentVariant({ ...currentVariant, includes_led: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Incluye LED
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentVariant.includes_driver}
                    onChange={(e) =>
                      setCurrentVariant({ ...currentVariant, includes_driver: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Incluye Driver
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Tonos de Luz
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {lightTones.map((tone) => (
                    <label
                      key={tone.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                    >
                      <input
                        type="checkbox"
                        checked={currentVariant.light_tone_ids.includes(tone.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCurrentVariant({
                              ...currentVariant,
                              light_tone_ids: [...currentVariant.light_tone_ids, tone.id],
                            })
                          } else {
                            setCurrentVariant({
                              ...currentVariant,
                              light_tone_ids: currentVariant.light_tone_ids.filter(
                                (id) => id !== tone.id
                              ),
                            })
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-2 focus:ring-brand-500"
                      />
                      <span>
                        {tone.name} {tone.kelvin && `(${tone.kelvin}K)`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Imágenes de la Variante */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/30">
                <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                  Imágenes de la Variante
                </h4>
                <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
                  Selecciona las imágenes para esta variante. Se subirán cuando crees el producto.
                </p>
                
                <div className="space-y-4">
                  <LocalImageUpload
                    label="Imagen de Portada (Cover) *"
                    description="Imagen principal de la variante"
                    file={currentVariant.imageFiles?.cover || null}
                    onFileSelect={(file) => {
                      setCurrentVariant({
                        ...currentVariant,
                        imageFiles: {
                          ...currentVariant.imageFiles,
                          cover: file || undefined
                        }
                      })
                    }}
                  />

                  <LocalImageUpload
                    label="Ficha Técnica (Tech)"
                    description="Imagen con especificaciones técnicas (opcional)"
                    file={currentVariant.imageFiles?.tech || null}
                    onFileSelect={(file) => {
                      setCurrentVariant({
                        ...currentVariant,
                        imageFiles: {
                          ...currentVariant.imageFiles,
                          tech: file || undefined
                        }
                      })
                    }}
                  />

                  <LocalImageUpload
                    label="Cartilla Técnica (Datasheet) - PDF"
                    description="Documento PDF con información técnica detallada (opcional)"
                    file={currentVariant.imageFiles?.datasheet || null}
                    accept={{
                      'application/pdf': ['.pdf']
                    }}
                    onFileSelect={(file) => {
                      setCurrentVariant({
                        ...currentVariant,
                        imageFiles: {
                          ...currentVariant.imageFiles,
                          datasheet: file || undefined
                        }
                      })
                    }}
                  />

                  <LocalImageUpload
                    label="Especificaciones (Spec) - PDF"
                    description="Documento PDF con especificaciones adicionales (opcional)"
                    file={currentVariant.imageFiles?.spec || null}
                    accept={{
                      'application/pdf': ['.pdf']
                    }}
                    onFileSelect={(file) => {
                      setCurrentVariant({
                        ...currentVariant,
                        imageFiles: {
                          ...currentVariant.imageFiles,
                          spec: file || undefined
                        }
                      })
                    }}
                  />
                </div>
              </div>

              {/* Configuraciones */}
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-700">
                <h4 className="mb-4 font-medium text-gray-900 dark:text-white">
                  Configuraciones ({currentVariant.configurations.length})
                </h4>

                {currentVariant.configurations.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {currentVariant.configurations.map((config, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3 text-theme-sm">
                          <span className="font-mono font-medium text-gray-900 dark:text-white">
                            {config.sku}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {config.watt}W · {config.lumens}lm
                            {config.voltage && ` · ${config.voltage}V`}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setCurrentVariant({
                              ...currentVariant,
                              configurations: currentVariant.configurations.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          className="text-error-500 hover:text-error-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Agregar Configuración
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        SKU *
                      </label>
                      <input
                        type="text"
                        placeholder="BUR-D-30W"
                        value={currentConfig.sku}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, sku: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Watt *
                      </label>
                      <input
                        type="number"
                        placeholder="30"
                        value={currentConfig.watt || ''}
                        onChange={(e) =>
                          setCurrentConfig({ ...currentConfig, watt: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Lumens *
                      </label>
                      <input
                        type="number"
                        placeholder="3000"
                        value={currentConfig.lumens || ''}
                        onChange={(e) =>
                          setCurrentConfig({ ...currentConfig, lumens: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Voltage
                      </label>
                      <input
                        type="number"
                        placeholder="220"
                        value={currentConfig.voltage || ''}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            voltage: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Diámetro
                      </label>
                      <input
                        type="text"
                        placeholder="120mm"
                        value={currentConfig.diameter_description || ''}
                        onChange={(e) =>
                          setCurrentConfig({ ...currentConfig, diameter_description: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Largo (mm)
                      </label>
                      <input
                        type="number"
                        placeholder="600"
                        value={currentConfig.length_mm || ''}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            length_mm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
                        Ancho (mm)
                      </label>
                      <input
                        type="number"
                        placeholder="40"
                        value={currentConfig.width_mm || ''}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            width_mm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddConfigToVariant}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-theme-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Configuración
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                <button
                  onClick={handleAddVariant}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Variante
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('product')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <button
              onClick={() => setCurrentStep('review')}
              disabled={variants.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente: Revisar
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Revisión */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información del Producto
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">Código</p>
                    <p className="font-mono text-base font-medium text-gray-900 dark:text-white">
                      {productData.code}
                    </p>
                  </div>
                  {productData.is_featured && (
                    <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-1 text-theme-xs font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                      Destacado
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Nombre</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {productData.name}
                  </p>
                </div>
                <div>
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Categoría</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {categories.find((c) => c.id === productData.category_id)?.name}
                  </p>
                </div>
                {productData.description && (
                  <div>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">Descripción</p>
                    <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                      {productData.description}
                    </p>
                  </div>
                )}
                {productData.finish_ids.length > 0 && (
                  <div>
                    <p className="mb-2 text-theme-sm text-gray-500 dark:text-gray-400">Acabados</p>
                    <div className="flex flex-wrap gap-2">
                      {productData.finish_ids.map((id) => {
                        const finish = finishes.find((f) => f.id === id)
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {finish?.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Variantes ({variants.length})
              </h3>
            </div>
            <div className="space-y-4 p-6">
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{variant.name}</h4>
                      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                        Código: <span className="font-mono">{variant.variant_code}</span>
                        {variant.cantidad > 0 && (
                          <span className="ml-3">
                            • Cantidad: <span className="font-medium">{variant.cantidad}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {variant.includes_led && (
                        <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-1 text-theme-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                          LED
                        </span>
                      )}
                      {variant.includes_driver && (
                        <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-1 text-theme-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                          Driver
                        </span>
                      )}
                    </div>
                  </div>

                  {variant.light_tone_ids.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        Tonos de luz
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variant.light_tone_ids.map((id) => {
                          const tone = lightTones.find((t) => t.id === id)
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center rounded-full bg-blue-light-50 px-2 py-0.5 text-theme-xs font-medium text-blue-light-700 dark:bg-blue-light-900/20 dark:text-blue-light-400"
                            >
                              {tone?.name} {tone?.kelvin && `(${tone.kelvin}K)`}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      Configuraciones ({variant.configurations.length})
                    </p>
                    <div className="space-y-2">
                      {variant.configurations.map((config, configIdx) => (
                        <div
                          key={configIdx}
                          className="rounded bg-white px-3 py-2 text-theme-sm dark:bg-gray-900/50"
                        >
                          <span className="font-mono font-medium text-gray-900 dark:text-white">
                            {config.sku}
                          </span>
                          <span className="ml-3 text-gray-600 dark:text-gray-400">
                            {config.watt}W · {config.lumens}lm
                            {config.voltage && ` · ${config.voltage}V`}
                            {config.diameter_description && ` · ⌀${config.diameter_description}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('variants')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-success-500 px-6 py-2.5 text-base font-medium text-white shadow-theme-xs hover:bg-success-600 focus:outline-none focus:ring-4 focus:ring-success-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Crear Producto
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
