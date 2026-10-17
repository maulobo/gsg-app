import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDownloadPageBySlug } from '@/features/download-pages/queries'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import DownloadPageForm from '@/components/download-pages/DownloadPageForm'
import { StatusPill, btnSecondaryCls } from '@/components/download-pages/ui'
import { buildDownloadUrl } from '@/features/download-pages/qr'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getDownloadPageBySlug(slug)
  return { title: page?.title ? `Editar ${page.title}` : 'Editar página de descargas' }
}

export default async function EditDownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getDownloadPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <Link
        href="/download-pages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        QR Descargables
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{page.title}</h1>
          <StatusPill active={page.is_active} />
        </div>
        <a href={buildDownloadUrl(page.slug)} target="_blank" rel="noopener noreferrer" className={btnSecondaryCls}>
          <ExternalLink className="h-4 w-4" />
          Ver en la web
        </a>
      </div>
      <DownloadPageForm page={page} />
    </div>
  )
}
