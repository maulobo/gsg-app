'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { DownloadPageFull } from '@/features/download-pages/types'
import { suggestSlug, isValidSlug, SLUG_RECOMMENDED_MAX } from '@/features/download-pages/slug'
import { WEB_BASE_URL } from '@/features/download-pages/qr'
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
      <Card title="Datos de la página">
        <div>
          <label className={labelCls}>
            Título <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="ej: Fuentes LED"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Dirección {isEdit && '🔒'}</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <span className="whitespace-nowrap bg-gray-50 px-3 py-2.5 text-theme-sm text-gray-500 dark:bg-gray-800">
              {host}/descargas/
            </span>
            <input
              type="text"
              value={form.slug}
              disabled={isEdit}
              onChange={(e) => {
                setSlugTouched(true)
                set({ slug: e.target.value.toLowerCase() })
              }}
              placeholder="fuentes"
              className="w-full border-0 bg-white px-2 py-2.5 text-theme-sm text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {isEdit && (
            <p className="mt-1 text-xs text-gray-500">
              Esta dirección está fija para que los QR impresos sigan funcionando.
            </p>
          )}
          {slugError && <p className="mt-1 text-xs text-error-600">Solo minúsculas, números y guiones</p>}
          {!slugError && slugLong && (
            <p className="mt-1 text-xs text-warning-600">Mejor corto: el QR sale más chico y fácil de escanear</p>
          )}
          {!isEdit && !slugError && !slugLong && (
            <p className="mt-1 text-xs text-gray-500">Una vez creada, la dirección no se puede cambiar.</p>
          )}
        </div>

        <div>
          <label className={labelCls}>Descripción (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            placeholder="Texto corto que aparece arriba de los PDFs"
            className={inputCls}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set({ is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Activa (visible en la web)
          </label>
          {!form.is_active && (
            <p className="mt-1 text-xs text-warning-600">
              Los QR impresos mostrarán un aviso de página no disponible.
            </p>
          )}
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {dataCard}
        <FilesManager slug={page!.slug} initialFiles={page!.download_files} />
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <QrPanel slug={page!.slug} />
      </div>
    </div>
  )
}
