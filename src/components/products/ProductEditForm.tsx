'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProductWithRelations } from '@/types/database'

type ProductEditFormProps = {
  product: ProductWithRelations
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    category_id: product.category_id,
    is_featured: product.is_featured,
  })

  useEffect(() => {
    // Simular carga de datos adicionales si es necesario
    setIsLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/products/${product.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el producto')
      }

      alert('Producto actualizado exitosamente')
      router.push(`/products/${product.code}`)
    } catch (error) {
      console.error(error)
      alert('Error al actualizar el producto')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="text-lg font-semibold text-black dark:text-white">Información Básica</h2>
        </div>
        <div className="p-6 space-y-4">
        
        {/* Código (no editable) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Código del Producto
          </label>
          <input
            type="text"
            value={product.code}
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-theme-sm text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">El código no se puede modificar</p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Nombre <span className="text-error-500">*</span>
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
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        {/* Categoría (mostrar actual) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Categoría
          </label>
          <input
            type="text"
            value={product.category?.name || 'Sin categoría'}
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-theme-sm text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">La categoría no se puede modificar por ahora</p>
        </div>

        {/* Destacado */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto destacado</span>
          </label>
        </div>
        </div>
      </div>

      {/* Variantes */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Variantes</h2>
            <button
              type="button"
              onClick={() => router.push(`/products/${product.code}/variants/new`)}
              className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300 dark:focus:ring-brand-800"
            >
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Variante
            </button>
          </div>
        </div>
        <div className="p-6">
          {product.product_variants && product.product_variants.length > 0 ? (
            <>
              <div className="space-y-3">
                {product.product_variants.map((variant) => (
                <div key={variant.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{variant.name}</h3>
                      {variant.variant_code && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Código: {variant.variant_code}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/products/${product.code}/variants/${variant.id}/edit`)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Editar variante →
                    </button>
                  </div>
                  
                  {/* Imágenes de la variante */}
                  {variant.media_assets && variant.media_assets.length > 0 && (
                    <div className="mt-3 flex gap-3">
                      {variant.media_assets.map((img) => (
                        <div key={img.id} className="relative">
                          <img
                            src={img.path}
                            alt={img.alt_text || variant.name}
                            className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                          />
                          <span className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gray-900/80 px-1 text-center text-xs text-white">
                            {img.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                Para editar o agregar variantes, usa los botones correspondientes
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
              No hay variantes creadas. Haz clic en "Agregar Variante" para crear una.
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.push(`/products/${product.code}`)}
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
