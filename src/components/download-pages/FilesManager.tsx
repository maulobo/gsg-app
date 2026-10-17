'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import type { DownloadFile } from '@/features/download-pages/types'
import { ArrowDown, ArrowUp, Eye, FileText, Trash2, Upload } from 'lucide-react'
import { Card, iconBtnCls } from './ui'

const MAX_PDF_BYTES = 10 * 1024 * 1024

const formatMb = (bytes: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

export default function FilesManager({
  slug,
  initialFiles,
  step,
}: {
  slug: string
  initialFiles: DownloadFile[]
  step?: number
}) {
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
    if (!window.confirm(`¿Eliminar "${file.title}"? Ya no se va a poder descargar desde el QR.`)) return
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
    <Card
      title="Subí los PDFs"
      step={step}
      hint="Es lo que el cliente va a ver y descargar al escanear el QR"
      aside={
        files.length > 0 ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {files.length} {files.length === 1 ? 'PDF' : 'PDFs'}
          </span>
        ) : null
      }
    >
      {files.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
          {files.map((f, i) => (
            <li key={f.id} className="group flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  defaultValue={f.title}
                  onBlur={(e) => saveTitle(f, e.currentTarget)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  aria-label="Nombre del PDF"
                  title="Hacé clic para cambiar el nombre"
                  className="w-full truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-gray-900 hover:border-gray-200 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:text-white dark:hover:border-gray-700 dark:focus:bg-gray-800"
                />
                <p className="px-2 text-xs text-gray-500">{formatMb(f.size_bytes)}</p>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className={iconBtnCls}
                  title="Subir"
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === files.length - 1}
                  className={iconBtnCls}
                  title="Bajar"
                  aria-label="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <a
                  href={f.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtnCls}
                  title="Ver PDF"
                  aria-label="Ver PDF"
                >
                  <Eye className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className={`${iconBtnCls} hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10`}
                  title="Eliminar"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploading.length > 0 && (
        <ul className="space-y-2">
          {uploading.map((name) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-25 px-3 py-2.5 text-sm text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <span className="truncate">Subiendo {name}</span>
            </li>
          ))}
        </ul>
      )}

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
          files.length === 0 ? 'px-6 py-12' : 'px-6 py-6'
        } ${
          isDragActive
            ? 'border-brand-500 bg-brand-25 dark:bg-brand-500/10'
            : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.02]'
        }`}
      >
        <input {...getInputProps()} />
        <span
          className={`flex items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 ${
            files.length === 0 ? 'h-12 w-12' : 'h-9 w-9'
          }`}
        >
          <Upload className={files.length === 0 ? 'h-6 w-6' : 'h-4 w-4'} />
        </span>
        <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200">
          {isDragActive ? 'Soltá los PDFs para subirlos' : files.length === 0 ? 'Arrastrá los PDFs acá' : 'Agregar más PDFs'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          o hacé clic para elegirlos. Solo PDF, hasta 10MB cada uno.
        </p>
      </div>
    </Card>
  )
}
