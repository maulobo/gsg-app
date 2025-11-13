'use client'

import { useState, useEffect, useRef } from 'react'
import { LocalImageUpload } from './LocalImageUpload'

type FeaturedItem = {
  id: number
  title: string
  product_code: string | null
  image_url: string
  link_url: string | null
  display_order: number
  is_active: boolean
}

type ProductCode = {
  code: string
  name: string
}

export function FeaturedItemsManager() {
  const [items, setItems] = useState<FeaturedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    product_code: '',
    link_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Autocomplete state
  const [productSuggestions, setProductSuggestions] = useState<ProductCode[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadItems()
  }, [])

  // Cerrar suggestions al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/featured-items')
      const { data } = await response.json()
      setItems(data || [])
    } catch (error) {
      console.error('Error loading featured items:', error)
      alert('Error al cargar items destacados')
    } finally {
      setIsLoading(false)
    }
  }

  const searchProductCodes = async (query: string) => {
    if (query.length < 3) {
      setProductSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/products/search-codes?q=${encodeURIComponent(query)}`)
      const { data } = await response.json()
      setProductSuggestions(data || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error searching product codes:', error)
      setProductSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleProductCodeChange = (value: string) => {
    setFormData({ ...formData, product_code: value })
    setSelectedProductCode(null)

    // Cancelar búsqueda anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Buscar después de 300ms de inactividad
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchProductCodes(value.trim())
      }, 300)
    } else {
      setProductSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectProductCode = (product: ProductCode) => {
    setFormData({ ...formData, product_code: product.code })
    setSelectedProductCode(product.code)
    setShowSuggestions(false)
    setProductSuggestions([])
  }

  const validateProductCode = async (code: string): Promise<boolean> => {
    if (!code.trim()) return true // Opcional, puede estar vacío

    try {
      const response = await fetch(`/api/products/search-codes?q=${encodeURIComponent(code)}`)
      const { data } = await response.json()
      
      // Verificar si existe un producto con ese código exacto
      const exactMatch = data?.find((p: ProductCode) => p.code.toLowerCase() === code.toLowerCase())
      return !!exactMatch
    } catch (error) {
      console.error('Error validating product code:', error)
      return false
    }
  }

  const handleOpenModal = (item?: FeaturedItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        product_code: item.product_code || '',
        link_url: item.link_url || '',
      })
      setSelectedProductCode(item.product_code)
    } else {
      setEditingItem(null)
      setFormData({ title: '', product_code: '', link_url: '' })
      setImageFile(null)
      setSelectedProductCode(null)
    }
    setShowModal(true)
    setProductSuggestions([])
    setShowSuggestions(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({ title: '', product_code: '', link_url: '' })
    setImageFile(null)
    setSelectedProductCode(null)
    setProductSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar código de producto si se proporcionó
    if (formData.product_code.trim()) {
      const isValid = await validateProductCode(formData.product_code.trim())
      if (!isValid) {
        alert('❌ El código de producto no existe. Por favor selecciona uno de la lista de sugerencias.')
        return
      }
    }

    setIsSaving(true)

    try {
      let imageUrl = editingItem?.image_url || ''

      // Si hay nueva imagen, subirla primero
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', imageFile)
        uploadFormData.append('kind', 'featured')
        uploadFormData.append('altText', formData.title)

        const uploadResponse = await fetch('/api/featured-items/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen')
        }

        const { imageUrl: newImageUrl } = await uploadResponse.json()
        imageUrl = newImageUrl
      }

      // Crear o actualizar item
      if (editingItem) {
        // Actualizar
        const response = await fetch('/api/featured-items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            title: formData.title,
            product_code: formData.product_code || null,
            link_url: formData.link_url || null,
            image_url: imageUrl,
          }),
        })

        if (!response.ok) {
          const { error } = await response.json()
          throw new Error(error || 'Error al actualizar')
        }

        alert('Item actualizado exitosamente')
      } else {
        // Crear
        if (!imageUrl) {
          alert('Debes seleccionar una imagen')
          return
        }

        const response = await fetch('/api/featured-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            product_code: formData.product_code || null,
            link_url: formData.link_url || null,
            image_url: imageUrl,
          }),
        })

        if (!response.ok) {
          const { error } = await response.json()
          throw new Error(error || 'Error al crear')
        }

        alert('Item creado exitosamente')
      }

      handleCloseModal()
      loadItems()
    } catch (error) {
      console.error('Error saving item:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return

    try {
      const response = await fetch(`/api/featured-items?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      alert('Item eliminado')
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error al eliminar item')
    }
  }

  const handleReorder = async (id: number, newOrder: number) => {
    try {
      const response = await fetch('/api/featured-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, display_order: newOrder }),
      })

      if (!response.ok) {
        throw new Error('Error al reordenar')
      }

      loadItems()
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Error al reordenar')
    }
  }

  const handleToggleActive = async (id: number, currentState: boolean) => {
    const activeCount = items.filter(i => i.is_active && i.id !== id).length
    
    if (!currentState && activeCount >= 3) {
      alert('Ya hay 3 items activos. Desactiva uno primero.')
      return
    }

    try {
      const response = await fetch('/api/featured-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentState }),
      })

      if (!response.ok) {
        throw new Error('Error al cambiar estado')
      }

      loadItems()
    } catch (error) {
      console.error('Error toggling active:', error)
      alert('Error al cambiar estado')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-600"></div>
      </div>
    )
  }

  // Ordenar todos los items por display_order
  const sortedItems = [...items].sort((a, b) => a.display_order - b.display_order)
  const activeCount = items.filter(i => i.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeCount} de 3 items activos
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={activeCount >= 3}
          className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Item
        </button>
      </div>

      {/* Todos los items (activos e inactivos mezclados) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Items Destacados
          </h2>
        </div>
        <div className="p-6">
          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">
              No hay items. Haz clic en "Agregar Item" para comenzar.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 relative ${
                    item.is_active
                      ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]'
                      : 'border-gray-300 bg-gray-100 opacity-60 dark:border-gray-600 dark:bg-gray-800/50'
                  }`}
                >
                  {/* Badge de estado INACTIVO */}
                  {!item.is_active && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      INACTIVO
                    </div>
                  )}

                  {/* Orden */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(item.id, item.display_order - 1)}
                      disabled={item.display_order === 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="text-xs font-semibold text-gray-500">{item.display_order}</span>
                    <button
                      onClick={() => handleReorder(item.id, item.display_order + 1)}
                      disabled={item.display_order === items.length}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Imagen */}
                  <div className="relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-20 w-32 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                    {!item.is_active && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      {item.is_active && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    {item.product_code && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        Código: {item.product_code}
                      </p>
                    )}
                    {item.link_url && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        🔗 {item.link_url}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      title="Editar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        item.is_active
                          ? 'border border-gray-300 bg-red-200 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {item.is_active ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="rounded-lg bg-error-500 px-3 py-2 text-sm font-medium text-white hover:bg-error-600"
                      title="Eliminar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="border-b border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingItem ? 'Editar Item' : 'Nuevo Item Destacado'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Título <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="relative" ref={suggestionsRef}>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Código del Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.product_code}
                      onChange={(e) => handleProductCodeChange(e.target.value)}
                      onFocus={() => {
                        if (formData.product_code.length >= 3 && productSuggestions.length > 0) {
                          setShowSuggestions(true)
                        }
                      }}
                      placeholder="Ej: GSG-001"
                      className={`w-full rounded-lg border px-4 py-2.5 text-theme-sm shadow-theme-xs focus:outline-none focus:ring-4 ${
                        selectedProductCode === formData.product_code && formData.product_code
                          ? 'border-success-500 bg-white text-gray-900 focus:border-success-500 focus:ring-success-500/10 dark:border-success-600 dark:bg-gray-800 dark:text-white'
                          : 'border-gray-300 bg-white text-gray-900 focus:border-brand-500 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                      }`}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600 dark:border-gray-600 dark:border-t-brand-500"></div>
                      </div>
                    )}
                    {selectedProductCode === formData.product_code && formData.product_code && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-5 w-5 text-success-500 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && productSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 max-h-60 overflow-y-auto">
                      {productSuggestions.map((product) => (
                        <button
                          key={product.code}
                          type="button"
                          onClick={() => handleSelectProductCode(product)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-400 dark:hover:bg-white/[0.05] border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors"
                        >
                          <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                            {product.code}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {product.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {showSuggestions && !isSearching && formData.product_code.length >= 3 && productSuggestions.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ❌ No se encontraron productos con ese código
                      </p>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.product_code.length < 3 
                      ? 'Escribe al menos 3 caracteres para buscar'
                      : selectedProductCode === formData.product_code && formData.product_code
                      ? '✓ Código válido'
                      : 'Selecciona un código de la lista'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Enlace (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Imagen {!editingItem && <span className="text-error-500">*</span>}
                  </label>
                  {editingItem && !imageFile && (
                    <div className="mb-4">
                      <img
                        src={editingItem.image_url}
                        alt="Actual"
                        className="h-32 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Imagen actual. Sube una nueva para reemplazarla.
                      </p>
                    </div>
                  )}
                  <LocalImageUpload
                    label=""
                    description="Selecciona una imagen"
                    file={imageFile}
                    onFileSelect={setImageFile}
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
