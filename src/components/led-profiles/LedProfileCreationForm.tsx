'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LedDiffuser, Finish } from '@/types/database'

type LedProfileCreationFormProps = {
  diffusers: LedDiffuser[]
  finishes: Finish[]
}

type DiffuserRelation = {
  tone: string // 'opal' | 'transparente'
  material: string // 'PVC' | 'PC' | 'Silicona'
  notes: string
}

type ProfilePart = {
  name: string
  kind: 'included' | 'optional'
  qty_per_m: number
  notes: string
  photo_url: string
  display_order: number
}

export function LedProfileCreationForm({ diffusers, finishes }: LedProfileCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'basic' | 'diffusers' | 'finishes' | 'parts' | 'images' | 'review'>('basic')

  // Basic info
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    material: 'aluminium',
    max_w_per_m: 0,
    use_cases: '',
  })

  // Relations
  const [selectedDiffusers, setSelectedDiffusers] = useState<DiffuserRelation[]>([])
  const [selectedFinishIds, setSelectedFinishIds] = useState<number[]>([])
  const [includedParts, setIncludedParts] = useState<ProfilePart[]>([])
  const [optionalParts, setOptionalParts] = useState<ProfilePart[]>([])

  // Images
  const [techImage, setTechImage] = useState<File | null>(null)
  const [techImagePreview, setTechImagePreview] = useState<string>('')
  const [galleryImage, setGalleryImage] = useState<File | null>(null)
  const [galleryImagePreview, setGalleryImagePreview] = useState<string>('')
  
  // PDFs
  const [datasheetPdf, setDatasheetPdf] = useState<File | null>(null)
  const [datasheetPreview, setDatasheetPreview] = useState<string>('')
  const [specPdf, setSpecPdf] = useState<File | null>(null)
  const [specPreview, setSpecPreview] = useState<string>('')

  // Temp states for adding relations
  const [tempDiffuser, setTempDiffuser] = useState({
    tone: '', // 'opal' | 'transparente'
    material: '', // 'PVC' | 'PC' | 'Silicona'
    notes: ''
  })
  const [tempIncludedPart, setTempIncludedPart] = useState<ProfilePart>({ 
    name: '', 
    kind: 'included', 
    qty_per_m: 0, 
    notes: '', 
    photo_url: '', 
    display_order: 100 
  })
  const [tempOptionalPart, setTempOptionalPart] = useState<ProfilePart>({ 
    name: '', 
    kind: 'optional', 
    qty_per_m: 0, 
    notes: '', 
    photo_url: '', 
    display_order: 100 
  })

  const handleSubmit = async () => {
    // Validate basic info
    if (!formData.code || !formData.name || !formData.material) {
      alert('Por favor completa todos los campos obligatorios (código, nombre, material)')
      return
    }

    if (formData.max_w_per_m <= 0) {
      alert('La potencia máxima por metro debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create the LED profile
      const profileResponse = await fetch('/api/led-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!profileResponse.ok) {
        const error = await profileResponse.json()
        throw new Error(error.error || 'Error al crear el perfil LED')
      }

      const { profile } = await profileResponse.json()
      const profileId = profile.id

      // 2. Add diffusers
      for (const diffuser of selectedDiffusers) {
        await fetch(`/api/led-profiles/${profileId}/diffusers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diffuser),
        })
      }

      // 3. Add finishes
      for (const finishId of selectedFinishIds) {
        await fetch(`/api/led-profiles/${profileId}/finishes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finish_id: finishId }),
        })
      }

      // 4. Add profile parts (included)
      for (const part of includedParts) {
        await fetch(`/api/led-profiles/${profileId}/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...part, profile_id: profileId }),
        })
      }

      // 5. Add profile parts (optional)
      for (const part of optionalParts) {
        await fetch(`/api/led-profiles/${profileId}/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...part, profile_id: profileId }),
        })
      }

      // 6. Upload images
      if (techImage) {
        const techFormData = new FormData()
        techFormData.append('image', techImage)
        techFormData.append('profileId', profileId.toString())
        techFormData.append('profileCode', formData.code)
        techFormData.append('kind', 'tech')
        techFormData.append('altText', `${formData.name} - Foto Técnica`)

        await fetch('/api/led-profiles/images/upload', {
          method: 'POST',
          body: techFormData,
        })
      }

      if (galleryImage) {
        const galleryFormData = new FormData()
        galleryFormData.append('image', galleryImage)
        galleryFormData.append('profileId', profileId.toString())
        galleryFormData.append('profileCode', formData.code)
        galleryFormData.append('kind', 'gallery')
        galleryFormData.append('altText', `${formData.name} - Galería`)

        await fetch('/api/led-profiles/images/upload', {
          method: 'POST',
          body: galleryFormData,
        })
      }

      // 7. Upload PDFs
      if (datasheetPdf) {
        const datasheetFormData = new FormData()
        datasheetFormData.append('image', datasheetPdf)
        datasheetFormData.append('profileId', profileId.toString())
        datasheetFormData.append('profileCode', formData.code)
        datasheetFormData.append('kind', 'datasheet')
        datasheetFormData.append('altText', `${formData.name} - Cartilla Técnica`)

        await fetch('/api/led-profiles/images/upload', {
          method: 'POST',
          body: datasheetFormData,
        })
      }

      if (specPdf) {
        const specFormData = new FormData()
        specFormData.append('image', specPdf)
        specFormData.append('profileId', profileId.toString())
        specFormData.append('profileCode', formData.code)
        specFormData.append('kind', 'spec')
        specFormData.append('altText', `${formData.name} - Especificaciones`)

        await fetch('/api/led-profiles/images/upload', {
          method: 'POST',
          body: specFormData,
        })
      }

      alert('✅ Perfil LED creado exitosamente con todas sus relaciones')
      router.push('/led-profiles')
      router.refresh()
    } catch (error) {
      console.error('Error creating LED profile:', error)
      alert(error instanceof Error ? error.message : 'Error al crear el perfil LED')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addDiffuser = () => {
    if (!tempDiffuser.tone || !tempDiffuser.material) {
      alert('Selecciona el tono y material del difusor')
      return
    }
    setSelectedDiffusers([...selectedDiffusers, { ...tempDiffuser }])
    setTempDiffuser({ tone: '', material: '', notes: '' })
  }

  const removeDiffuser = (index: number) => {
    setSelectedDiffusers(selectedDiffusers.filter((_, i) => i !== index))
  }

  const addIncludedPart = () => {
    if (!tempIncludedPart.name.trim()) {
      alert('Ingresa el nombre de la parte')
      return
    }
    if (tempIncludedPart.qty_per_m <= 0) {
      alert('La cantidad por metro debe ser mayor a 0')
      return
    }
    
    setIncludedParts([...includedParts, { ...tempIncludedPart }])
    setTempIncludedPart({ 
      name: '', 
      kind: 'included', 
      qty_per_m: 0, 
      notes: '', 
      photo_url: '', 
      display_order: 100 
    })
  }

  const removeIncludedPart = (index: number) => {
    setIncludedParts(includedParts.filter((_, i) => i !== index))
  }

  const addOptionalPart = () => {
    if (!tempOptionalPart.name.trim()) {
      alert('Ingresa el nombre de la parte')
      return
    }
    if (tempOptionalPart.qty_per_m <= 0) {
      alert('La cantidad por metro debe ser mayor a 0')
      return
    }
    
    setOptionalParts([...optionalParts, { ...tempOptionalPart }])
    setTempOptionalPart({ 
      name: '', 
      kind: 'optional', 
      qty_per_m: 0, 
      notes: '', 
      photo_url: '', 
      display_order: 100 
    })
  }

  const removeOptionalPart = (index: number) => {
    setOptionalParts(optionalParts.filter((_, i) => i !== index))
  }

  const toggleFinish = (finishId: number) => {
    if (selectedFinishIds.includes(finishId)) {
      setSelectedFinishIds(selectedFinishIds.filter(id => id !== finishId))
    } else {
      setSelectedFinishIds([...selectedFinishIds, finishId])
    }
  }

  const handleTechImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTechImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTechImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGalleryImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeTechImage = () => {
    setTechImage(null)
    setTechImagePreview('')
  }

  const removeGalleryImage = () => {
    setGalleryImage(null)
    setGalleryImagePreview('')
  }

  const handleDatasheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDatasheetPdf(file)
      setDatasheetPreview(file.name)
    }
  }

  const handleSpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSpecPdf(file)
      setSpecPreview(file.name)
    }
  }

  const removeDatasheet = () => {
    setDatasheetPdf(null)
    setDatasheetPreview('')
  }

  const removeSpec = () => {
    setSpecPdf(null)
    setSpecPreview('')
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-600">Crear Perfil LED</h1>
        <p className="text-sm text-gray-600 mt-1">
          Completa toda la información del nuevo perfil LED
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'basic', label: '1. Info Básica' },
          { key: 'diffusers', label: '2. Difusores' },
          { key: 'finishes', label: '3. Acabados' },
          { key: 'parts', label: '4. Partes' },
          { key: 'images', label: '5. Imágenes' },
          { key: 'review', label: '6. Revisar' }
        ].map((step, index) => (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => setCurrentStep(step.key as any)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                currentStep === step.key
                  ? 'bg-brand-500 text-white shadow-theme-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
            </button>
            {index < 5 && <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-700" />}
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
                  placeholder="LED-ALU-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Perfil LED Aluminio 2m"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Material *</label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  <option value="aluminium">Aluminio 6061</option>
                  <option value="plastic">Plástico</option>
                  <option value="steel">Acero</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Potencia Máxima (W/m) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.max_w_per_m}
                  onChange={(e) => setFormData({ ...formData, max_w_per_m: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="24.5"
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
                placeholder="Descripción del perfil LED..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Casos de Uso</label>
              <textarea
                value={formData.use_cases}
                onChange={(e) => setFormData({ ...formData, use_cases: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                rows={3}
                placeholder="Iluminación de tiras LED, instalaciones empotradas..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('diffusers')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors shadow-theme-sm"
              >
                Siguiente: Difusores →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Diffusers */}
        {currentStep === 'diffusers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Difusores</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Agrega los difusores que se incluyen con este perfil
            </p>
            
            <div className="border border-blue-light-200 rounded-lg p-4 bg-blue-light-50 dark:bg-blue-light-950 dark:border-blue-light-800">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Agregar Difusor</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tono del Difusor *</label>
                  <select
                    value={tempDiffuser.tone}
                    onChange={(e) => setTempDiffuser({ ...tempDiffuser, tone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="opal">Opal</option>
                    <option value="transparente">Transparente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Material *</label>
                  <select
                    value={tempDiffuser.material}
                    onChange={(e) => setTempDiffuser({ ...tempDiffuser, material: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="PVC">PVC</option>
                    <option value="PC">PC (Policarbonato)</option>
                    <option value="Silicona">Silicona</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addDiffuser}
                    className="w-full rounded-md bg-blue-light-500 px-4 py-2 text-white hover:bg-blue-light-600 transition-colors shadow-theme-sm"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notas</label>
                <input
                  type="text"
                  value={tempDiffuser.notes}
                  onChange={(e) => setTempDiffuser({ ...tempDiffuser, notes: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Selected diffusers list */}
            {selectedDiffusers.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Difusores Seleccionados ({selectedDiffusers.length})</h3>
                <div className="space-y-2">
                  {selectedDiffusers.map((d, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-light-50 p-3 rounded-lg border border-blue-light-200 dark:bg-blue-light-950 dark:border-blue-light-800">
                      <div>
                        <p className="font-medium text-blue-light-900 dark:text-blue-light-100">
                          {d.tone === 'opal' ? 'Opal' : d.tone === 'transparente' ? 'Transparente' : d.tone}
                        </p>
                        <p className="text-sm text-blue-light-700 dark:text-blue-light-300">
                          Material: {d.material}
                          {d.notes && ` • ${d.notes}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDiffuser(index)}
                        className="text-error-600 hover:text-error-700 font-medium px-3 py-1 rounded hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-950 transition-colors"
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
                onClick={() => setCurrentStep('basic')}
                className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('finishes')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors shadow-theme-sm"
              >
                Siguiente: Acabados →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Finishes */}
        {currentStep === 'finishes' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Acabados</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Selecciona los acabados disponibles para este perfil LED ({selectedFinishIds.length} seleccionados)
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {finishes.map(finish => (
                <button
                  key={finish.id}
                  type="button"
                  onClick={() => toggleFinish(finish.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedFinishIds.includes(finish.id)
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 dark:border-brand-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  {finish.hex_color && (
                    <div
                      className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: finish.hex_color }}
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{finish.name}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('diffusers')}
                className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('parts')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors shadow-theme-sm"
              >
                Siguiente: Partes →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Profile Parts (Included & Optional) */}
        {currentStep === 'parts' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Partes del Perfil</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Agrega las partes específicas de este perfil LED (grampas, extremos, tapas, etc.)
            </p>
            
            {/* Included Parts */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-success-700 dark:text-success-400">Partes Incluidas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Partes que vienen incluidas con el perfil</p>
              <div className="border border-success-200 rounded-lg p-4 bg-success-50 dark:bg-success-950 dark:border-success-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre de la Parte *</label>
                    <input
                      type="text"
                      value={tempIncludedPart.name}
                      onChange={(e) => setTempIncludedPart({ ...tempIncludedPart, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="ej: Grampa, Extremo ciego, Tapa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cant. por metro *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempIncludedPart.qty_per_m}
                      onChange={(e) => setTempIncludedPart({ ...tempIncludedPart, qty_per_m: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notas (material, especificaciones)</label>
                    <input
                      type="text"
                      value={tempIncludedPart.notes}
                      onChange={(e) => setTempIncludedPart({ ...tempIncludedPart, notes: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="ej: acero inoxidable, plástico PP"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addIncludedPart}
                    className="w-full rounded-md bg-success-600 px-4 py-2 text-white hover:bg-success-700 transition-colors shadow-theme-sm"
                  >
                    + Agregar Parte Incluida
                  </button>
                </div>
              </div>

              {includedParts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {includedParts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between bg-success-50 p-3 rounded-lg border border-success-200 dark:bg-success-950 dark:border-success-800">
                      <div>
                        <p className="font-medium text-success-900 dark:text-success-100">{part.name}</p>
                        <p className="text-sm text-success-700 dark:text-success-300">
                          {part.qty_per_m} por metro
                          {part.notes && ` • ${part.notes}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIncludedPart(index)}
                        className="text-error-600 hover:text-error-700 font-medium px-3 py-1 rounded hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-950 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Parts */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-warning-700 dark:text-warning-400">Partes Opcionales</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Partes que se pueden comprar adicionalmente</p>
              <div className="border border-warning-200 rounded-lg p-4 bg-warning-50 dark:bg-warning-950 dark:border-warning-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre de la Parte *</label>
                    <input
                      type="text"
                      value={tempOptionalPart.name}
                      onChange={(e) => setTempOptionalPart({ ...tempOptionalPart, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="ej: Conector, Adaptador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cant. por metro *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempOptionalPart.qty_per_m}
                      onChange={(e) => setTempOptionalPart({ ...tempOptionalPart, qty_per_m: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notas (material, especificaciones)</label>
                    <input
                      type="text"
                      value={tempOptionalPart.notes}
                      onChange={(e) => setTempOptionalPart({ ...tempOptionalPart, notes: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="ej: aluminio anodizado"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addOptionalPart}
                    className="w-full rounded-md bg-warning-600 px-4 py-2 text-white hover:bg-warning-700 transition-colors shadow-theme-sm"
                  >
                    + Agregar Parte Opcional
                  </button>
                </div>
              </div>

              {optionalParts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {optionalParts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between bg-warning-50 p-3 rounded-lg border border-warning-200 dark:bg-warning-950 dark:border-warning-800">
                      <div>
                        <p className="font-medium text-warning-900 dark:text-warning-100">{part.name}</p>
                        <p className="text-sm text-warning-700 dark:text-warning-300">
                          {part.qty_per_m} por metro
                          {part.notes && ` • ${part.notes}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOptionalPart(index)}
                        className="text-error-600 hover:text-error-700 font-medium px-3 py-1 rounded hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-950 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('finishes')}
                className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('images')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors shadow-theme-sm"
              >
                Siguiente: Imágenes →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Images */}
        {currentStep === 'images' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Imágenes del Perfil</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Agrega imágenes técnicas y de galería para el perfil LED
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Image */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Foto Técnica</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Imagen con especificaciones técnicas y medidas del perfil
                </p>
                
                {!techImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 transition-colors dark:border-gray-600 dark:hover:border-brand-400">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click para subir</span> o arrastra
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleTechImageChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={techImagePreview}
                      alt="Preview técnica"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeTechImage}
                      className="absolute top-2 right-2 bg-error-600 text-white p-2 rounded-full hover:bg-error-700 transition-colors shadow-theme-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Gallery Image */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Foto de Galería</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Imagen del perfil instalado o en uso
                </p>
                
                {!galleryImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 transition-colors dark:border-gray-600 dark:hover:border-brand-400">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click para subir</span> o arrastra
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleGalleryImageChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={galleryImagePreview}
                      alt="Preview galería"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeGalleryImage}
                      className="absolute top-2 right-2 bg-error-600 text-white p-2 rounded-full hover:bg-error-700 transition-colors shadow-theme-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PDF Documents Section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Documentos PDF (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datasheet PDF */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Cartilla Técnica</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Documento PDF con información técnica detallada
                  </p>
                  
                  {!datasheetPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 transition-colors dark:border-gray-600 dark:hover:border-brand-400">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-error-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,19H16.5V18H18.5V19M18.5,17H16.5V14H18.5V17M13,19H11V18H13V19M13,17H11V14H13V17M15,13H5V11H15V13M13,9V3.5L18.5,9H13Z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Subir PDF</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MAX. 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf"
                        onChange={handleDatasheetChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <svg className="w-8 h-8 text-error-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,19H16.5V18H18.5V19M18.5,17H16.5V14H18.5V17M13,19H11V18H13V19M13,17H11V14H13V17M15,13H5V11H15V13M13,9V3.5L18.5,9H13Z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{datasheetPreview}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF seleccionado</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeDatasheet}
                        className="bg-error-600 text-white p-2 rounded-full hover:bg-error-700 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Spec PDF */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Especificaciones</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Documento PDF con especificaciones adicionales
                  </p>
                  
                  {!specPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 transition-colors dark:border-gray-600 dark:hover:border-brand-400">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-error-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,19H16.5V18H18.5V19M18.5,17H16.5V14H18.5V17M13,19H11V18H13V19M13,17H11V14H13V17M15,13H5V11H15V13M13,9V3.5L18.5,9H13Z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Subir PDF</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MAX. 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf"
                        onChange={handleSpecChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <svg className="w-8 h-8 text-error-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,19H16.5V18H18.5V19M18.5,17H16.5V14H18.5V17M13,19H11V18H13V19M13,17H11V14H13V17M15,13H5V11H15V13M13,9V3.5L18.5,9H13Z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{specPreview}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF seleccionado</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeSpec}
                        className="bg-error-600 text-white p-2 rounded-full hover:bg-error-700 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep('parts')}
                className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('review')}
                className="rounded-md bg-brand-500 px-6 py-2 text-white hover:bg-brand-600 transition-colors shadow-theme-sm"
              >
                Siguiente: Revisar →
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Revisar y Confirmar</h2>
            
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-sm dark:bg-brand-950 dark:text-brand-400">Info Básica</span>
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Código:</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.code}</dd>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Nombre:</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.name}</dd>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Material:</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.material}</dd>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Potencia Máx:</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.max_w_per_m} W/m</dd>
                </dl>
                {formData.description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Descripción:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="bg-blue-light-100 text-blue-light-700 px-2 py-1 rounded text-sm dark:bg-blue-light-950 dark:text-blue-light-400">Difusores</span>
                  <span className="text-blue-light-600 dark:text-blue-light-400">({selectedDiffusers.length})</span>
                </h3>
                {selectedDiffusers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay difusores seleccionados</p>
                ) : (
                  selectedDiffusers.map((d, i) => (
                    <p key={i} className="text-sm mb-1 text-gray-900 dark:text-gray-100">
                      • <strong>{d.tone === 'opal' ? 'Opal' : d.tone === 'transparente' ? 'Transparente' : d.tone}</strong> - Material: {d.material}
                      {d.notes && ` (${d.notes})`}
                    </p>
                  ))
                )}
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-sm dark:bg-brand-950 dark:text-brand-400">Acabados</span>
                  <span className="text-brand-600 dark:text-brand-400">({selectedFinishIds.length})</span>
                </h3>
                {selectedFinishIds.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay acabados seleccionados</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedFinishIds.map(fId => {
                      const finish = finishes.find(f => f.id === fId)
                      return (
                        <span key={fId} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm dark:bg-gray-800 dark:border-gray-700">
                          {finish?.hex_color && (
                            <span className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: finish.hex_color }} />
                          )}
                          <span className="text-gray-900 dark:text-gray-100">{finish?.name}</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="bg-success-100 text-success-700 px-2 py-1 rounded text-sm dark:bg-success-950 dark:text-success-400">Partes Incluidas</span>
                  <span className="text-success-600 dark:text-success-400">({includedParts.length})</span>
                </h3>
                {includedParts.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay partes incluidas</p>
                ) : (
                  includedParts.map((part, i) => (
                    <p key={i} className="text-sm mb-1 text-gray-900 dark:text-gray-100">
                      • <strong>{part.name}</strong> - {part.qty_per_m}/m
                      {part.notes && ` • ${part.notes}`}
                    </p>
                  ))
                )}
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="bg-warning-100 text-warning-700 px-2 py-1 rounded text-sm dark:bg-warning-950 dark:text-warning-400">Partes Opcionales</span>
                  <span className="text-warning-600 dark:text-warning-400">({optionalParts.length})</span>
                </h3>
                {optionalParts.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay partes opcionales</p>
                ) : (
                  optionalParts.map((part, i) => (
                    <p key={i} className="text-sm mb-1 text-gray-900 dark:text-gray-100">
                      • <strong>{part.name}</strong> - {part.qty_per_m}/m
                      {part.notes && ` • ${part.notes}`}
                    </p>
                  ))
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm dark:bg-gray-800 dark:text-gray-300">Imágenes</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Foto Técnica:</p>
                    {techImagePreview ? (
                      <img src={techImagePreview} alt="Preview técnica" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No agregada</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Foto de Galería:</p>
                    {galleryImagePreview ? (
                      <img src={galleryImagePreview} alt="Preview galería" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
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
                className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="rounded-md bg-success-600 px-8 py-2 text-white hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors shadow-theme-sm"
              >
                {isSubmitting ? 'Creando Perfil LED...' : '✓ Crear Perfil LED Completo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
