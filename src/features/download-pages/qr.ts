import QRCode from 'qrcode'

/**
 * Generación de QR imprimibles para las páginas de descargas.
 * Sin servicios externos: el QR apunta directo al dominio de la web.
 */

// Sin "www" para que el QR tenga menos cuadraditos; gsgdesign.com.ar redirige (308) a www conservando el path
export const WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://gsgdesign.com.ar'

export const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' },
} as const

export const MIN_CM = 1.5
export const MAX_CM = 20
export const PRESETS_CM = [2, 3, 5]
export const PRINT_DPI = 600

export function buildDownloadUrl(slug: string, base: string = WEB_BASE_URL): string {
  return `${base.replace(/\/+$/, '')}/descargas/${slug}`
}

/**
 * Acepta "2,5" o "2.5"; null si no es número o está fuera de rango
 */
export function parseCm(input: string | number): number | null {
  const raw = typeof input === 'number' ? String(input) : input.trim().replace(',', '.')
  if (raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < MIN_CM || n > MAX_CM) return null
  return n
}

export function cmToPx(cm: number, dpi: number = PRINT_DPI): number {
  return Math.round((cm / 2.54) * dpi)
}

/**
 * Versión del QR, módulos por lado (sin margen) y cuánto mide cada módulo impreso a `cm`
 */
export function qrInfo(url: string, cm: number): { version: number; modules: number; moduleMm: number } {
  const qr = QRCode.create(url, QR_OPTIONS)
  const modules = qr.modules.size
  return { version: qr.version, modules, moduleMm: (cm * 10) / (modules + 2 * QR_OPTIONS.margin) }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/**
 * Escribe el chunk pHYs (dpi) para que el PNG se imprima al tamaño real.
 * Lo inserta después de IHDR, o reemplaza uno existente.
 */
export function setPngDpi(png: Uint8Array, dpi: number): Uint8Array {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  const ihdrEnd = 8 + 8 + view.getUint32(8) + 4

  // Buscar un pHYs existente
  let offset = 8
  let existing: { start: number; end: number } | null = null
  while (offset < png.length) {
    const len = view.getUint32(offset)
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    const end = offset + 12 + len
    if (type === 'pHYs') {
      existing = { start: offset, end }
      break
    }
    if (type === 'IDAT' || type === 'IEND') break
    offset = end
  }

  const chunk = new Uint8Array(21)
  const cv = new DataView(chunk.buffer)
  const ppm = Math.round(dpi / 0.0254)
  cv.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4) // "pHYs"
  cv.setUint32(8, ppm)
  cv.setUint32(12, ppm)
  chunk[16] = 1 // unidad: metro
  cv.setUint32(17, crc32(chunk.subarray(4, 17)))

  const start = existing ? existing.start : ihdrEnd
  const end = existing ? existing.end : ihdrEnd
  const out = new Uint8Array(png.length - (end - start) + chunk.length)
  out.set(png.subarray(0, start), 0)
  out.set(chunk, start)
  out.set(png.subarray(end), start + chunk.length)
  return out
}

/**
 * Fija el tamaño físico del SVG en mm (mantiene el viewBox)
 */
export function svgWithSize(svg: string, cm: number): string {
  const mm = `${+(cm * 10).toFixed(2)}mm`
  return svg.replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
    const clean = attrs.replace(/\s(width|height)="[^"]*"/g, '')
    return `<svg${clean} width="${mm}" height="${mm}">`
  })
}

export function qrFileName(slug: string, cm: number, ext: 'png' | 'svg'): string {
  return `qr-${slug}-${cm}x${cm}cm.${ext}`
}
