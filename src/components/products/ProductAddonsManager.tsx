'use client'

import { useState } from 'react'
import { X, Plus, Save, Trash2 } from 'lucide-react'

export type AddonFormData = {
  id?: number // Si ya existe
  code: string
  name: string
  description?: string
  category: 'control' | 'installation' | 'accessory' | 'driver'
  specs: Record<string, string>
  stock_quantity?: number
}

type ProductAddonsManagerProps = {
  addons: AddonFormData[]
  onChange: (addons: AddonFormData[]) => void
}

const CATEGORY_LABELS = {
  control: '🎛️ Control',
  installation: '🔧 Instalación',
  driver: '⚡ Driver',
  accessory: '🔌 Accesorio',
}

export function ProductAddonsManager({ addons, onChange }: ProductAddonsManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentAddon, setCurrentAddon] = useState<AddonFormData>({
    code: '',
    name: '',
    description: '',
    category: 'control',
    specs: {},
    stock_quantity: 0,
  })
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  const handleAddSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return
    setCurrentAddon({
      ...currentAddon,
      specs: { ...currentAddon.specs, [specKey]: specValue },
    })
    setSpecKey('')
    setSpecValue('')
  }

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...currentAddon.specs }
    delete newSpecs[key]
    setCurrentAddon({ ...currentAddon, specs: newSpecs })
  }

  const handleSaveAddon = () => {
    if (!currentAddon.code || !currentAddon.name) {
      alert('Código y nombre son requeridos')
      return
    }

    if (editingIndex !== null) {
      // Editar addon existente
      const updated = [...addons]
      updated[editingIndex] = currentAddon
      onChange(updated)
      setEditingIndex(null)
    } else {
      // Agregar nuevo addon
      onChange([...addons, currentAddon])
    }

    // Reset form
    setCurrentAddon({
      code: '',
      name: '',
      description: '',
      category: 'control',
      specs: {},
      stock_quantity: 0,
    })
    setIsAdding(false)
  }

  const handleEditAddon = (index: number) => {
    setCurrentAddon(addons[index])
    setEditingIndex(index)
    setIsAdding(true)
  }

  const handleDeleteAddon = (index: number) => {
    if (confirm('¿Eliminar este addon?')) {
      onChange(addons.filter((_, i) => i !== index))
    }
  }

  const handleCancel = () => {
    setCurrentAddon({
      code: '',
      name: '',
      description: '',
      category: 'control',
      specs: {},
      stock_quantity: 0,
    })
    setIsAdding(false)
    setEditingIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Accesorios y Complementos
        </h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Agregar Addon
          </button>
        )}
      </div>

      {/* Lista de addons */}
      {addons.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {addons.map((addon, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {addon.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                    {addon.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                    {CATEGORY_LABELS[addon.category]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEditAddon(index)}
                    className="text-gray-400 hover:text-brand-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddon(index)}
                    className="text-gray-400 hover:text-error-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {addon.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {addon.description}
                </p>
              )}
              {Object.keys(addon.specs).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(addon.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Formulario de agregar/editar */}
      {isAdding && (
        <div className="rounded-lg border-2 border-brand-200 bg-brand-50 p-6 dark:border-brand-800 dark:bg-brand-950/20">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? 'Editar Addon' : 'Nuevo Addon'}
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código *
              </label>
              <input
                type="text"
                value={currentAddon.code}
                onChange={(e) => setCurrentAddon({ ...currentAddon, code: e.target.value.toUpperCase() })}
                placeholder="SAT-DIM-LLA"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={currentAddon.name}
                onChange={(e) => setCurrentAddon({ ...currentAddon, name: e.target.value })}
                placeholder="Dimmer Llavero"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría *
              </label>
              <select
                value={currentAddon.category}
                onChange={(e) => setCurrentAddon({ ...currentAddon, category: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="control">🎛️ Control</option>
                <option value="installation">🔧 Instalación</option>
                <option value="driver">⚡ Driver</option>
                <option value="accessory">🔌 Accesorio</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={currentAddon.description}
                onChange={(e) => setCurrentAddon({ ...currentAddon, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Especificaciones */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Especificaciones
            </label>

            {Object.keys(currentAddon.specs).length > 0 && (
              <div className="mb-3 space-y-2">
                {Object.entries(currentAddon.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                    <span className="flex-1 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{key}:</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">{value}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(key)}
                      className="text-gray-400 hover:text-error-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                placeholder="Clave (ej: alcance)"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Valor (ej: 10 m)"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleSaveAddon}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <Save className="h-4 w-4" />
              {editingIndex !== null ? 'Actualizar' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {addons.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No hay addons asociados a este producto
        </p>
      )}
    </div>
  )
}
