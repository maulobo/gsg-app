'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Download, ExternalLink, FileText, Pencil, Plus, QrCode } from 'lucide-react'
import type { DownloadPageFull } from '@/features/download-pages/types'
import { buildDownloadUrl } from '@/features/download-pages/qr'
import { QrThumb, downloadQrPng } from './QrPanel'
import { StatusPill, btnPrimaryCls, btnSecondaryCls, iconBtnCls } from './ui'

const QUICK_CM = 2

export default function DownloadPageList({ pages }: { pages: DownloadPageFull[] }) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const quickDownload = async (slug: string) => {
    setDownloading(slug)
    try {
      await downloadQrPng(slug, QUICK_CM)
    } catch (e: any) {
      toast.error(e.message || 'No se pudo generar el QR')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Descargables</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            Cada página tiene su QR para pegar en los equipos. Al escanearlo, el cliente baja los PDFs que subas acá.
          </p>
        </div>
        <Link href="/download-pages/new" className={`${btnPrimaryCls} whitespace-nowrap`}>
          <Plus className="h-4 w-4" />
          Nueva página
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
          <QrCode className="h-10 w-10 text-gray-400" />
          <p className="mt-4 font-medium text-gray-900 dark:text-white">Todavía no hay páginas</p>
          <p className="mt-1 text-sm text-gray-500">Creá la primera para generar su QR.</p>
          <Link href="/download-pages/new" className={`${btnPrimaryCls} mt-6`}>
            <Plus className="h-4 w-4" />
            Nueva página
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {pages.map((p) => {
            const url = buildDownloadUrl(p.slug)
            const count = p.download_files.length
            return (
              <li
                key={p.id}
                className="flex gap-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <Link
                  href={`/download-pages/${p.slug}/edit`}
                  className={`shrink-0 self-start rounded-xl bg-white p-2 ring-1 ring-gray-200 dark:ring-gray-700 ${
                    p.is_active ? '' : 'opacity-40'
                  }`}
                  aria-label={`Editar ${p.title}`}
                >
                  <QrThumb slug={p.slug} size={96} />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/download-pages/${p.slug}/edit`}
                      className="min-w-0 truncate text-base font-semibold text-gray-900 hover:text-brand-600 dark:text-white"
                    >
                      {p.title}
                    </Link>
                    <StatusPill active={p.is_active} />
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex min-w-0 items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
                  >
                    <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                  <p
                    className={`mt-2 inline-flex items-center gap-1.5 text-sm ${
                      count === 0 ? 'text-warning-600' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    {count === 0 ? 'Sin PDFs todavía' : `${count} ${count === 1 ? 'PDF' : 'PDFs'}`}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <Link href={`/download-pages/${p.slug}/edit`} className={`${btnSecondaryCls} px-3 py-2`}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => quickDownload(p.slug)}
                      disabled={downloading === p.slug}
                      className={`${iconBtnCls} h-9 w-auto gap-1.5 px-2.5 text-sm font-medium`}
                      title={`Descargar QR ${QUICK_CM}×${QUICK_CM} cm`}
                    >
                      <Download className="h-4 w-4" />
                      QR {QUICK_CM}×{QUICK_CM}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
