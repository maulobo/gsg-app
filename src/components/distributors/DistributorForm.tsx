'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@heroui/react'
import type { DistributorFormData } from '@/features/distributors/types'
import type { DistributorZone, Distributor } from '@/types/database'

type DistributorFormProps = {
  zones: DistributorZone[]
  distributor?: Distributor | null
  mode: 'create' | 'edit'
}

export function DistributorForm({ zones, distributor, mode }: DistributorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<DistributorFormData>({
    zone_id: distributor?.zone_id || 0,
    name: distributor?.name || '',
    address: distributor?.address || '',
    locality: distributor?.locality || '',
    phone: distributor?.phone || '',
    google_maps_url: distributor?.google_maps_url || '',
    email: distributor?.email || '',
    website: distributor?.website || '',
    notes: distributor?.notes || '',
    active: distributor?.active ?? true,
    display_order: distributor?.display_order || 100
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.zone_id) newErrors.zone_id = 'La zona es obligatoria'
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio'
    if (!formData.locality.trim()) newErrors.locality = 'La localidad es obligatoria'
    if (!formData.address.trim()) newErrors.address = 'La dirección es obligatoria'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'La URL debe comenzar con http:// o https://'
    }
    if (formData.google_maps_url && !/^https?:\/\/.+/.test(formData.google_maps_url)) {
      newErrors.google_maps_url = 'La URL debe comenzar con http:// o https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Por favor corrige los errores en el formulario')
      return
    }

    setIsSubmitting(true)
    try {
      const url = mode === 'create' 
        ? '/api/distributors' 
        : `/api/distributors/${distributor?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      alert(`✅ Distribuidor ${mode === 'create' ? 'creado' : 'actualizado'} exitosamente`)
      router.push('/distributors')
      router.refresh()
    } catch (error) {
      console.error('Error saving distributor:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar el distribuidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {mode === 'create' ? 'Nuevo Distribuidor' : 'Editar Distribuidor'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {mode === 'create' 
            ? 'Completa la información del nuevo distribuidor autorizado' 
            : 'Actualiza la información del distribuidor'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Información Básica
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zone */}
            <div>
              <label htmlFor="zone_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zona <span className="text-danger-600">*</span>
              </label>
              <select
                id="zone_id"
                value={formData.zone_id || ''}
                onChange={(e) => setFormData({ ...formData, zone_id: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.zone_id ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecciona una zona</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
              {errors.zone_id && <p className="mt-1 text-xs text-danger-600">{errors.zone_id}</p>}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre <span className="text-danger-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Iluminodo"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name}</p>}
            </div>

            {/* Locality */}
            <div>
              <label htmlFor="locality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localidad <span className="text-danger-600">*</span>
              </label>
              <input
                id="locality"
                type="text"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                placeholder="Ej: Ituzaingó"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.locality ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.locality && <p className="mt-1 text-xs text-danger-600">{errors.locality}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+54 11 4458-1390"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección <span className="text-danger-600">*</span>
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Farrel, Colectora Sur Acceso Oeste 6696, B1714"
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.address ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.address && <p className="mt-1 text-xs text-danger-600">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Contact & Web */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Contacto y Web
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@distribuidor.com"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email}</p>}
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sitio Web
              </label>
              <input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.distribuidor.com"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.website ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.website && <p className="mt-1 text-xs text-danger-600">{errors.website}</p>}
            </div>

            {/* Google Maps */}
            <div className="md:col-span-2">
              <label htmlFor="google_maps_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link de Google Maps
              </label>
              <input
                id="google_maps_url"
                type="url"
                value={formData.google_maps_url || ''}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                placeholder="https://www.google.com/maps/search/?api=1&query=..."
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.google_maps_url ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URL directa para abrir la ubicación en Google Maps
              </p>
              {errors.google_maps_url && <p className="mt-1 text-xs text-danger-600">{errors.google_maps_url}</p>}
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Configuración Adicional
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Order */}
            <div>
              <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Orden de Visualización
              </label>
              <input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Menor número = aparece primero
              </p>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <div className="flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {formData.active ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este distribuidor"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="bordered"
            onPress={() => router.back()}
            isDisabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            color="primary"
            isLoading={isSubmitting}
            className="px-8"
          >
            {mode === 'create' ? 'Crear Distribuidor' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
