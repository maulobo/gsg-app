'use client'

import Link from 'next/link'
import type { DownloadPageFull } from '@/features/download-pages/types'
import { buildDownloadUrl } from '@/features/download-pages/qr'
import { QrThumb } from './QrPanel'

export default function DownloadPageList({ pages }: { pages: DownloadPageFull[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Descargables</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Páginas con PDFs para descargar escaneando el QR pegado en los equipos
          </p>
        </div>
        <Link
          href="/download-pages/new"
          className="whitespace-nowrap rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          + Nueva página de descargas
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3">QR</th>
              <th className="px-4 py-3">Página</th>
              <th className="px-4 py-3">PDFs</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Todavía no hay páginas. Creá la primera.
                </td>
              </tr>
            )}
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td className="px-4 py-3">
                  <div className="rounded bg-white p-1">
                    <QrThumb slug={p.slug} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{p.title}</p>
                  <p className="text-xs text-gray-500">{buildDownloadUrl(p.slug).replace(/^https?:\/\//, '')}</p>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {p.download_files.length} {p.download_files.length === 1 ? 'PDF' : 'PDFs'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.is_active
                        ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {p.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/download-pages/${p.slug}/edit`}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
