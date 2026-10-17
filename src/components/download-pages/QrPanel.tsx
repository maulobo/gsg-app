'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import {
  QR_OPTIONS,
  PRESETS_CM,
  PRINT_DPI,
  buildDownloadUrl,
  parseCm,
  cmToPx,
  qrInfo,
  setPngDpi,
  svgWithSize,
  qrFileName,
} from '@/features/download-pages/qr'
import { Card, inputCls, btnPrimaryCls, btnSecondaryCls } from './ui'

// Debajo de esto el celular puede tardar o no leerlo
const MIN_MODULE_MM = 0.5

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** QR chico para listados */
export function QrThumb({ slug, size = 48 }: { slug: string; size?: number }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    QRCode.toString(buildDownloadUrl(slug), { ...QR_OPTIONS, type: 'svg' }).then(setSvg)
  }, [slug])
  return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
}

export default function QrPanel({ slug }: { slug: string }) {
  const url = buildDownloadUrl(slug)
  const [svg, setSvg] = useState('')
  const [sizeInput, setSizeInput] = useState('2')
  const cm = parseCm(sizeInput)
  const info = useMemo(() => qrInfo(url, cm ?? 2), [url, cm])

  useEffect(() => {
    QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' }).then(setSvg)
  }, [url])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado')
    } catch {
      toast.error('No se pudo copiar el link')
    }
  }

  const downloadPng = async () => {
    if (!cm) return
    try {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, url, { ...QR_OPTIONS, width: cmToPx(cm) })
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('No se pudo generar el PNG')
      const bytes = setPngDpi(new Uint8Array(await blob.arrayBuffer()), PRINT_DPI)
      downloadBlob(new Blob([bytes as BlobPart], { type: 'image/png' }), qrFileName(slug, cm, 'png'))
    } catch (e: any) {
      toast.error(e.message || 'Error al generar el QR')
    }
  }

  const downloadSvg = () => {
    if (!cm) return
    downloadBlob(new Blob([svgWithSize(svg, cm)], { type: 'image/svg+xml' }), qrFileName(slug, cm, 'svg'))
  }

  return (
    <Card title="Código QR">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-60 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="break-all text-center text-sm text-gray-600 dark:text-gray-400">{url}</p>
        <div className="flex gap-2">
          <button type="button" onClick={copyLink} className={btnSecondaryCls}>
            Copiar link
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={btnSecondaryCls}>
            Abrir página
          </a>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
        <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">Tamaño de impresión</p>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS_CM.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSizeInput(String(p))}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                cm === p
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
              }`}
            >
              {p}×{p} cm
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              aria-label="Tamaño en centímetros"
              className={`${inputCls} w-20 ${cm ? '' : 'border-error-500 focus:border-error-500'}`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">cm</span>
          </div>
        </div>
        {!cm && <p className="mt-1 text-xs text-error-600">Entre 1,5 y 20 cm</p>}
        <p className="mt-2 text-xs text-gray-500">
          Recomendado mínimo 2 cm · Versión {info.version} · cada cuadradito mide {info.moduleMm.toFixed(2)} mm
        </p>
        {cm && info.moduleMm < MIN_MODULE_MM && (
          <p className="mt-2 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            Muy chico: puede costar escanearlo. Probá un tamaño mayor o una dirección más corta.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={downloadPng} disabled={!cm} className={btnPrimaryCls}>
            Descargar PNG
          </button>
          <button type="button" onClick={downloadSvg} disabled={!cm || !svg} className={btnSecondaryCls}>
            Descargar SVG
          </button>
        </div>
      </div>
    </Card>
  )
}
