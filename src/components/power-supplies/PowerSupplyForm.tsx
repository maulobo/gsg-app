'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PowerSupplyFull, PowerSupplyMedia } from '@/features/power-supplies/types'
import { POWER_SUPPLY_SERIES } from '@/features/power-supplies/types'

interface Props {
  powerSupply?: PowerSupplyFull
}

type ModelRow = {
  code: string
  input_v_min: string
  input_v_max: string
  output_v: string
  current_a: string
}

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? '' : String(v))

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500'
const labelCls = 'mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300'
const fileCls =
  'w-full text-theme-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-theme-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-white dark:file:bg-brand-500/10 dark:file:text-brand-400'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </div>
  )
}

export default function PowerSupplyForm({ powerSupply }: Props) {
  const router = useRouter()
  const isEdit = !!powerSupply
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    code: powerSupply?.code ?? '',
    name: powerSupply?.name ?? '',
    series: powerSupply?.series ?? '',
    description: powerSupply?.description ?? '',
    power_w: str(powerSupply?.power_w),
    ip_rating: powerSupply?.ip_rating ?? 'IP20',
    length_mm: str(powerSupply?.length_mm),
    width_mm: str(powerSupply?.width_mm),
    height_mm: str(powerSupply?.height_mm),
    warranty_years: str(powerSupply?.warranty_years ?? 3),
    connection: powerSupply?.connection ?? '',
    dimmable: powerSupply?.dimmable ?? false,
    dimming_notes: powerSupply?.dimming_notes ?? '',
    notes: powerSupply?.notes ?? 'Para un rendimiento óptimo y mayor durabilidad, trabajar hasta el 80% de la potencia nominal.',
    display_order: str(powerSupply?.display_order ?? 0),
    is_active: powerSupply?.is_active ?? true,
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const [models, setModels] = useState<ModelRow[]>(
    powerSupply?.power_supply_models.length
      ? powerSupply.power_supply_models.map((m) => ({
          code: m.code,
          input_v_min: str(m.input_v_min),
          input_v_max: str(m.input_v_max),
          output_v: str(m.output_v),
          current_a: str(m.current_a),
        }))
      : [
          { code: '', input_v_min: '100', input_v_max: '264', output_v: '12', current_a: '' },
          { code: '', input_v_min: '100', input_v_max: '264', output_v: '24', current_a: '' },
        ]
  )
  const updateModel = (i: number, patch: Partial<ModelRow>) =>
    setModels((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  // Imágenes
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(powerSupply?.photo_url ?? null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [techFiles, setTechFiles] = useState<File[]>([])
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null)
  const [existingMedia, setExistingMedia] = useState<PowerSupplyMedia[]>(powerSupply?.power_supply_media ?? [])
  const [mediaToDelete, setMediaToDelete] = useState<number[]>([])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setCoverPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeExistingMedia = (id: number) => {
    setMediaToDelete((ids) => [...ids, id])
    setExistingMedia((m) => m.filter((x) => x.id !== id))
  }

  const upload = async (code: string, file: File, kind: string, altText: string) => {
    const fd = new FormData()
    fd.append('image', file)
    fd.append('powerSupplyCode', code)
    fd.append('kind', kind)
    fd.append('altText', altText)
    const res = await fetch('/api/power-supplies/images/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Error al subir ${file.name}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) {
      alert('Código y nombre son requeridos')
      return
    }
    const validModels = models.filter((m) => m.code.trim() && m.output_v.trim())
    if (validModels.length === 0) {
      alert('Agregá al menos un modelo con código y voltaje de salida')
      return
    }

    setIsSaving(true)
    try {
      const { code, ...rest } = form
      const payload = {
        power_supply: { ...rest, code: code.trim() },
        models: validModels,
      }

      const res = await fetch(isEdit ? `/api/power-supplies/${powerSupply!.code}` : '/api/power-supplies', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar la fuente')
      }

      const finalCode = isEdit ? powerSupply!.code : code.trim()

      for (const id of mediaToDelete) {
        await fetch(`/api/power-supplies/images/upload?mediaId=${id}`, { method: 'DELETE' })
      }
      if (datasheetFile) {
        // Una sola ficha técnica: reemplaza la anterior
        for (const m of existingMedia.filter((m) => m.kind === 'datasheet')) {
          await fetch(`/api/power-supplies/images/upload?mediaId=${m.id}`, { method: 'DELETE' })
        }
      }

      const errors: string[] = []
      const tryUpload = async (file: File, kind: string, alt: string) => {
        try {
          await upload(finalCode, file, kind, alt)
        } catch (err: any) {
          errors.push(err.message)
        }
      }
      if (coverFile) await tryUpload(coverFile, 'cover', form.name)
      for (const f of galleryFiles) await tryUpload(f, 'gallery', form.name)
      for (const f of techFiles) await tryUpload(f, 'tech', `${form.name} - Detalle técnico`)
      if (datasheetFile) await tryUpload(datasheetFile, 'datasheet', `${form.name} - Ficha técnica`)

      if (errors.length > 0) {
        alert(`La fuente se guardó, pero hubo errores con archivos:\n${errors.join('\n')}`)
      }

      router.push('/power-supplies')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Error al guardar la fuente')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Información básica">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>
              Código de la familia <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              disabled={isEdit}
              placeholder="ej: GSG-36WHH"
              className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-gray-800`}
            />
            {isEdit && <p className="mt-1 text-xs text-gray-500">El código no se puede modificar</p>}
          </div>
          <div>
            <label className={labelCls}>
              Nombre <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="ej: Fuente Ultra Slim 36W"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Línea / Serie</label>
            <select value={form.series} onChange={(e) => set({ series: e.target.value })} className={inputCls}>
              <option value="">Sin serie</option>
              {POWER_SUPPLY_SERIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {form.series && !(POWER_SUPPLY_SERIES as readonly string[]).includes(form.series) && (
                <option value={form.series}>{form.series}</option>
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Orden</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => set({ display_order: e.target.value })}
                className={inputCls}
              />
            </div>
            <label className="mt-8 flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
              Visible en la web
            </label>
          </div>
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            placeholder="ej: Formato compacto para instalaciones con espacio reducido"
            className={inputCls}
          />
        </div>
      </Card>

      <Card title="Datos técnicos">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className={labelCls}>Potencia (W)</label>
            <input type="number" step="any" value={form.power_w} onChange={(e) => set({ power_w: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Grado IP</label>
            <input type="text" value={form.ip_rating} onChange={(e) => set({ ip_rating: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Garantía (años)</label>
            <input
              type="number"
              value={form.warranty_years}
              onChange={(e) => set({ warranty_years: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Conexión</label>
            <input
              type="text"
              value={form.connection}
              onChange={(e) => set({ connection: e.target.value })}
              placeholder="ej: Bornera PUSH"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Medidas (mm)</label>
          <div className="grid grid-cols-3 gap-4">
            <input type="number" step="any" placeholder="Largo" value={form.length_mm} onChange={(e) => set({ length_mm: e.target.value })} className={inputCls} />
            <input type="number" step="any" placeholder="Ancho" value={form.width_mm} onChange={(e) => set({ width_mm: e.target.value })} className={inputCls} />
            <input type="number" step="any" placeholder="Alto" value={form.height_mm} onChange={(e) => set({ height_mm: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.dimmable} onChange={(e) => set({ dimmable: e.target.checked })} />
            Regulable por interruptores DIP
          </label>
          {form.dimmable && (
            <input
              type="text"
              value={form.dimming_notes}
              onChange={(e) => set({ dimming_notes: e.target.value })}
              placeholder="ej: Cuatro niveles de luminosidad: 25%, 50%, 75% y 100%"
              className={inputCls}
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Nota</label>
          <input type="text" value={form.notes} onChange={(e) => set({ notes: e.target.value })} className={inputCls} />
        </div>
      </Card>

      <Card title="Modelos (por voltaje de salida)">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 text-xs font-medium uppercase text-gray-500 md:grid">
          <span>Código</span>
          <span>Entrada mín (VAC)</span>
          <span>Entrada máx (VAC)</span>
          <span>Salida (V CC)</span>
          <span>Corriente (A)</span>
          <span />
        </div>
        {models.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <input
              type="text"
              placeholder="ej: GSG-36WHH-12"
              value={m.code}
              onChange={(e) => updateModel(i, { code: e.target.value.toUpperCase() })}
              className={`${inputCls} col-span-2 md:col-span-1`}
            />
            <input type="number" placeholder="Entrada mín" value={m.input_v_min} onChange={(e) => updateModel(i, { input_v_min: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Entrada máx" value={m.input_v_max} onChange={(e) => updateModel(i, { input_v_max: e.target.value })} className={inputCls} />
            <input type="number" step="any" placeholder="Salida V" value={m.output_v} onChange={(e) => updateModel(i, { output_v: e.target.value })} className={inputCls} />
            <input type="number" step="any" placeholder="Corriente A" value={m.current_a} onChange={(e) => updateModel(i, { current_a: e.target.value })} className={inputCls} />
            <button
              type="button"
              onClick={() => setModels((rows) => rows.filter((_, idx) => idx !== i))}
              className="rounded-lg px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const last = models[models.length - 1]
            setModels((rows) => [
              ...rows,
              { code: '', input_v_min: last?.input_v_min ?? '', input_v_max: last?.input_v_max ?? '', output_v: '', current_a: '' },
            ])
          }}
          className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          + Agregar modelo
        </button>
      </Card>

      <Card title="Imágenes y documentación">
        <div>
          <label className={labelCls}>Imagen principal</label>
          <input type="file" accept="image/*" onChange={handleCoverChange} className={fileCls} />
          {coverPreview && (
            <div className="mt-3 h-48 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700">
              <img src={coverPreview} alt="Preview" className="h-full w-full object-contain" />
            </div>
          )}
        </div>

        {existingMedia.length > 0 && (
          <div>
            <label className={labelCls}>Archivos actuales</label>
            <div className="flex flex-wrap gap-3">
              {existingMedia.map((m) => (
                <div key={m.id} className="relative w-36 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                  {m.kind === 'datasheet' ? (
                    <a href={m.path} target="_blank" rel="noreferrer" className="flex h-24 items-center justify-center text-sm text-brand-600">
                      Ficha PDF
                    </a>
                  ) : (
                    <img src={m.path} alt={m.alt_text ?? ''} className="h-24 w-full object-contain" />
                  )}
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{m.kind}</span>
                    <button type="button" onClick={() => removeExistingMedia(m.id)} className="text-error-600">
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelCls}>Galería (adicionales)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} className={fileCls} />
          </div>
          <div>
            <label className={labelCls}>Imagen técnica (ej. DIP)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setTechFiles(Array.from(e.target.files ?? []))} className={fileCls} />
          </div>
          <div>
            <label className={labelCls}>Ficha técnica (PDF)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setDatasheetFile(e.target.files?.[0] ?? null)} className={fileCls} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/power-supplies')}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear fuente'}
        </button>
      </div>
    </form>
  )
}
