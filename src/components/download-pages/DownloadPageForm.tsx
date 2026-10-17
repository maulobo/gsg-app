'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { DownloadPageFull } from '@/features/download-pages/types'
import { suggestSlug, isValidSlug, SLUG_RECOMMENDED_MAX } from '@/features/download-pages/slug'
import { WEB_BASE_URL } from '@/features/download-pages/qr'
import { Lock } from 'lucide-react'
import { Card, inputCls, labelCls, btnPrimaryCls } from './ui'
import FilesManager from './FilesManager'
import QrPanel from './QrPanel'

const host = WEB_BASE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '')

export default function DownloadPageForm({ page }: { page?: DownloadPageFull }) {
  const router = useRouter()
  const isEdit = !!page
  const [isSaving, setIsSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [form, setForm] = useState({
    title: page?.title ?? '',
    slug: page?.slug ?? '',
    description: page?.description ?? '',
    is_active: page?.is_active ?? true,
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const slugError = !isEdit && form.slug !== '' && !isValidSlug(form.slug)
  const slugLong = !isEdit && form.slug.length > SLUG_RECOMMENDED_MAX

  const onTitleChange = (title: string) => {
    set(!isEdit && !slugTouched ? { title, slug: suggestSlug(title) } : { title })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Falta el título')
    if (!isEdit && !isValidSlug(form.slug)) return toast.error('Revisá la dirección')

    setIsSaving(true)
    try {
      const res = await fetch(isEdit ? `/api/download-pages/${page!.slug}` : '/api/download-pages', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { title: form.title, description: form.description, is_active: form.is_active }
            : { slug: form.slug, title: form.title, description: form.description, is_active: form.is_active }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      if (isEdit) {
        toast.success('Cambios guardados')
        router.refresh()
      } else {
        toast.success('Página creada. Ahora subí los PDFs')
        router.push(`/download-pages/${data.slug}/edit`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const dataCard = (
    <form onSubmit={handleSubmit}>
      <Card
        title={isEdit ? 'Datos de la página' : 'Nombre y dirección'}
        step={1}
        hint={isEdit ? undefined : 'Después vas a poder subir los PDFs y descargar el QR'}
      >
        <div>
          <label htmlFor="dp-title" className={labelCls}>
            Título <span className="text-error-500">*</span>
          </label>
          <input
            id="dp-title"
            type="text"
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="ej: Fuentes LED"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-500">Es lo que ve el cliente arriba de la lista de PDFs.</p>
        </div>

        <div>
          <label htmlFor="dp-slug" className={labelCls}>
            Dirección del QR
          </label>
          <div
            className={`flex items-center overflow-hidden rounded-lg border shadow-theme-xs ${
              slugError
                ? 'border-error-500'
                : 'border-gray-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-gray-700'
            } ${isEdit ? 'bg-gray-50 dark:bg-gray-800/60' : 'bg-white dark:bg-gray-800'}`}
          >
            <span className="whitespace-nowrap border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-theme-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
              {host}/descargas/
            </span>
            <input
              id="dp-slug"
              type="text"
              value={form.slug}
              readOnly={isEdit}
              onChange={(e) => {
                setSlugTouched(true)
                set({ slug: e.target.value.toLowerCase() })
              }}
              placeholder="fuentes"
              className={`w-full min-w-0 border-0 bg-transparent px-3 py-2.5 text-theme-sm font-medium focus:outline-none ${
                isEdit ? 'cursor-default text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
              }`}
            />
            {isEdit && <Lock className="mr-3 h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
          </div>
          {isEdit ? (
            <p className="mt-1 text-xs text-gray-500">
              Está fija para que los QR que ya imprimiste sigan funcionando.
            </p>
          ) : slugError ? (
            <p className="mt-1 text-xs text-error-600">Solo minúsculas, números y guiones.</p>
          ) : slugLong ? (
            <p className="mt-1 text-xs text-warning-600">Mejor corta: el QR sale más simple y se lee mejor en tamaño chico.</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Una vez creada no se puede cambiar, porque va impresa en el QR.</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-desc" className={labelCls}>
            Descripción <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="dp-desc"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
            placeholder="ej: Fichas técnicas y manuales de instalación"
            className={inputCls}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-gray-200">Visible en la web</p>
            <p className="text-xs text-gray-500">
              {form.is_active
                ? 'Al escanear el QR se ven los PDFs.'
                : 'Al escanear el QR se ve un aviso de página no disponible.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_active}
            aria-label="Visible en la web"
            onClick={() => set({ is_active: !form.is_active })}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
              form.is_active ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.is_active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving || slugError} className={btnPrimaryCls}>
            {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear página'}
          </button>
        </div>
      </Card>
    </form>
  )

  if (!isEdit) return <div className="max-w-2xl">{dataCard}</div>

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-6">
        {dataCard}
        <FilesManager slug={page!.slug} initialFiles={page!.download_files} step={2} />
      </div>
      <div className="xl:sticky xl:top-24 xl:self-start">
        <QrPanel slug={page!.slug} step={3} />
      </div>
    </div>
  )
}
