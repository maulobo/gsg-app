/**
 * Páginas de descargables (QR) - Página → PDFs
 */

export type DownloadPage = {
  id: number
  slug: string
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DownloadFile = {
  id: number
  download_page_id: number
  title: string
  path: string
  size_bytes: number | null
  display_order: number
  created_at: string
}

export type DownloadPageFull = DownloadPage & { download_files: DownloadFile[] }
