'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { Copy, Download, ExternalLink, ScanLine, TriangleAlert, CircleCheck } from 'lucide-react'
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
import { Card, inputCls, btnPrimaryCls, btnSecondaryCls, iconBtnCls } from './ui'

// Tamaño de cada cuadradito impreso: por debajo de esto el celular puede tardar o no leerlo
const MODULE_MM_GOOD = 0.6
const MODULE_MM_MIN = 0.5

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

/** PNG a 600 dpi con el tamaño físico grabado en el archivo */
export async function downloadQrPng(slug: string, cm: number) {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, buildDownloadUrl(slug), { ...QR_OPTIONS, width: cmToPx(cm) })
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo generar el PNG')
  const bytes = setPngDpi(new Uint8Array(await blob.arrayBuffer()), PRINT_DPI)
  downloadBlob(new Blob([bytes as BlobPart], { type: 'image/png' }), qrFileName(slug, cm, 'png'))
}

function useQrSvg(url: string) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' }).then((s) => alive && setSvg(s))
    return () => {
      alive = false
    }
  }, [url])
  return svg
}

/** QR chico para listados */
export function QrThumb({ slug, size = 96 }: { slug: string; size?: number }) {
  const svg = useQrSvg(buildDownloadUrl(slug))
  return <div aria-hidden className="[&>svg]:block [&>svg]:h-full [&>svg]:w-full" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
}

function Legibility({ moduleMm }: { moduleMm: number }) {
  const mm = moduleMm.toFixed(2).replace('.', ',')
  if (moduleMm >= MODULE_MM_GOOD) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Se lee muy bien con cualquier celular. Cada cuadradito mide {mm} mm.
        </span>
      </div>
    )
  }
  if (moduleMm >= MODULE_MM_MIN) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Se lee bien acercando el celular. Cada cuadradito mide {mm} mm.</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2.5 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Muy chico: cada cuadradito mide {mm} mm y puede costar escanearlo. Probá un tamaño mayor.
      </span>
    </div>
  )
}

export default function QrPanel({ slug, step }: { slug: string; step?: number }) {
  const url = buildDownloadUrl(slug)
  const svg = useQrSvg(url)
  const [sizeInput, setSizeInput] = useState('2')
  const [downloading, setDownloading] = useState(false)
  const cm = parseCm(sizeInput)
  const info = useMemo(() => qrInfo(url, cm ?? 2), [url, cm])
  const isPreset = cm !== null && PRESETS_CM.includes(cm)

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
    setDownloading(true)
    try {
      await downloadQrPng(slug, cm)
    } catch (e: any) {
      toast.error(e.message || 'No se pudo generar el QR')
    } finally {
      setDownloading(false)
    }
  }

  const downloadSvg = () => {
    if (!cm || !svg) return
    downloadBlob(new Blob([svgWithSize(svg, cm)], { type: 'image/svg+xml' }), qrFileName(slug, cm, 'svg'))
  }

  return (
    <Card title="Imprimí el QR" step={step} hint="Elegí la medida del sticker y descargalo">
      {/* QR grande para probarlo con el celular */}
      <div className="flex flex-col items-center">
        <div
          className="w-56 rounded-xl bg-white p-3 shadow-theme-xs ring-1 ring-gray-200 dark:ring-gray-700 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <ScanLine className="h-3.5 w-3.5" />
          Escanealo con tu celular para probarlo
        </p>
        <div className="mt-3 flex w-full items-center gap-1 rounded-lg bg-gray-50 py-1 pl-3 pr-1 dark:bg-white/5">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300" title={url}>
            {url.replace(/^https?:\/\//, '')}
          </span>
          <button type="button" onClick={copyLink} className={iconBtnCls} title="Copiar link" aria-label="Copiar link">
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={iconBtnCls}
            title="Abrir la página"
            aria-label="Abrir la página"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Medida */}
      <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
        <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">Medida del sticker</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS_CM.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSizeInput(String(p))}
              aria-pressed={cm === p}
              className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                cm === p
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
              }`}
            >
              {p}×{p}
            </button>
          ))}
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={isPreset ? '' : sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="Otra"
              aria-label="Otra medida en centímetros"
              className={`${inputCls} h-full px-2 py-2 pr-7 text-center ${
                !isPreset && sizeInput !== '' ? 'border-brand-500' : ''
              } ${cm === null ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' : ''}`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
          </div>
        </div>
        {cm === null ? (
          <p className="mt-2 text-sm text-error-600">Elegí una medida entre 1,5 y 20 cm.</p>
        ) : (
          <div className="mt-3">
            <Legibility moduleMm={info.moduleMm} />
          </div>
        )}
      </div>

      {/* Tamaño real aproximado sobre el equipo */}
      {cm !== null && (
        <div>
          <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">Así queda en el equipo</p>
          <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 p-4 dark:from-gray-700 dark:to-gray-800">
            <div
              className="rounded-[3px] bg-white shadow-md [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
              style={{ width: `min(${cm}cm, 100%)`, aspectRatio: '1' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">Tamaño aproximado en pantalla. Al imprimir sale exacto.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <button type="button" onClick={downloadPng} disabled={!cm || downloading} className={btnPrimaryCls}>
          <Download className="h-4 w-4" />
          {downloading ? 'Generando...' : `Descargar PNG${cm ? ` ${cm}×${cm} cm` : ''}`}
        </button>
        <button type="button" onClick={downloadSvg} disabled={!cm || !svg} className={btnSecondaryCls}>
          SVG
        </button>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        El PNG sale a 600 dpi, listo para imprimir. El SVG es para imprenta o etiquetadora.
      </p>
    </Card>
  )
}
