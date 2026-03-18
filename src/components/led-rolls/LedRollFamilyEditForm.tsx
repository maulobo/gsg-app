'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  LedRollFamily,
  LedRoll,
  LedRollFamilyMedia,
  LedRollFamilyUpdate,
} from '@/types/database'

type LedRollFamilyEditFormProps = {
  family: LedRollFamily
  variants: LedRoll[]
  media: LedRollFamilyMedia[]
}

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
  price: number | null
}

const INITIAL_VARIANT: VariantFormData = {
  code: '',
  name: '',
  watts_per_meter: 10,
  lumens_per_meter: null,
  kelvin: 3000,
  tone_label: '3000K',
  voltage: 12,
  ip_rating: 20,
  leds_per_meter_variant: null,
  price: null,
}

export function LedRollFamilyEditForm({ family, variants, media }: LedRollFamilyEditFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'family' | 'variants' | 'images'>('family')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- Family form state ---
  const [familyData, setFamilyData] = useState({
    name: family.name,
    description: family.description || '',
    led_type: family.led_type || '',
    adhesive: family.adhesive || '',
    roll_length_m: family.roll_length_m || 5,
    dimmable: family.dimmable,
    leds_per_meter: family.leds_per_meter,
    cri: family.cri,
    pcb_width_mm: family.pcb_width_mm,
    warranty_years: family.warranty_years || 3,
    technical_note: family.technical_note || '',
    cut_note: family.cut_note || '',
    general_note: family.general_note || '',
  })

  // --- Variants state ---
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [newVariant, setNewVariant] = useState<VariantFormData>({ ...INITIAL_VARIANT })
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [editVariantData, setEditVariantData] = useState<VariantFormData | null>(null)
  const [savingVariant, setSavingVariant] = useState(false)

  // --- Image state ---
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const coverMedia = media.find(m => m.kind === 'cover')
  const techMedia = media.find(m => m.kind === 'tech')

  // ==========================================
  // FAMILY HANDLERS
  // ==========================================

  const handleSaveFamily = async () => {
    if (!familyData.name.trim()) {
      alert('El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/led-rolls/families/${family.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar')
      }

      alert('✅ Familia actualizada correctamente')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFamily = async () => {
    if (!confirm(`¿Eliminar la familia "${family.name}" y todas sus variantes?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/led-rolls/families/${family.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Error al eliminar')

      alert('✅ Familia eliminada')
      router.push('/led-rolls')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la familia')
      setIsDeleting(false)
    }
  }

  // ==========================================
  // VARIANT HANDLERS
  // ==========================================

  const handleAddVariant = async () => {
    if (!newVariant.code.trim()) {
      alert('El código (SKU) es requerido')
      return
    }

    setSavingVariant(true)
    try {
      const response = await fetch('/api/led-rolls/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVariant,
          family_id: family.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear variante')
      }

      alert('✅ Variante agregada')
      setNewVariant({ ...INITIAL_VARIANT })
      setShowAddVariant(false)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear variante')
    } finally {
      setSavingVariant(false)
    }
  }

  const startEditVariant = (variant: LedRoll) => {
    setEditingVariantId(variant.id)
    setEditVariantData({
      code: variant.code,
      name: variant.name || '',
      watts_per_meter: variant.watts_per_meter,
      lumens_per_meter: variant.lumens_per_meter,
      kelvin: variant.kelvin,
      tone_label: variant.tone_label || '',
      voltage: variant.voltage,
      ip_rating: variant.ip_rating,
      leds_per_meter_variant: variant.leds_per_meter_variant,
      price: variant.price,
    })
  }

  const handleSaveVariant = async () => {
    if (!editingVariantId || !editVariantData) return

    setSavingVariant(true)
    try {
      const response = await fetch(`/api/led-rolls/variants/${editingVariantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editVariantData),
      })

      if (!response.ok) throw new Error('Error al actualizar variante')

      alert('✅ Variante actualizada')
      setEditingVariantId(null)
      setEditVariantData(null)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar variante')
    } finally {
      setSavingVariant(false)
    }
  }

  const handleDeleteVariant = async (variantId: number, variantCode: string) => {
    if (!confirm(`¿Eliminar la variante ${variantCode}?`)) return

    try {
      const response = await fetch(`/api/led-rolls/variants/${variantId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Error al eliminar variante')

      alert('✅ Variante eliminada')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar variante')
    }
  }

  // ==========================================
  // IMAGE HANDLERS
  // ==========================================

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setCoverImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async (kind: string) => {
    if (!coverImage) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', coverImage)
      formData.append('kind', kind)
      formData.append('altText', `${familyData.name} - ${kind}`)

      const response = await fetch(`/api/led-rolls/families/${family.id}/images`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Error al subir imagen')

      alert('✅ Imagen subida')
      setCoverImage(null)
      setCoverImagePreview('')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
  const labelClass = 'block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300'

  const renderVariantForm = (data: VariantFormData, setData: (d: VariantFormData) => void) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Código (SKU) *</label>
          <input
            type="text"
            value={data.code}
            onChange={(e) => setData({ ...data, code: e.target.value.replace(/\s+/g, '-') })}
            className={inputClass}
            placeholder="LED-COB-10W-CAL"
          />
        </div>
        <div>
          <label className={labelClass}>Nombre</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className={inputClass}
            placeholder="COB 10W 3000K"
          />
        </div>
        <div>
          <label className={labelClass}>Potencia (W/m) *</label>
          <input
            type="number"
            step="0.1"
            value={data.watts_per_meter}
            onChange={(e) => setData({ ...data, watts_per_meter: parseFloat(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>Lúmenes/m</label>
          <input
            type="number"
            value={data.lumens_per_meter ?? ''}
            onChange={(e) => setData({ ...data, lumens_per_meter: parseInt(e.target.value) || null })}
            className={inputClass}
            placeholder="1000"
          />
        </div>
        <div>
          <label className={labelClass}>Kelvin</label>
          <input
            type="number"
            value={data.kelvin ?? ''}
            onChange={(e) => setData({ ...data, kelvin: parseInt(e.target.value) || null })}
            className={inputClass}
            placeholder="3000"
          />
        </div>
        <div>
          <label className={labelClass}>Tono *</label>
          <input
            type="text"
            value={data.tone_label}
            onChange={(e) => setData({ ...data, tone_label: e.target.value })}
            className={inputClass}
            placeholder="3000K, RGB"
          />
        </div>
        <div>
          <label className={labelClass}>Voltaje *</label>
          <select
            value={data.voltage}
            onChange={(e) => setData({ ...data, voltage: parseInt(e.target.value) })}
            className={inputClass}
          >
            <option value={12}>12V</option>
            <option value={24}>24V</option>
            <option value={110}>110V</option>
            <option value={220}>220V</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>IP Rating</label>
          <select
            value={data.ip_rating}
            onChange={(e) => setData({ ...data, ip_rating: parseInt(e.target.value) })}
            className={inputClass}
          >
            <option value={20}>IP20</option>
            <option value={65}>IP65</option>
            <option value={67}>IP67</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>LEDs/m</label>
          <input
            type="number"
            value={data.leds_per_meter_variant ?? ''}
            onChange={(e) => setData({ ...data, leds_per_meter_variant: parseInt(e.target.value) || null })}
            className={inputClass}
            placeholder="320"
          />
        </div>
        <div>
          <label className={labelClass}>Precio</label>
          <input
            type="number"
            step="0.01"
            value={data.price ?? ''}
            onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) || null })}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  )

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/led-rolls')}
            className="text-sm text-gray-500 hover:text-brand-600 mb-1 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Rollos LED
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {family.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {family.led_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {family.led_type}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {variants.length} variante{variants.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDeleteFamily}
          disabled={isDeleting}
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 dark:bg-red-950 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar Familia'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {[
            { key: 'family' as const, label: 'Información General' },
            { key: 'variants' as const, label: `Variantes (${variants.length})` },
            { key: 'images' as const, label: 'Imágenes' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ==========================================
          TAB: INFORMACIÓN GENERAL
          ========================================== */}
      {activeTab === 'family' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-dark dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                value={familyData.name}
                onChange={(e) => setFamilyData({ ...familyData, name: e.target.value })}
                className={inputClass}
                placeholder="COB 10 w/m"
              />
            </div>
            <div>
              <label className={labelClass}>Tipo LED</label>
              <input
                type="text"
                value={familyData.led_type}
                onChange={(e) => setFamilyData({ ...familyData, led_type: e.target.value })}
                className={inputClass}
                placeholder="COB, 2835, 5050"
              />
            </div>
            <div>
              <label className={labelClass}>Adhesivo</label>
              <input
                type="text"
                value={familyData.adhesive}
                onChange={(e) => setFamilyData({ ...familyData, adhesive: e.target.value })}
                className={inputClass}
                placeholder="3M Original"
              />
            </div>
            <div>
              <label className={labelClass}>Largo Rollo (m)</label>
              <input
                type="number"
                step="0.1"
                value={familyData.roll_length_m}
                onChange={(e) => setFamilyData({ ...familyData, roll_length_m: parseFloat(e.target.value) || 5 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>LEDs por metro</label>
              <input
                type="number"
                value={familyData.leds_per_meter ?? ''}
                onChange={(e) => setFamilyData({ ...familyData, leds_per_meter: parseInt(e.target.value) || null })}
                className={inputClass}
                placeholder="320 (opcional)"
              />
            </div>
            <div>
              <label className={labelClass}>CRI</label>
              <input
                type="number"
                value={familyData.cri ?? ''}
                onChange={(e) => setFamilyData({ ...familyData, cri: parseInt(e.target.value) || null })}
                className={inputClass}
                placeholder="80, 90"
              />
            </div>
            <div>
              <label className={labelClass}>Ancho PCB (mm)</label>
              <input
                type="number"
                step="0.1"
                value={familyData.pcb_width_mm ?? ''}
                onChange={(e) => setFamilyData({ ...familyData, pcb_width_mm: parseFloat(e.target.value) || null })}
                className={inputClass}
                placeholder="8, 10, 30"
              />
            </div>
            <div>
              <label className={labelClass}>Garantía (años)</label>
              <input
                type="number"
                value={familyData.warranty_years}
                onChange={(e) => setFamilyData({ ...familyData, warranty_years: parseInt(e.target.value) || 3 })}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyData.dimmable}
                  onChange={(e) => setFamilyData({ ...familyData, dimmable: e.target.checked })}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimerizable</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Descripción</label>
              <textarea
                value={familyData.description}
                onChange={(e) => setFamilyData({ ...familyData, description: e.target.value })}
                className={inputClass}
                rows={2}
                placeholder="Descripción del modelo..."
              />
            </div>
          </div>

          {/* Notas */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notas Técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Nota Técnica</label>
                <input
                  type="text"
                  value={familyData.technical_note}
                  onChange={(e) => setFamilyData({ ...familyData, technical_note: e.target.value })}
                  className={inputClass}
                  placeholder="Permite alimentar 25m sin caída"
                />
              </div>
              <div>
                <label className={labelClass}>Nota Corte</label>
                <input
                  type="text"
                  value={familyData.cut_note}
                  onChange={(e) => setFamilyData({ ...familyData, cut_note: e.target.value })}
                  className={inputClass}
                  placeholder="Permite corte cada 10 mm"
                />
              </div>
              <div>
                <label className={labelClass}>Nota General</label>
                <input
                  type="text"
                  value={familyData.general_note}
                  onChange={(e) => setFamilyData({ ...familyData, general_note: e.target.value })}
                  className={inputClass}
                  placeholder="Nota adicional"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveFamily}
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB: VARIANTES
          ========================================== */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          {/* Add Variant Button */}
          {!showAddVariant && (
            <button
              type="button"
              onClick={() => setShowAddVariant(true)}
              className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              <span className="text-lg mr-2">+</span> Agregar Nueva Variante
            </button>
          )}

          {/* Add Variant Form */}
          {showAddVariant && (
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-5 dark:bg-brand-950/20 dark:border-brand-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Nueva Variante
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowAddVariant(false); setNewVariant({ ...INITIAL_VARIANT }) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {renderVariantForm(newVariant, setNewVariant)}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddVariant(false); setNewVariant({ ...INITIAL_VARIANT }) }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={savingVariant}
                  className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {savingVariant ? 'Guardando...' : 'Agregar Variante'}
                </button>
              </div>
            </div>
          )}

          {/* Variants List */}
          {variants.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:bg-gray-dark dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                No hay variantes para esta familia. Agrega una para empezar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md dark:bg-gray-dark dark:border-gray-800"
                >
                  {editingVariantId === variant.id && editVariantData ? (
                    /* --- Editing mode --- */
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                          Editando: {variant.code}
                        </h4>
                      </div>

                      {renderVariantForm(editVariantData, setEditVariantData)}

                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => { setEditingVariantId(null); setEditVariantData(null) }}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveVariant}
                          disabled={savingVariant}
                          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                        >
                          {savingVariant ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* --- Display mode --- */
                    <div className="p-4 flex items-center justify-between group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                            {variant.code}
                          </p>
                          {variant.name && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {variant.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {variant.watts_per_meter}W/m
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {variant.tone_label || `${variant.kelvin}K`}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {variant.voltage}V
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            IP{variant.ip_rating}
                          </span>
                          {variant.lumens_per_meter && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {variant.lumens_per_meter} lm/m
                            </span>
                          )}
                          {variant.leds_per_meter_variant && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {variant.leds_per_meter_variant} LED/m
                            </span>
                          )}
                          {variant.price != null && variant.price > 0 && (
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              ${variant.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <button
                          type="button"
                          onClick={() => startEditVariant(variant)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors dark:hover:bg-brand-950"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id, variant.code)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-950"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB: IMÁGENES
          ========================================== */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cover Image */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-gray-dark dark:border-gray-800">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Foto de Portada
              </h3>
              {coverMedia ? (
                <div className="mb-3">
                  <img
                    src={coverMedia.path}
                    alt={familyData.name}
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">✅ Imagen actual</p>
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-center h-48 rounded-lg bg-gray-100 dark:bg-gray-900">
                  <p className="text-sm text-gray-400">Sin imagen de portada</p>
                </div>
              )}

              <div>
                <label className={labelClass}>Subir / Reemplazar</label>
                {!coverImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 transition-colors dark:border-gray-600">
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-gray-500">Click para seleccionar</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={coverImagePreview} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUploadImage('cover')}
                        disabled={uploadingImage}
                        className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                      >
                        {uploadingImage ? 'Subiendo...' : 'Subir como Portada'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCoverImage(null); setCoverImagePreview('') }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs hover:bg-gray-50 transition-colors dark:border-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tech Image */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-gray-dark dark:border-gray-800">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Foto Técnica
              </h3>
              {techMedia ? (
                <div className="mb-3">
                  <img
                    src={techMedia.path}
                    alt={`${familyData.name} - Técnica`}
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">✅ Imagen actual</p>
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-center h-48 rounded-lg bg-gray-100 dark:bg-gray-900">
                  <p className="text-sm text-gray-400">Sin imagen técnica</p>
                </div>
              )}

              {!coverImagePreview && (
                <div>
                  <label className={labelClass}>Subir / Reemplazar</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 transition-colors dark:border-gray-600">
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-gray-500">Click para seleccionar</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        handleImageChange(e)
                        // Will use handleUploadImage('tech') after preview
                      }}
                    />
                  </label>
                </div>
              )}

              {coverImagePreview && !coverMedia && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleUploadImage('tech')}
                    disabled={uploadingImage}
                    className="w-full rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {uploadingImage ? 'Subiendo...' : 'Subir como Técnica'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
