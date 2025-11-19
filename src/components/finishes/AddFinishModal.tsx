'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

interface AddFinishModalProps {
  onFinishAdded: () => void
}

export function AddFinishModal({ onFinishAdded }: AddFinishModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [hexColor, setHexColor] = useState('#000000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setIsOpen(true)
    setName('')
    setHexColor('#000000')
    setError(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setName('')
    setHexColor('#000000')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Crear el acabado
      const createResponse = await fetch('/api/finishes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || 'Error al crear el acabado')
      }

      const { data: newFinish } = await createResponse.json()

      // Si hay un color hex, actualizarlo
      if (hexColor && hexColor !== '#000000') {
        const updateResponse = await fetch(`/api/finishes/${newFinish.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hex_color: hexColor })
        })

        if (!updateResponse.ok) {
          console.error('Error al actualizar el color, pero el acabado fue creado')
        }
      }

      // Notificar que se agregó el acabado
      onFinishAdded()
      handleClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onPress={handleOpen}
        className="bg-brand-500 hover:bg-brand-600 text-white"
        startContent={<PlusIcon className="w-4 h-4" />}
      >
        Agregar Acabado
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
          onClick={handleClose}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agregar Nuevo Acabado
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del acabado *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Negro Mate"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El slug se generará automáticamente
                </p>
              </div>

              <div>
                <label htmlFor="hex-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color HEX (opcional)
                </label>
                <div className="flex gap-3">
                  <input
                    id="hex-color"
                    type="text"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    placeholder="#000000"
                    maxLength={7}
                    className="flex-1 rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div
                  className="w-16 h-16 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: hexColor }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista previa</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{name || 'Sin nombre'}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end gap-3">
                <Button 
                  type="button"
                  variant="flat" 
                  onPress={handleClose}
                  className="border border-gray-300 dark:border-gray-700"
                  isDisabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  color="primary" 
                  isLoading={loading}
                  className="bg-brand-500 hover:bg-brand-600 text-white"
                >
                  {loading ? 'Creando...' : 'Crear Acabado'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
