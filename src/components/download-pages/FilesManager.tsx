'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import type { DownloadFile } from '@/features/download-pages/types'
import { Card, inputCls } from './ui'

const MAX_PDF_BYTES = 10 * 1024 * 1024

const formatMb = (bytes: number | null) => (bytes ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : '')

export default function FilesManager({ slug, initialFiles }: { slug: string; initialFiles: DownloadFile[] }) {
  const [files, setFiles] = useState<DownloadFile[]>(initialFiles)
  const [uploading, setUploading] = useState<string[]>([])

  const uploadOne = async (file: File) => {
    setUploading((u) => [...u, file.name])
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('slug', slug)
      const res = await fetch('/api/download-pages/files/upload', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al subir')
      setFiles((fs) => [...fs, data.file])
    } catch (e: any) {
      toast.error(`${file.name}: ${e.message}`)
    } finally {
      setUploading((u) => u.filter((n) => n !== file.name))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxSize: MAX_PDF_BYTES,
    onDrop: (accepted, rejected) => {
      for (const r of rejected) {
        const tooBig = r.errors.some((e) => e.code === 'file-too-large')
        toast.error(`${r.file.name}: ${tooBig ? 'El PDF no debe superar 10MB' : 'Solo se aceptan archivos PDF'}`)
      }
      for (const f of accepted) uploadOne(f)
    },
  })

  const patch = async (id: number, body: Partial<Pick<DownloadFile, 'title' | 'display_order'>>) => {
    const res = await fetch(`/api/download-pages/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Error al guardar')
    return data as DownloadFile
  }

  const saveTitle = async (file: DownloadFile, input: HTMLInputElement) => {
    const t = input.value.trim()
    if (t === file.title) return
    if (!t) {
      toast.error('El título no puede quedar vacío')
      input.value = file.title
      return
    }
    try {
      const updated = await patch(file.id, { title: t })
      setFiles((fs) => fs.map((f) => (f.id === file.id ? updated : f)))
      toast.success('Título guardado')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= files.length) return
    const reordered = [...files]
    ;[reordered[index], reordered[j]] = [reordered[j], reordered[index]]
    setFiles(reordered)
    try {
      // Reescribe el orden completo: evita empates de display_order
      await Promise.all(reordered.map((f, i) => (f.display_order === i ? null : patch(f.id, { display_order: i }))))
      setFiles(reordered.map((f, i) => ({ ...f, display_order: i })))
    } catch (e: any) {
      toast.error(e.message)
      setFiles(files)
    }
  }

  const remove = async (file: DownloadFile) => {
    if (!window.confirm(`¿Eliminar "${file.title}"?`)) return
    try {
      const res = await fetch(`/api/download-pages/files/${file.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
      setFiles((fs) => fs.filter((f) => f.id !== file.id))
      toast.success('PDF eliminado')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <Card title="PDFs para descargar">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          isDragActive
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
            : 'border-gray-300 hover:border-brand-400 dark:border-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Arrastrá los PDFs acá o hacé clic para elegirlos
        </p>
        <p className="mt-1 text-xs text-gray-500">Solo PDF, hasta 10MB cada uno</p>
      </div>

      {uploading.map((name) => (
        <div key={name} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Subiendo {name}...
        </div>
      ))}

      {files.length === 0 && uploading.length === 0 && (
        <p className="text-center text-sm text-gray-500">Todavía no subiste PDFs</p>
      )}

      <ul className="space-y-2">
        {files.map((f, i) => (
          <li
            key={f.id}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center dark:border-gray-700"
          >
            <span className="shrink-0 rounded bg-error-50 px-2 py-1 text-xs font-bold text-error-600 dark:bg-error-500/10">
              PDF
            </span>
            <input
              key={`${f.id}-${f.title}`}
              type="text"
              defaultValue={f.title}
              onBlur={(e) => saveTitle(f, e.currentTarget)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              aria-label="Título del PDF"
              className={`${inputCls} py-1.5`}
            />
            <span className="shrink-0 text-xs text-gray-500">{formatMb(f.size_bytes)}</span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                title="Subir"
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === files.length - 1}
                title="Bajar"
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5"
              >
                ↓
              </button>
              <a
                href={f.path}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded px-2 py-1 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                Ver
              </a>
              <button
                type="button"
                onClick={() => remove(f)}
                className="rounded px-2 py-1 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
