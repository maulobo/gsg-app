import slugify from 'slugify'

/**
 * Slug de una página de descargas: va en la URL y en los QR impresos
 */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Más corto = QR menos denso = se puede imprimir más chico
export const SLUG_RECOMMENDED_MAX = 12

export function suggestSlug(title: string): string {
  return slugify(title, { lower: true, strict: true })
}

export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s)
}

/**
 * "catalogo_fuentes-2026.pdf" → "catalogo fuentes 2026"
 */
export function titleFromFilename(name: string): string {
  return name
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
