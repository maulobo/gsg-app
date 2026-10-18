import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { DownloadPageFull } from '../types'

const DOWNLOAD_PAGE_SELECT = `
  *,
  download_files ( * )
`

function sortFiles(page: DownloadPageFull): DownloadPageFull {
  return {
    ...page,
    download_files: [...(page.download_files || [])].sort((a, b) => a.display_order - b.display_order || a.id - b.id),
  }
}

/**
 * Get all download pages (incluye inactivas) con sus PDFs
 */
export async function getDownloadPages(): Promise<DownloadPageFull[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('download_pages')
    .select(DOWNLOAD_PAGE_SELECT)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getDownloadPages error:', error)
    throw new Error(error.message)
  }

  return ((data ?? []) as DownloadPageFull[]).map(sortFiles)
}

/**
 * Get a single download page by slug
 */
export async function getDownloadPageBySlug(slug: string): Promise<DownloadPageFull | null> {
  if (!slug) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('download_pages')
    .select(DOWNLOAD_PAGE_SELECT)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('getDownloadPageBySlug error:', error)
    return null
  }

  return sortFiles(data as DownloadPageFull)
}
